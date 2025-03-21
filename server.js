const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http"); // 
const { Server } = require("socket.io"); 
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSocket Server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (change in production)
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api/jobs", jobRoutes);

connectDB();

// Test Route
app.get("/", (req, res) => {
  res.send("API is running..!");
});

// WebSocket Connection Handling
io.on("connection", (socket) => {
    console.log(`🔌 New WebSocket client connected: ${socket.id}`);
  
    // ✅ Send a welcome message to new connections
    socket.emit("message", "Welcome to the WebSocket server!");
  
    // ✅ Listen for job posting events
    socket.on("newJob", (jobData) => {
      console.log("📢 New job posted:", jobData);
  
      // Broadcast new job to all connected clients
      io.emit("jobPosted", jobData);
    });
  
    socket.on("disconnect", () => {
      console.log(`❌ WebSocket client disconnected: ${socket.id}`);
    });
  });
  

// Start Server with WebSockets
server.listen(PORT, () => {
  console.log(` Server is running successfully on localhost:${PORT}`);
});
