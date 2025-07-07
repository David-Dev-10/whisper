import http from "http";
import { Server } from "socket.io";
import express from "express";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on('joinConfessionCategory', ({ categoryId }) => {
    socket.join(categoryId);
    console.log(`User ${socket.id} joined confession category ${categoryId}`);
  });

  socket.on('joinConfession', ({ confessionId }) => {
    socket.join(confessionId);
    console.log(`User ${socket.id} joined confession ${confessionId}`);
  });

  socket.on("joinReaction", ({ commentId }) => {
    socket.join(`reaction-${commentId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  })
});

export { app, server, io };