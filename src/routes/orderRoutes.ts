import express from "express";
import { payment, success } from "../controllers/checkoutController";

const router = express.Router();

router.get("/success", success).post("/payment", payment);

export default router;
