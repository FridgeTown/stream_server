const { io } = require("socket.io-client")
const MediasoupClient = require("mediasoup-client")

const qs = new URLSearchParams(window.location.search)
const channelId = qs.get("channelId")
const userId = qs.get("userId")

let socket

let params = {
  encodings: [
    {
      rid: "r0",
      maxBitrate: 100000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r1",
      maxBitrate: 300000,
      scalabilityMode: "S1T3",
    },
    {
      rid: "r2",
      maxBitrate: 900000,
      scalabilityMode: "S1T3",
    },
  ],
  codecOptions: {
    videoGoogleStartBitrate: 1000,
  },
}

let device
let rtpCapabilities
let producerTransport
let audioParams = {}
let videoParams = { params }

const connectSendTransport = async () => {
  const audioProducer = await producerTransport.produce(audioParams)
  const videoProducer = await producerTransport.produce(videoParams)
  audioProducer.on("trackended", () => {
    console.log("audio track ended")
  })

  audioProducer.on("transportclose", () => {
    console.log("audio transport ended")
  })

  videoProducer.on("trackended", () => {
    console.log("video track ended")
  })

  videoProducer.on("transportclose", () => {
    console.log("video transport ended")
  })
}

const createWebRtcSendTransport = async ({ params }) => {
  if (params.error) {
    console.error(params.error)
    return
  }

  producerTransport = device.createSendTransport(params)

  producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    console.log("[Streamer] on(connect) - dtlsParameters:", dtlsParameters)

    try {
      await socket.emit("transport-connect", {
        dtlsParameters,
      })

      callback()
    } catch (error) {
      errback(error)
    }
  })

  producerTransport.on("produce", async (parameters, callback, errback) => {
    console.log("[Streamer] on(produce) - parameters:", parameters)
    try {
      await socket.emit(
        "transport-produce",
        {
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
          appData: parameters.appData,
        },
        ({ id, error }) => {
          if (error) console.error("Produce error:", error)
          else console.log("Producer created on server. ID=", id)
          callback({ id })
        },
      )
    } catch (error) {
      errback(error)
    }
  })

  connectSendTransport()
}

const createDevice = async (rtpCapabilities) => {
  try {
    device = new MediasoupClient.Device()
    await device.load({ routerRtpCapabilities: rtpCapabilities })
    socket.emit("create-send-transport", createWebRtcSendTransport)
  } catch (error) {
    if (error.name === "UnsupportedError") {
      console.warn("browser not supported")
    }
  }
}

const joinRoom = () => {
  const callback = async (data) => {
    rtpCapabilities = data.rtpCapabilities
    await createDevice(rtpCapabilities)
  }

  socket.emit("join-streamer", { userId }, callback)
}

const setMediaParams = (stream) => {
  audioParams = { track: stream.getAudioTracks()[0], ...audioParams, appData: { mediaTag: "audio" } }
  videoParams = { track: stream.getVideoTracks()[0], ...videoParams, appData: { mediaTag: "video" } }
}

const startStreamView = async (stream) => {
  document.querySelector("#localVideo").srcObject = stream
}

const getLocalStream = async () => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  })

  return mediaStream
}

const createSocket = () => {
  return io("/mediasoup", {
    query: {
      channelId,
    },
  })
}

const startSocket = () => {
  socket = createSocket()
  socket.on("connection-success", async () => {
    const mediaStream = await getLocalStream()
    startStreamView(mediaStream)
    setMediaParams(mediaStream)
    joinRoom()
  })

  socket.on("error", ({ message }) => {
    console.error(message)
  })
}

document.querySelector("#connect").addEventListener("click", startSocket)

document.querySelector("#create-room").addEventListener("click", async () => {
  try {
    const response = await fetch(`test/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, userId }),
    })

    if (!response.ok) {
      throw new Error(`Spring server responded with status ${response.status}`)
    }

    const data = await response.text()
    console.log(data)
  } catch (error) {
    console.error("Error forwarding request: ", error)
  }
})

// document.querySelector("#start").addEventListener('click', async () => {
//   try {
//     const response = await fetch(`http://localhost:8080/test/stream/${channelId}/start`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ channelId, userId }),
//     });

//     if(!response.ok) {
//       throw new Error(`Spring server responded with status ${response.status}`);
//     }

//     const data = await response.text();
//     console.log(data)
//   } catch (error) {
//     console.error("Error forwarding request: ", error);
//   }
// })

// document.querySelector("#stop").addEventListener('click', async () => {
//   try {
//     const response = await fetch(`http://localhost:8080/test/stream/${channelId}/stop`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ channelId, userId }),
//     });

//     if(!response.ok) {
//       throw new Error(`Spring server responded with status ${response.status}`);
//     }

//     const data = await response.text();
//     console.log(data)
//   } catch (error) {
//     console.error("Error forwarding request: ", error);
//   }
// })
