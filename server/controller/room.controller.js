const { Router } = require("express")
const { createRoom } = require("../service/roomService")

const roomRouter = Router()

roomRouter.post("/test/create", async (req, res) => {
  try {
    const { userId, channelId } = req.body
    createRoom(channelId, userId)
    res.json("success")
  } catch (error) {
    console.error("Error forwarding request: ", error)

    res.status(error.response?.status || 500).json({
      message: "Failed to forward request",
      error: error.message,
    })
  }
})

module.exports = { roomRouter }
