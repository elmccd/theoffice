export const sendToSocket = (socket, data) => {
  if (!data.topic) {
    throw new Error(`Topic is required, got: ${data.topic}`);
  }

  socket.send(JSON.stringify(data, null, 2));
};
