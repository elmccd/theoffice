const {
  webRTCAnswerMessageHandler,
  webRTCOfferMessageHandler,
  userMetaDataMessageHandler,
} = require('./ws-message-handlers');

const messagesHandlers = {
  webRTCOffer: webRTCOfferMessageHandler,
  webRTCAnswer: webRTCAnswerMessageHandler,
  userMetaData: userMetaDataMessageHandler,
};

exports.globalMessageHandler = (messageRaw, ws, wssClients) => {
  let message = JSON.parse(messageRaw);

  if (!messagesHandlers[message.topic]) {
    throw new Error(`Unrecognized message topic: ${message.topic}`);
  }

  messagesHandlers[message.topic]({
    message,
    ws,
    wssClients: wssClients,
  });
};
