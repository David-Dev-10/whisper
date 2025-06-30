import express from "express";
import dotenv from 'dotenv';
import mongoose from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import confessionRoutes from './routes/confessionRoutes.js';
import commentRoutes from "./routes/commentRoutes.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/confessions', confessionRoutes);
app.use("/api/comment", commentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));