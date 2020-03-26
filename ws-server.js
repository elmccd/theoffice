const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8888 });

wss.on('connection', function connection(ws) {
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
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        topic: 'webRTCOffer',
                        content: message.content,
                        clientAuthorId: message.id,
                    }));
                }
            });
        }

        if (message.topic === 'webRTCAnswer') {
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        topic: 'webRTCAnswer',
                        content: message.content,
                        clientAuthorId: message.id,
                    }));
                }
            });
        }
    });

    if (wss.clients.size === 1) {

    }

    ws.send(JSON.stringify({
        topic: 'initiateWebRTC',
        content: {
            id: require('uuid').v4(),
            initiator: wss.clients.size !== 1,
        },
    }));
});