const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { setupSocket } = require("./socket/socket");

dotenv.config();

// Fail fast with a clear message if required env vars are missing (e.g. on Replit Deploy)
if (!process.env.MONGO_URI) {
  console.error("Missing required env: MONGO_URI. Set it in Replit Secrets (Lock icon) and enable secrets for Deploy.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("Missing required env: JWT_SECRET. Set it in Replit Secrets (Lock icon) and enable secrets for Deploy.");
  process.exit(1);
}

connectDB();

const app = express();
const server = http.createServer(app);

// Allow CORS from the request origin so the app works when opened from any device (e.g. --host).
// Set CLIENT_URL to restrict to specific URL(s), e.g. CLIENT_URL=https://myapp.com
const corsOrigin = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((s) => s.trim())
  : true;

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

setupSocket(io);
app.set("io", io);

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/expos", require("./routes/expoRoutes"));
app.use("/api/exhibitors", require("./routes/exhibitorRoutes"));
app.use("/api/attendees", require("./routes/attendeeRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/applications", require("./routes/expoApplicationRoutes"));
app.use("/api/bookmarks", require("./routes/bookmarkRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Event Sphere Management API is running" });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
