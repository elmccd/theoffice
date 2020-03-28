const { MESSAGES } = require('./ws-messages');

const {
  webRTCAnswerMessageHandler,
  webRTCOfferMessageHandler,
  userMetaDataMessageHandler,
  changeChannelMessageHandler,
} = require('./ws-message-handlers');

const messagesHandlers = {
  [MESSAGES.webRTCOffer]: webRTCOfferMessageHandler,
  [MESSAGES.webRTCAnswer]: webRTCAnswerMessageHandler,
  [MESSAGES.userMetaData]: userMetaDataMessageHandler,
  [MESSAGES.changeChannel]: changeChannelMessageHandler,
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
