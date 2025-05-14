import express from "express";
import { canceled, payment, success } from "../controllers/checkoutController";

const router = express.Router();

router
  .get("/success", success)
  .get("/canceled", canceled)
  .post("/payment", payment);

export default router;
