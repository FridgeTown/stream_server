const { createRouter } = require("../libs/mediasoupWorker")

const rooms = {}

const createRoom = async (channelId, streamerId) => {
  rooms[channelId] = {
    router: await createRouter(),
    streamer: {
      id: streamerId,
      producerTransport: null,
      producers: [],
    },
    viewers: {},
  }
}

const isStreamerId = (channelId, userId) => {
  return rooms[channelId].streamer.id === userId
}

const updateStreamerId = ({ channelId, userId }) => {
  rooms[channelId].streamer.id = userId
}

const closeRoom = async (channelId) => {
  if (!rooms[channelId]) {
    throw new Error("Room not found")
  }
  rooms[channelId].router.close()
  delete rooms[channelId]
}

module.exports = { rooms, createRoom, updateStreamerId, closeRoom, isStreamerId }
