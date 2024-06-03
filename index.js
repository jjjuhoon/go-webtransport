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
    let metadataReceived = false;

    try {
        while (true) {
            const { done, value } = await streamReader.read();
            if (done) {
                console.log('Stream reader done.');
                break;
            }
            if (!metadataReceived) {
                const decoder = new TextDecoder("utf-8");
                const metadataStr = decoder.decode(value);
                const metadataEndIndex = metadataStr.indexOf('\n');
                if (metadataEndIndex !== -1) {
                    const metadata = JSON.parse(metadataStr.slice(0, metadataEndIndex));
                    console.log('Metadata received:', metadata);
                    metadataReceived = true;
                    const remainingData = value.slice(metadataEndIndex + 1);
                    if (remainingData.byteLength > 0) {
                        chunks.push(remainingData);
                    }
                }
            } else {
                chunks.push(value);
            }
        }

        const blob = new Blob(chunks, { type: 'image/jpeg' });
        document.getElementById('imageDisplay').src = URL.createObjectURL(blob);
    } catch (e) {
        console.error('Failed to process stream:', e);
    }
});
