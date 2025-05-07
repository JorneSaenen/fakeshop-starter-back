// Imports
import "dotenv/config";
import cors from "cors";
import express from "express";
import { notFound } from "./controllers/notFoundController";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/errorHandler";
import { clerkMiddleware } from "@clerk/express";

// Variables
const app = express();
const PORT = process.env.PORT || 3000;
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(clerkMiddleware());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.all("*splat", notFound);

// Error handling (must be the last)
app.use(errorHandler);

// Database connection
try {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("Database connection OK");
} catch (err) {
  console.error(err);
  process.exit(1);
}

// Server Listening
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}! 🚀`);
});
