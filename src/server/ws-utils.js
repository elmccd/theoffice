exports.send = (ws, message) => {
    if (!message.topic) {
        throw new Error(`Tried to send message without topic!, got: ${topic}`);
    }

    ws.send(JSON.stringify(message, null, 2));
};

exports.debugWSMessages = (ws) => {
    ws.on('message', (messageRaw) => {
        console.log(`Got: ${messageRaw}`);
    });
};