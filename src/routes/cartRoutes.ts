import express from "express";
import {
  addToCart,
  getCartByCurrentUser,
  removeFromCart,
  updateCartItem,
} from "../controllers/cartController";

const router = express.Router();

router
  .get("/", getCartByCurrentUser)
  .post("/", addToCart)
  .patch("/:cartItemId", updateCartItem)
  .delete("/:cartItemId", removeFromCart);

export default router;
