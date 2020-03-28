const {webRTCAnswerMessageHandler, webRTCOfferMessageHandler} = require("./ws-message-handlers");

const messagesHandlers = {
    webRTCOffer: webRTCOfferMessageHandler,
    webRTCAnswer: webRTCAnswerMessageHandler,
};

exports.globalMessageHandler = (messageRaw, wssClients) => {
    let message = JSON.parse(messageRaw);

    if (!messagesHandlers[message.topic]) {
        throw new Error(`Unrecognized message topic: ${message.topic}`);
    }

    messagesHandlers[message.topic]({
        message,
        wssClients: wssClients,
    });
};
