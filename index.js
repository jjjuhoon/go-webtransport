document.addEventListener('DOMContentLoaded', async () => {
    const url = 'https://localhost:4433/images';
    let transport;

    try {
        transport = new WebTransport(url);
        await transport.ready;
        console.log('WebTransport session established for multiple images.');
    } catch (e) {
        console.error('Failed to establish WebTransport session:', e);
        return;
    }

    const reader = transport.incomingUnidirectionalStreams.getReader();

    try {
        while (true) {
            const { done, value: stream } = await reader.read();
            if (done) {
                console.log('All streams processed.');
                break;
            }
            await processStream(stream); // 비동기적으로 처리
        }
    } catch (e) {
        console.error('Failed to receive streams:', e);
    }
});

async function processStream(stream) {
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

        const decoder = new TextDecoder("utf-8");
        const jsonStr = decoder.decode(concatenateUint8Arrays(chunks));
        const imageData = JSON.parse(jsonStr);

        const img = document.getElementById('frame');
        img.src = `data:${imageData.mimeType};base64,${imageData.image}`;
        await new Promise(resolve => setTimeout(resolve, 100)); // 0.1초 대기
    } catch (e) {
        console.error('Failed to process stream:', e);
    }
}

function concatenateUint8Arrays(arrays) {
    let totalLength = arrays.reduce((sum, value) => sum + value.length, 0);
    let result = new Uint8Array(totalLength);
    let offset = 0;
    arrays.forEach(array => {
        result.set(array, offset);
        offset += array.length;
    });
    return result;
}
