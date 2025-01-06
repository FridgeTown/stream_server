const { io } = require("socket.io-client")
const MediasoupClient = require("mediasoup-client")

const qs = new URLSearchParams(window.location.search)
const channelId = qs.get("channelId")

let socket

let device
let rtpCapabilities
let consumerTransport

const connectRecvTransport = async () => {
  await socket.emit(
    "consume",
    {
      rtpCapabilities: device.rtpCapabilities,
    },
    async ({ consumerInfos, error }) => {
      if (error) {
        console.log("Cannot consume:", error)
        return
      }

      console.log("consumerInfos: ", consumerInfos)

      for (const consumerInfo of consumerInfos) {
        console.log(consumerInfo.params)
        const consumer = await consumerTransport.consume({
          id: consumerInfo.params.consumerId,
          producerId: consumerInfo.params.producerId,
          kind: consumerInfo.params.kind,
          rtpParameters: consumerInfo.params.rtpParameters,
        })
        console.log(consumer)

        if (consumer.kind === "video") {
          const remoteVideo = document.getElementById("remoteVideo")
          remoteVideo.srcObject = new MediaStream([consumer.track])
          remoteVideo.load() // 새로운 비디오 로드
          remoteVideo.play().catch((err) => console.error("Video play() error:", err))
        } else if (consumer.kind === "audio") {
          const audioElement = document.createElement("audio")
          audioElement.srcObject = new MediaStream([consumer.track])
          audioElement.autoplay = true
          document.body.appendChild(audioElement)
        }
      }

      socket.emit("consumer-resume")
    },
  )
}

const createWebRtcRecvTransport = async ({ params }) => {
  if (params.error) {
    console.log(params.error)
    return
  }
  console.log(params)

  consumerTransport = device.createRecvTransport(params)

  consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    try {
      await socket.emit("transport-recv-connect", {
        dtlsParameters,
        userId: qs.get("userId"),
      })

      callback()
    } catch (error) {
      errback(error)
    }
  })
  connectRecvTransport()
}

const createDevice = async (rtpCapabilities) => {
  try {
    device = new MediasoupClient.Device()
    await device.load({ routerRtpCapabilities: rtpCapabilities })
  } catch (error) {
    if (error.name === "UnsupportedError") {
      console.warn("browser not supported")
    }
  }
}

const cbRtpCapabilities = async (data) => {
  rtpCapabilities = data.rtpCapabilities
  await createDevice(rtpCapabilities)
}

const createSocket = () => {
  return io("/mediasoup", {
    query: {
      channelId,
    },
  })
}

const joinRoom = () => {
  socket.emit("join-viewer", cbRtpCapabilities)
}

const startSocket = () => {
  socket = createSocket()

  socket.on("connection-success", () => {
    console.log("connection-success")
  })

  socket.on("error", ({ message }) => {
    console.warn(message)
  })
}

document.querySelector("#start").addEventListener("click", () => {
  joinRoom()
  socket.emit("create-recv-transport", createWebRtcRecvTransport)
})

startSocket()
