require("dotenv").config()

const path = require("path")
const cors = require("cors")
const https = require("https")
const express = require("express")
const { Server } = require("socket.io")

const { httpsOptions, socketOptions } = require("./config/config")
const { createMediasoupWorker } = require("./libs/mediasoupWorker")

const { roomRouter } = require("./controller/room.controller")
const mediasoupNamespace = require("./socket/mediasoupNamespace")

const app = express()

app.use(cors())
app.use(express.json())

// 정적 파일 routing
app.use("/", express.static(path.join(__dirname, "..", "public")))

// REST API routing
app.use("/", roomRouter)

// error handling
app.use((err, req, res, next) => {
  res.status(500).send({ error: "Internal Server Error" })
})

const httpsServer = https.createServer(httpsOptions, app)

createMediasoupWorker()

const io = new Server(httpsServer, socketOptions)
const peers = io.of("/mediasoup")
mediasoupNamespace(peers)

httpsServer.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`)
})
