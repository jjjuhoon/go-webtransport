package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"path/filepath"
	"time"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

func getFiles(folderPath string) ([]string, error) {
	var files []string
	for i := 0; i <= 30; i++ {
		file := filepath.Join(folderPath, fmt.Sprintf("frame_%d.jpg", i))
		files = append(files, file)
	}
	return files, nil
}

func calculateJitter(delays []time.Duration) time.Duration {
	if len(delays) < 2 {
		return 0 // Jitter 계산 불가
	}
	var sum time.Duration
	var count int
	previousDelay := delays[0]
	for _, currentDelay := range delays[1:] {
		sum += time.Duration(math.Abs(float64(currentDelay - previousDelay)))
		previousDelay = currentDelay
		count++
	}
	return sum / time.Duration(count) // 평균 Jitter 반환
}

func main() {
	wt := webtransport.Server{
		H3: http3.Server{
			Addr: ":4433",
		},
		CheckOrigin: func(r *http.Request) bool {
			return true // 모든 오리진 허용
		},
	}

	http.HandleFunc("/images", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Image request received")
		session, err := wt.Upgrade(w, r)
		if err != nil {
			log.Printf("Failed to upgrade: %s", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		imageFiles, err := getFiles("images-folder")
		if err != nil {
			log.Printf("Failed to list image files: %v", err)
			return
		}

		start := time.Now()
		totalBytes := 0
		delays := []time.Duration{}

		for _, imageFileName := range imageFiles {
			fmt.Printf("Sending file: %s\n", imageFileName) // 디버깅 로그 추가

			startTime := time.Now()
			stream, err := session.OpenUniStream()
			if err != nil {
				log.Printf("Failed to open unidirectional stream: %s", err)
				return
			}

			imageFile, err := ioutil.ReadFile(imageFileName)
			if err != nil {
				log.Printf("Failed to read image file: %v", err)
				stream.Close()
				continue
			}

			encodedImage := base64.StdEncoding.EncodeToString(imageFile)
			metadata := struct {
				MimeType string `json:"mimeType"`
				Image    string `json:"image"`
			}{
				MimeType: "image/jpeg",
				Image:    encodedImage,
			}

			encoder := json.NewEncoder(stream)
			if err := encoder.Encode(&metadata); err != nil {
				log.Printf("Failed to send metadata and image: %v", err)
			}
			stream.Close()

			endTime := time.Now()
			delay := endTime.Sub(startTime)
			delays = append(delays, delay)

			totalBytes += len(imageFile)

			time.Sleep(100 * time.Millisecond) // 0.1초 대기
		}

		duration := time.Since(start)
		throughput := float64(totalBytes) / duration.Seconds()

		jitter := calculateJitter(delays)

		log.Printf("Total bytes: %d, Duration: %v, Throughput: %f Bps, Jitter: %v", totalBytes, duration, throughput, jitter)

		log.Println("All images have been sent")
	})

	log.Println("Starting WebTransport server on :4433")
	log.Fatal(wt.ListenAndServeTLS("localhost.pem", "localhost-key.pem"))
}
