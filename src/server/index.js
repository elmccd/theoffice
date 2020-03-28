const WebSocket = require('ws');

const {globalMessageHandler} = require("./ws-global-message-handler");
const {getOtherPeersIds, generateClientId} = require('./utils');
const {send, debugWSMessages} = require('./ws-utils');

const wss = new WebSocket.Server({port: 8888});

wss.on('connection', function connection(ws) {
    ws.id = generateClientId();

    debugWSMessages(ws);

    ws.on('message', messageRaw => globalMessageHandler(messageRaw, wss.clients));

    send(ws, {
        topic: 'wsConnectionInitiated',
        id: ws.id,
        content: {
            otherConnectedPeers: getOtherPeersIds(wss.clients, ws.id),
        },
    });
});