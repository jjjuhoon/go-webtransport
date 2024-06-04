package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
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

		// 이미지 파일을 읽고 Base64로 인코딩
		imageFile, err := os.Open("후쿠오카.jpg")
		if err != nil {
			log.Printf("Failed to open image file: %v", err)
			return
		}
		defer imageFile.Close()

		imageData, err := ioutil.ReadAll(imageFile)
		if err != nil {
			log.Printf("Failed to read image file: %v", err)
			return
		}
		encodedData := base64.StdEncoding.EncodeToString(imageData)

		// MIME 타입과 인코딩된 데이터를 함께 JSON 형식으로 스트림에 전송
		responseData := struct {
			MimeType string `json:"mimeType"`
			Data     string `json:"data"`
		}{
			MimeType: "image/jpeg", // MIME 타입 지정
			Data:     encodedData,  // 인코딩된 이미지 데이터
		}

		if err := json.NewEncoder(stream).Encode(responseData); err != nil {
			log.Printf("Failed to send encoded image: %v", err)
			return
		}

		log.Println("Image streaming completed")
	})

	log.Println("Starting WebTransport server on :4433")
	log.Fatal(wt.ListenAndServeTLS("localhost.pem", "localhost-key.pem"))
}
