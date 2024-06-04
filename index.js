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
            processStream(stream);
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
        const jsonStr = decoder.decode(new Uint8Array(chunks.reduce((acc, val) => [...acc, ...val], [])));
        const imageData = JSON.parse(jsonStr);

        const img = document.createElement('img');
        img.src = `data:${imageData.mimeType};base64,${imageData.image}`;
        document.getElementById('imageContainer').appendChild(img);
    } catch (e) {
        console.error('Failed to process stream:', e);
    }
}