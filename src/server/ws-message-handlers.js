const WebSocket = require('ws');

const {send} = require("./ws-utils");
const {getPeerWSById} = require("./utils");
const {MESSAGES} = require("./ws-messages");

exports.webRTCOfferMessageHandler = ({message, wssClients}) => {
    const targetPeer = message.peerId;
    const targetPeerWS = getPeerWSById(wssClients, targetPeer);

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

exports.webRTCAnswerMessageHandler = ({message, wssClients}) => {
    const targetPeerWS = getPeerWSById(wssClients, message.peerId);

    if (targetPeerWS.readyState !== WebSocket.OPEN) {
        console.log('Another peer readyState not OPENED, not sure what it means yet.');
        return;
    }

    send(targetPeerWS, {
        topic: MESSAGES.webRTCAnswer,
        content: message.content,
        clientAuthorId: message.id,
    });
};