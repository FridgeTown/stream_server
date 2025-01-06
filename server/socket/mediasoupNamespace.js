// namespace 는 Socket.IO에서 제공하는 논리적 연결 그룹

const { rooms, isStreamerId } = require("../service/roomService")
const createWebRtcTransport = require("../libs/createWebRtcTransport")

const joinStreamer =
  (socket, channelId) =>
  async ({ userId }, callback) => {
    if (isStreamerId(channelId, userId)) {
      socket.join(channelId)
      callback({ rtpCapabilities: rooms[channelId].router.rtpCapabilities })
      return
    }
    socket.emit("error", { message: "error : not my room" })
  }

const joinViewer = (socket, channelId) => async (callback) => {
  rooms[channelId].viewers[socket.id] = {
    consumerTransport: null,
    consumer: null,
  }
  socket.join(channelId)
  callback({ rtpCapabilities: rooms[channelId].router.rtpCapabilities })
}

const createSendTransport = (channelId) => async (callback) => {
  rooms[channelId].streamer.producerTransport = await createWebRtcTransport(callback, { channelId })
}

const createRecvTransport = (socket, channelId) => async (callback) => {
  rooms[channelId].viewers[socket.id].consumerTransport = await createWebRtcTransport(callback, { channelId })
}

const transportConnect =
  (channelId) =>
  async ({ dtlsParameters }) => {
    await rooms[channelId].streamer.producerTransport.connect({ dtlsParameters })
  }

const setProducerEvent = (newProducer) => {
  newProducer.on("transportclose", () => {
    console.log(`Producer (id=${newProducer.id}) closed due to transportclose`)
  })

  newProducer.on("close", () => {
    console.log(`Producer (id=${newProducer.id}) closed`)
  })
}

const transportProduce =
  (channelId) =>
  async ({ kind, rtpParameters, appData }, callback) => {
    console.log("[Server] transport-produce called. kind=", kind)
    try {
      const newProducer = await rooms[channelId].streamer.producerTransport.produce({
        kind,
        rtpParameters,
        appData,
      })
      console.log("[Server] New producer created:", newProducer.id, "kind=", newProducer.kind)

      // 아직 producers 배열이 없을 수도 있으니 안전하게 확인
      if (!rooms[channelId].streamer.producers.length) {
        rooms[channelId].streamer.producers = []
      }
      rooms[channelId].streamer.producers.push(newProducer)

      if (!rooms[channelId].streamer.producers || rooms[channelId].streamer.producers.length === 0) {
        return callback({ error: "No producers available" })
      }

      setProducerEvent(newProducer)

      callback({ id: newProducer.id, kind: newProducer.kind })
    } catch (error) {
      console.error("[Server] transport-produce error:", error)
      callback({ error: error.message })
    }
  }

const transportRecvConnect =
  (socket, channelId) =>
  async ({ dtlsParameters }) => {
    await rooms[channelId].viewers[socket.id].consumerTransport.connect({ dtlsParameters })
  }

const setConsumerEvent = (consumer) => {
  consumer.on("transportclose", () => {
    console.log("transport close from consumer")
  })

  consumer.on("producerclose", () => {
    console.log("producer of consumer closed")
  })
}

const consume =
  (socket, channelId) =>
  async ({ rtpCapabilities }, callback) => {
    try {
      const { producers } = rooms[channelId].streamer
      if (!producers || producers.length === 0) {
        return callback({ error: "No producers available" })
      }

      const consumerInfos = []

      for (const producer of producers) {
        if (
          !rooms[channelId].router.canConsume({
            producerId: producer.id,
            rtpCapabilities,
          })
        ) {
          continue
        }

        const consumer = await rooms[channelId].viewers[socket.id].consumerTransport.consume({
          producerId: producer.id,
          rtpCapabilities,
          paused: true,
        })

        setConsumerEvent(consumer)

        consumerInfos.push({
          params: {
            producerId: producer.id,
            consumerId: consumer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          },
        })

        if (!rooms[channelId].viewers[socket.id].consumers) {
          rooms[channelId].viewers[socket.id].consumers = []
        }
        rooms[channelId].viewers[socket.id].consumers.push(consumer)
      }
      callback({ consumerInfos })
    } catch (error) {
      console.log(error.message)
      callback({
        params: {
          error,
        },
      })
    }
  }

const consumerResume = (socket, channelId) => {
  return async () => {
    try {
      // 특정 Viewer의 모든 Consumer 가져오기
      const consumerList = rooms[channelId].viewers[socket.id].consumers

      if (!consumerList || consumerList.length === 0) {
        console.log(`No consumers found for viewer: ${socket.id}`)
        return
      }

      // 모든 Consumer를 순회하면서 resume 호출
      for (const consumer of consumerList) {
        await consumer.resume() // 각 Consumer를 resume
        console.log(`Consumer resumed: id=${consumer.id}`)
      }
    } catch (error) {
      console.error(`Error in consumer-resume: ${error.message}`)
    }
  }
}

const disconnect = () => {}

const mediasoupNamespace = (peers) => {
  peers.on("connection", async (socket) => {
    const { channelId } = socket.handshake.query

    if (!channelId) {
      socket.emit("error", "Missing required parameters (channelId)")
      socket.disconnect(true) // true: 클라이언트 연결 강제 종료
      return // 종료 후 더 이상 처리하지 않음
    }

    if (!rooms[channelId]) {
      socket.emit("error", "Missing required rooms channelId")
      socket.disconnect(true) // true: 클라이언트 연결 강제 종료
      return // 종료 후 더 이상 처리하지 않음
    }

    socket.emit("connection-success")
    socket.on("join-streamer", joinStreamer(socket, channelId))
    socket.on("join-viewer", joinViewer(socket, channelId))
    socket.on("create-send-transport", createSendTransport(channelId))
    socket.on("create-recv-transport", createRecvTransport(socket, channelId))
    socket.on("transport-connect", transportConnect(channelId))
    socket.on("transport-produce", transportProduce(channelId))
    socket.on("transport-recv-connect", transportRecvConnect(socket, channelId))
    socket.on("consume", consume(socket, channelId))
    socket.on("consumer-resume", consumerResume(socket, channelId))
    socket.on("disconnect", disconnect)
  })
}

module.exports = mediasoupNamespace
