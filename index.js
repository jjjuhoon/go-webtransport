const url = "https://localhost:4433/video";
let transport = null;

async function getTransport() {
  if (transport !== null) {
    await transport.ready;
    return transport;
  }
  transport = new WebTransport(url);
  await transport.ready;
  transport.closed
    .then(() => {
      console.log('Connection closed normally.');
      transport = null;
    })
    .catch(() => {
      console.error('Connection closed abruptly.');
      transport = null;
    });
  return transport;
}

// function addMessageElement(name, message) {
//   const wrap = document.createElement('div');
//   wrap.className = 'columns';
//   const nameDiv = document.createElement('div');
//   nameDiv.className = 'column is-1';
//   nameDiv.innerText = name;
//   const messageDiv = document.createElement('div');
//   messageDiv.className = 'column is-11';
//   messageDiv.innerText = message;
//   wrap.appendChild(nameDiv);
//   wrap.appendChild(messageDiv);

//   const messages = document.getElementById('messages');
//   messages.prepend(wrap);
// }

// async function sendMessage(name, message) {
//   const transport = await getTransport();
//   const encoder = new TextEncoder();
//   const stream = await transport.createUnidirectionalStream();
//   const writer = stream.getWriter();
//   const body = { name, message };
//   await writer.write(encoder.encode(JSON.stringify(body)));
//   await writer.close();
// }

async function onSend() {
  // const nameElement = document.getElementById('name');
  // const messageElement = document.getElementById('message');
  // const name = nameElement.value;
  // const message = messageElement.value;
  // messageElement.value = '';
  const transport = await getTransport();
  const encoder = new TextEncoder();
  const stream = await transport.createUnidirectionalStream();
  const writer = stream.getWriter();
  const body = {};
  await writer.write(encoder.encode(JSON.stringify(body)));
  await writer.close();

  // await sendMessage(name, message);
}

// async function recieveMessage(stream) {
//   let body = '';
//   const decoder = new TextDecoderStream('utf-8');
//   const reader = stream.pipeThrough(decoder).getReader();
//   try {
//     while (true) {
//       const { value, done } = await reader.read();
//       if (done) {
//         reader.cancel();
//         break;
//       }
//       body += value;
//     }
//   } catch (e) {
//     console.error(e);
//   }
//   reader.cancel();
//   const message = JSON.parse(body);
//   addMessageElement(message.name, message.message);
// }

async function waitVideo() {
  const transport = await getTransport();
  const stream = transport.incomingUnidirectionalStreams;
  const reader = stream.getReader();
  console.log(reader);

  while (true){
    const { done, value } = await reader.read();
    if (done){
      break;
    }  

    console.log(value);
    await recieveVideo(value);
  }

}

async function recieveVideo(stream) {
  const reader = stream.getReader();
  console.log(typeof(reader));
  const mediaSource = new MediaSource();

  const player = document.getElementById('player');
  player.srcObject = mediaSource;

  const sourceBuffer = mediaSource.addSourceBuffer('video/mp4');
  sourceBuffer.appendBuffer(reader);
  
}

// async function waitMessage() {
//   const transport = await getTransport();
//   const stream = transport.incomingUnidirectionalStreams;
//   const reader = stream.getReader();
//   while (true) {
//     reader.closed.then(() => {
//       console.log('The receiveStream closed gracefully.');
//     }).catch(() => {
//       console.error('The receiveStream closed abruptly.');
//     });
//     const { value, done } = await reader.read();
//     if (done) {
//       break;
//     }
//     recieveMessage(value);
//   }
// }

function init() {
  document.getElementById('send').addEventListener('click', onSend);
  waitVideo();
};

document.addEventListener('DOMContentLoaded', init);
