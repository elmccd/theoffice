const uuid = require('uuid');

exports.getOtherPeersIds = (wssClients, clientId) => {
  const clients = Array.from(wssClients);

  return clients.filter((client) => client.TO_id !== clientId).map((client) => client.TO_id);
};

exports.getPeerWSById = (wssClients, peerId) => {
  const client = Array.from(wssClients).find((client) => client.TO_id === peerId);

  if (!client) {
    throw new Error(`Tried to connect to non existing peer ID: ${peerId}`);
  }

  return client;
};

exports.getClientsMetaData = (wssClients) => {
  const map = {};

  Array.from(wssClients).forEach((client) => {
    map[client.TO_id] = client.TO_meta;
  });

  return map;
};

exports.generateClientId = () => {
  return `client-${uuid.v4()}`;
};
