const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const rateLimit = require("express-rate-limit");
const recommendations = require("./routes/recommendations");



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  perMessageDeflate: {
    threshold: 1024,
  },
  pingInterval: 60000, // Send pings every 60 seconds
  pingTimeout: 55000, // Allow 55 seconds before timeout
});

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/recommendations", recommendations);

// REST API Rate Limiting (Job Posting)
const jobPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: "Too many job postings from this IP, please try again later.",
});

app.post("/api/jobs", jobPostLimiter, (req, res) => {
  res.send("Job posting functionality goes here.");
});

// WebSocket Rate Limiting & Stability Fix
const rateLimitMap = new Map();
const MAX_CLIENTS = 100;
let connectedClients = 0;

io.on("connection", (socket) => {
  if (connectedClients >= MAX_CLIENTS) {
    console.log("Too many connections! Rejecting client.");
    socket.emit("error", "Server is full, try again later.");
    return socket.disconnect();
  }

  connectedClients++;
  console.log(`Client connected: ${socket.id} | Total: ${connectedClients}`);

  socket.emit("message", "Welcome to the WebSocket server!");

  // WebSocket Rate Limiting: Max 1 message per second per client
  socket.on("newJob", (jobData) => {
    const now = Date.now();
    const lastMessageTime = rateLimitMap.get(socket.id) || 0;

    if (now - lastMessageTime < 1000) { // 1-second limit
      console.log(`Rate limit hit for ${socket.id}, rejecting message.`);
      socket.emit("error", "Slow down! You're sending messages too quickly.");
      return;
    }

    rateLimitMap.set(socket.id, now);
    console.log("New job posted:", jobData);

    // Broadcast new job to all clients
    io.emit("jobPosted", jobData);
  });

  // Keep-Alive Ping
  const keepAliveInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit("keepAlive", "Ping from server");
    }
  }, 25000);

  // Handle proper disconnection
  socket.on("disconnect", (reason) => {
    connectedClients--;
    rateLimitMap.delete(socket.id);
    clearInterval(keepAliveInterval);
    console.log(`Client disconnected: ${socket.id} | Reason: ${reason}`);
  });

  // Ensure client does NOT close automatically
  socket.on("error", (err) => {
    console.log(`Socket error for ${socket.id}: ${err.message}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running successfully on localhost:${PORT}`);
});
