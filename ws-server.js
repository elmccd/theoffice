const uuid = require('uuid');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8888 });

const getOtherPeersIds = (wssClients, clientId) => {
    const clients = Array.from(wssClients.values());

    return clients
        .filter(client => client.id !== clientId)
        .map(client => client.id)
};

const getPeerWSById = (wssClients, peerId) => {
    const client = Array.from(wssClients.values())
        .find(client => client.id === peerId);

    if (!client) {
        throw new Error(`Tried to connect to non existing peer ID: ${peerId}`)
    }

    return client;
};

wss.on('connection', function connection(ws) {
    ws.id = `client-${uuid.v4()}`;

    ws.on('message', function incoming(messageRaw) {
        console.log(`Got: ${messageRaw}`);

        let message;

        try {
            message = JSON.parse(messageRaw);
        } catch (err) {
            console.log('Could not parse message as JSON!, got', messageRaw);
            return;
        }

        if (message.topic === 'webRTCOffer') {
            const targetPeer = message.peerId;
            const targetPeerWS = getPeerWSById(wss.clients, targetPeer);

            if (targetPeerWS.readyState !== WebSocket.OPEN) {
                console.log('Another peer readyState not OPENED, not sure what it means yet.');
                return;
            }

            targetPeerWS.send(JSON.stringify({
                topic: 'webRTCOffer',
                content: message.content,
                clientAuthorId: message.id,
            }));
        }

        if (message.topic === 'webRTCAnswer') {
            const targetPeerWS = getPeerWSById(wss.clients, message.peerId);

            if (targetPeerWS.readyState !== WebSocket.OPEN) {
                console.log('Another peer readyState not OPENED, not sure what it means yet.');
                return;
            }

            targetPeerWS.send(JSON.stringify({
                topic: 'webRTCAnswer',
                content: message.content,
                clientAuthorId: message.id,
            }));
        }
    });

    const otherConnectedPeers = getOtherPeersIds(wss.clients, ws.id);

    ws.send(JSON.stringify({
        topic: 'wsConnectionInitiated',
        id: ws.id,
        content: {
            otherConnectedPeers,
        },
    }));
});