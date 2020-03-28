import Peer from 'simple-peer';
import { sendToSocket } from './client-ws-utils';
import { random } from './utils';

if (!Peer.WEBRTC_SUPPORT) {
  alert("WebRTC not supported :( It's not gonna work. Try latest Chrome or something.");
}

if (!WebSocket) {
  alert("WebSocket not supported :( It's not gonna work. Try latest Chrome or something.");
}

const clientNickname = window.prompt('Enter your name') || random();

const userMetaData = {
  nickName: clientNickname,
};

/**
 * @type {{peerId, p, video, nickname}[]}
 */
const state = {
  myVideoStream: null,
  clientId: null,
  channel: null,
  connectedPeers: [],
  connectedPeersChannels: {},
  connectedPeersMeta: {},
};



document.querySelector('#channel').addEventListener('change', (e) => {
  state.channel = e.target.value || null;

  sendToSocket(socket, {
    topic: 'changeChannel',
    content: state.channel,
  });
});

window._state = state;

// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8888');

// Connection opened
socket.addEventListener('open', function () {
  console.log('Socket connection opened');

  sendToSocket(socket, {
    topic: 'userMetaData',
    content: userMetaData,
  });
});

// Listen for messages
socket.addEventListener('message', function (event) {
  const message = JSON.parse(event.data);

  console.log(`got WS message "${message.topic}", message:`, message);

  // message received by newly connected user
  // init webRTC if there are other peers to connect
  // if you are the first person do nothing, wait for others to connect to you
  if (message.topic === 'wsConnectionInitiated') {
    state.clientId = message.id;

    // get video/voice stream
    navigator.getUserMedia(
      {
        video: true,
        audio: true,
      },
      (stream) => {
        state.myVideoStream = stream;
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

    const peer = state.connectedPeers.find(({ peerId }) => peerId === message.clientAuthorId);

    console.log('Signaling answer...');
    peer.p.signal(message.content);
    return;
  }

  if (message.topic === 'userChangedChannel') {
    console.log(`userChangedChannel`, message);

    state.connectedPeersChannels = message.content.peersChannels;
    renderVideos();
  }
  if (message.topic === 'userMetaData') {
    console.log(`userMetaData changed`, message);

    state.connectedPeersMeta = message.content;
    renderVideos();
  }
});


function showMyCameraPreview() {
  if (!state.myVideoStream) {
    throw new Error('Tried to show preview of not existing stream');
  }

  document.querySelector('#me').srcObject = state.myVideoStream;
}

function removePeer(id) {
  const peer = state.connectedPeers.find(({ peerId }) => peerId === id);
  state.connectedPeers.splice(state.connectedPeers.indexOf(peer), 1);
  console.log('Peer removed. Connected peers: ', state.connectedPeers);
}

function createVideoDOMElement() {
  return document.createElement('video');
}

function acceptWebRTCOfferFromAnotherPeer({ content, clientAuthorId }) {
  const p = new Peer({
    initiator: false,
    trickle: false,
    stream: state.myVideoStream,
  });

  const peerObject = {
    peerId: clientAuthorId,
    p,
    video: createVideoDOMElement(),
  };

  state.connectedPeers.push(peerObject);

  p.on('signal', (data) => {
    console.log('Sending answer to WS');

    sendToSocket(socket, {
      topic: 'webRTCAnswer',
      content: JSON.stringify(data),
      id: state.clientId,
      peerId: clientAuthorId,
    });
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

  const peerObject = {
    peerId,
    p,
    video: createVideoDOMElement(),
  };

  state.connectedPeers.push(peerObject);

  p.on('signal', (data) => {
    console.log('Sending offer to WS');

    sendToSocket(socket, {
      topic: 'webRTCOffer',
      content: JSON.stringify(data),
      id: state.clientId,
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
    renderVideos();
  });

  p.on('error', (err) => {
    console.error('Peer error:', err);
  });

  p.on('close', () => {
    console.log('Peer connection closed. Removing peer.');
    removePeer(peerId);
    renderVideos();
  });
}

function renderVideos() {
  console.log('renderVideos');

  document.getElementById('remote-streams').innerHTML = '';

  state.connectedPeers.forEach(peer => {
    if (state.connectedPeersChannels[peer.peerId] !== state.channel) {
      return;
    }
    const div = document.createElement('div');
    const header = document.createElement('h3');
    header.textContent = state.connectedPeersMeta[peer.peerId].nickName;

    div.appendChild(header);
    div.appendChild(peer.video);
    document.getElementById('remote-streams').appendChild(div);

    if (document.body.contains(peer.video)) {
      peer.video.play();
    } else {
      peer.video.pause();
    }
  })
}

