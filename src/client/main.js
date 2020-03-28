import Peer from 'simple-peer';
import {sendToSocket} from "./client-ws-utils";

if (!Peer.WEBRTC_SUPPORT) {
  alert("WebRTC not supported :( It's not gonna work. Try latest Chrome or something.");
}

if (!WebSocket) {
  alert("WebSocket not supported :( It's not gonna work. Try latest Chrome or something.");
}

/**
 * @type {{peerId, p, video}[]}
 */
const connectedPeers = [];

let myVideoStream;

// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8888');

let clientId;

// Connection opened
socket.addEventListener('open', function () {
  console.log('Socket connection opened');
});

// Listen for messages
socket.addEventListener('message', function (event) {
  const message = JSON.parse(event.data);

  console.log(`got WS message "${message.topic}", message:`, message);

  // message received by newly connected user
  // init webRTC if there are other peers to connect
  // if you are the first person do nothing, wait for others to connect to you
  if (message.topic === 'wsConnectionInitiated') {
    clientId = message.id;

    // get video/voice stream
    navigator.getUserMedia(
      {
        video: true,
        audio: true,
      },
      (stream) => {
        myVideoStream = stream;
        showMyCameraPreview();

        message.content.otherConnectedPeers.forEach((peerId) => {
          initWebRTCToExistingPeer(stream, { peerId });
        });
      },
      (err) => {
        console.error('getUserMedia failed', err);
      }
    );
    return;
  }

  if (message.topic === 'webRTCOffer') {
    if (!message.clientAuthorId) {
      throw new Error('Invalid clientAuthorId');
    }

    console.log(`Received offer from ${message.clientAuthorId}`);
    console.log('Creating peer connection...');
    acceptWebRTCOfferFromAnotherPeer(message);
    return;
  }

  if (message.topic === 'webRTCAnswer') {
    if (!message.clientAuthorId) {
      throw new Error('Invalid clientAuthorId');
    }

    console.log(`Received answer from ${message.clientAuthorId}`);

    const peer = connectedPeers.find(({ peerId }) => peerId === message.clientAuthorId);

    console.log('Signaling answer...');
    peer.p.signal(message.content);
    return;
  }
});

function showMyCameraPreview() {
  if (!myVideoStream) {
    throw new Error('Tried to show preview of not existing stream');
  }

  document.querySelector('#me').srcObject = myVideoStream;
}

function removePeer(id) {
  const peer = connectedPeers.find(({ peerId }) => peerId === id);
  peer.video.remove();

  connectedPeers.splice(connectedPeers.indexOf(peer), 1);
  console.log('Peer removed. Connected peers: ', connectedPeers);
}

function addRemoteVideoDOMElement() {
  const video = document.createElement('video');
  document.getElementById('remote-streams').appendChild(video);
  return video;
}

function acceptWebRTCOfferFromAnotherPeer({ content, clientAuthorId }) {
  const p = new Peer({
    initiator: false,
    trickle: false,
    stream: myVideoStream,
  });

  const video = addRemoteVideoDOMElement();
  const peerObject = {
    peerId: clientAuthorId,
    p,
    video,
  };

  connectedPeers.push(peerObject);

  p.on('signal', (data) => {
    console.log('Sending answer to WS');

    socket.send(
      JSON.stringify(
        {
          topic: 'webRTCAnswer',
          content: JSON.stringify(data),
          id: clientId,
          peerId: clientAuthorId,
        },
        null,
        2
      )
    );
  });

  handleCommonPeerEvents(peerObject);

  // immediately signal offer to newly created peer
  p.signal(content);
}

function initWebRTCToExistingPeer(stream, { peerId }) {
  const p = new Peer({
    initiator: true,
    trickle: false,
    stream: stream,
  });

  const video = addRemoteVideoDOMElement();
  const peerObject = {
    peerId,
    p,
    video,
  };

  connectedPeers.push(peerObject);

  p.on('signal', (data) => {
    console.log('Sending offer to WS');

    sendToSocket(socket,{
      topic: 'webRTCOffer',
      content: JSON.stringify(data),
      id: clientId,
      peerId,
    });
  });

  handleCommonPeerEvents(peerObject);
}

function handleCommonPeerEvents({ p, video, peerId }) {
  p.on('connect', () => {
    console.log('CONNECT');
  });

  p.on('stream', (remoteStream) => {
    console.log('got stream');
    video.srcObject = remoteStream;
    video.play();
  });

  p.on('error', (err) => {
    console.error('Peer error:', err);
  });

  p.on('close', () => {
    console.log('Peer connection closed. Removing peer.');
    removePeer(peerId);
  });
}

