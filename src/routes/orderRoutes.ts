import express from "express";
import {
  getOrderById,
  getOrdersByCurrentUser,
} from "../controllers/orderController";

const router = express.Router();

router.get("/", getOrdersByCurrentUser).get("/order/:id", getOrderById);

export default router;
