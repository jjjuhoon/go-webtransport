package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

func main() {
	wt := webtransport.Server{
		H3: http3.Server{
			Addr: ":4433",
		},
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	http.HandleFunc("/image", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request in!!!")
		session, err := wt.Upgrade(w, r)
		if err != nil {
			log.Printf("Upgrading failed: %s", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		stream, err := session.OpenUniStream()
		if err != nil {
			log.Printf("Failed to open unidirectional stream: %s", err)
			return
		}
		defer stream.Close()

		// 메타데이터 JSON 인코딩 및 전송
		metadata := struct {
			MimeType string `json:"mimeType"`
		}{
			MimeType: "image/jpeg",
		}
		encoder := json.NewEncoder(stream)
		if err := encoder.Encode(&metadata); err != nil {
			log.Printf("Failed to send metadata: %v", err)
			return
		}

		// 이미지 파일 데이터 전송
		imageFile, err := os.Open("후쿠오카.jpg")
		if err != nil {
			log.Printf("Failed to open image file: %v", err)
			return
		}
		defer imageFile.Close()

		buffer := make([]byte, 1024)
		for {
			n, err := imageFile.Read(buffer)
			if err != nil {
				if err.Error() == "EOF" {
					log.Println("Finished reading image file")
					break
				}
				log.Printf("Failed to read image file: %v", err)
				return
			}

			_, err = stream.Write(buffer[:n])
			if err != nil {
				log.Printf("Failed to write to stream: %v", err)
				return
			}
		}
		log.Println("Image streaming completed")
	})

	log.Println("Starting WebTransport server on :4433")
	log.Fatal(wt.ListenAndServeTLS("localhost.pem", "localhost-key.pem"))
}
