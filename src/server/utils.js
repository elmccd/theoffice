const uuid = require('uuid');

exports.getOtherPeersIds = (wssClients, clientId) => {
    const clients = Array.from(wssClients.values());

    return clients
        .filter(client => client.id !== clientId)
        .map(client => client.id)
};

exports.getPeerWSById = (wssClients, peerId) => {
    const client = Array.from(wssClients.values())
        .find(client => client.id === peerId);

    if (!client) {
        throw new Error(`Tried to connect to non existing peer ID: ${peerId}`)
    }

    return client;
};


exports.generateClientId = () => {
    return `client-${uuid.v4()}`;
};
