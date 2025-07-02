import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import confessionRoutes from './routes/confessionRoutes.js';
import commentRoutes from "./routes/commentRoutes.js";
import confessionCategoryRoutes from "./routes/confessionCategoryRoutes.js";

import { app, server } from "./sockets/socket.js";

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/confessions', confessionRoutes);
app.use("/api/comment", commentRoutes);
app.use('/api/confession-categories', confessionCategoryRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));