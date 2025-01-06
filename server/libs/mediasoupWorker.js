const mediasoup = require("mediasoup")

const { workerSetting, mediaCodecs } = require("../config/config")

let worker

const createMediasoupWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: workerSetting.rtcMinPort,
    rtcMaxPort: workerSetting.rtcMaxPort,
  })

  worker.on("died", (error) => {
    console.error("mediasoup worker has died", error)
  })
}

const createRouter = async () => {
  const router = await worker.createRouter({ mediaCodecs })
  return router
}

module.exports = { createMediasoupWorker, createRouter }
