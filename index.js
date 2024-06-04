document.addEventListener('DOMContentLoaded', async () => {
    const url = 'https://localhost:4433/image';
    let transport;

    try {
        transport = new WebTransport(url);
        await transport.ready;
        console.log('WebTransport session established.');
    } catch (e) {
        console.error('Failed to establish WebTransport session:', e);
        return;
    }

    const reader = transport.incomingUnidirectionalStreams.getReader();
    const { value: stream } = await reader.read();
    const streamReader = stream.getReader();
    const chunks = [];

    try {
        while (true) {
            const { done, value } = await streamReader.read();
            if (done) {
                console.log('Stream reader done.');
                break;
            }
            chunks.push(value);
        }

        // 모든 청크를 하나의 Uint8Array로 결합
        const combinedChunks = concatenateUint8Arrays(chunks);
        const decoder = new TextDecoder("utf-8");
        const jsonDataStr = decoder.decode(combinedChunks);
        const jsonData = JSON.parse(jsonDataStr);

        // Base64 문자열을 이미지로 변환
        const imageData = jsonData.data;
        const imageMimeType = jsonData.mimeType;
        const imageBlob = b64toBlob(imageData, imageMimeType);
        document.getElementById('imageDisplay').src = URL.createObjectURL(imageBlob);
    } catch (e) {
        console.error('Failed to process stream:', e);
    }
});

// Uint8Array 배열을 하나의 Uint8Array로 결합하는 함수
function concatenateUint8Arrays(arrays) {
    let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
    let result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach(array => {
        result.set(array, offset);
        offset += array.length;
    });
    return result;
}

// Base64 문자열을 Blob 객체로 변환하는 함수
function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}
