const { webRtcTransportOptions } = require("../config/config")

const { rooms } = require("../service/roomService")

const transportDtlsstatechange = (dtlsstate) => {
  if (dtlsstate === "failed" || dtlsstate === "closed") {
    console.error("Transport connection lost.")
  }
  if (dtlsstate === "closed") {
    transport.close()
  }
}

const transportClose = () => {
  console.log("transport closed")
}

const createWebRtcTransport = async (cb, { channelId }) => {
  try {
    const transport = await rooms[channelId].router.createWebRtcTransport(webRtcTransportOptions)

    transport.on("dtlsstatechange", transportDtlsstatechange)
    transport.on("close", transportClose)

    cb({
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    })

    return transport
  } catch (error) {
    console.log(error)
    cb({
      params: {
        error,
      },
    })
  }
}

module.exports = createWebRtcTransport
