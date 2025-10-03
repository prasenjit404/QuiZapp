import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: ".env",
});

// Create HTTP server with Express
const server = http.createServer(app);

// Create socket.io server
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // you can restrict later
    methods: ["GET", "POST"],
  },
});

// Socket events
io.on("connection", (socket) => {
  console.log("A student connected:", socket.id);

  socket.on("joinQuiz", ({ quizId, studentId }) => {
    socket.join(`quiz:${quizId}`);
    console.log(`Student ${studentId} joined quiz ${quizId}`);
  });

  socket.on("disconnect", () => {
    console.log("Student disconnected:", socket.id);
  });
});

// Export io if controllers need to emit events
export { io };

connectDB()
  .then(() => {
    const port = process.env.PORT || 10000;
    server.listen(port, () => {
      console.log(`\nServer is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });
