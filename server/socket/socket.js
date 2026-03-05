const jwt = require("jsonwebtoken");
const User = require("../models/User");

const setupSocket = (io) => {
  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    // Optional: authenticate socket with JWT
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("name role");
        socket.user = user;
        if (user) {
          socket.join(`user-${user._id}`);
        }
      } catch (err) {
        socket.user = null;
      }
    }

    // Join expo room for real-time updates
    socket.on("join-expo", (expoId) => {
      socket.join(`expo-${expoId}`);
    });

    socket.on("leave-expo", (expoId) => {
      socket.leave(`expo-${expoId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

const emitToExpo = (io, expoId, event, data) => {
  io.to(`expo-${expoId}`).emit(event, data);
};

const emitToUser = (io, userId, event, data) => {
  io.to(`user-${userId}`).emit(event, data);
};

module.exports = { setupSocket, emitToExpo, emitToUser };
