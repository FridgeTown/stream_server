const fs = require("fs")

module.exports = {
  mediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {
        "x-google-start-bitrate": 1000,
      },
    },
  ],
  workerSetting: {
    rtcMinPort: 40000,
    rtcMaxPort: 40999,
  },
  webRtcTransportOptions: {
    listenIps: [
      {
        ip: "0.0.0.0",
        announcedIp: process.env.PUBLIC_IP || "127.0.0.1",
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, // STUN 서버
      {
        urls: `turn:${process.env.DOMAIN_URL}:3478`,
        username: process.env.TURN_USER,
        credentials: process.env.TURN_CREDENTIAL,
      },
    ],
  },

  httpsOptions: {
    key: fs.readFileSync(process.env.SSL_KEY || "./server/ssl/key.pem", "utf-8"),
    cert: fs.readFileSync(process.env.SSL_CERT || "./server/ssl/cert.pem", "utf-8"),
  },

  socketOptions: {
    cors: {
      origin: "*",
    },
  },
}
