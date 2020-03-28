const WebSocket = require('ws');

const { send } = require('./ws-utils');
const { getPeerWSById, getClientsMetaData } = require('./utils');
const { MESSAGES } = require('./ws-messages');

exports.webRTCOfferMessageHandler = ({ message, wssClients }) => {
  const targetPeerWS = getPeerWSById(wssClients, message.peerId);

  if (targetPeerWS.readyState !== WebSocket.OPEN) {
    console.log('Another peer readyState not OPENED, not sure what it means yet.');
    return;
  }

  send(targetPeerWS, {
    topic: MESSAGES.webRTCOffer,
    content: message.content,
    clientAuthorId: message.id,
  });
};

exports.webRTCAnswerMessageHandler = ({ message, wssClients }) => {
  const targetPeerWS = getPeerWSById(wssClients, message.peerId);

  if (targetPeerWS.readyState !== WebSocket.OPEN) {
    console.error('Another peer readyState not OPENED, not sure what it means yet.');
    return;
  }

  send(targetPeerWS, {
    topic: MESSAGES.webRTCAnswer,
    content: message.content,
    clientAuthorId: message.id,
  });
};

exports.userMetaDataMessageHandler = ({ message, wssClients, ws }) => {
  const client = getPeerWSById(wssClients, ws.TO_id);

  client.TO_meta = message.content;

  wssClients.forEach((_client) => {
    if (_client.readyState !== WebSocket.OPEN) {
      console.error('Another peer readyState not OPENED, not sure what it means yet.');
      return;
    }

    send(_client, {
      topic: MESSAGES.userMetaData,
      content: getClientsMetaData(wssClients),
      clientAuthorId: message.id,
    });
  });
};
