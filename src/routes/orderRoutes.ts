import express from "express";
import { createOrder, payment } from "../controllers/checkoutController";

const router = express.Router();

router.post("/create-order", createOrder).post("/payment", payment);

export default router;
