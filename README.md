# webtransport-go-pic

## Requirements

- go 1.21

## Usage
- clone this repo
```
git clone https://github.com/jaehooni/webtransport-go-video.git
```
- Follow the installation instructions of [mkcert](https://github.com/FiloSottile/mkcert)
- create `localhost.pem` and `localhost-key.pem`
```
cd webtransport-go-video
mkcert -install
mkcert localhost
sudo sysctl -w net.core.rmem_max=7500000
sudo sysctl -w net.core.wmem_max=7500000
```

- (Google Chrome) Enable WebTransport Developer Mode
  - [chrome://flags/#webtransport-developer-mode](chrome://flags/#webtransport-developer-mode)

- run `go run main.go`

----------------------------------------------------------------------------------------
sudo snap install chromium

sudo apt-get install libnss3-tools

sudo apt-get install mkcert

cd webtransport-go-chat

mkcert -install

chromium index.html
