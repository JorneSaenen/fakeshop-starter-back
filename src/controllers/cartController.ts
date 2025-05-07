import { Request, Response } from "express";
import { Cart } from "../models/cartModel";
import { getAuth } from "@clerk/express";
export const getCartByCurrentUser = async (req: Request, res: Response) => {
  const userId = req.auth.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  const cart = await Cart.find({ userId }).populate("productId");
  res.status(200).json(cart);
};

export const addToCart = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  console.log("User ID:", userId);

  if (!userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  const { productId, quantity } = req.body;
  if (!productId || !quantity) {
    res.status(422).json({ message: "Product ID and quantity are required" });
    return;
  }
  const cartItemExist = await Cart.findOne({ userId, productId });
  if (cartItemExist) {
    const cartItem = await Cart.findOneAndUpdate(
      { userId, productId },
      { $inc: { quantity }, new: true }
    ).populate("productId");
    res.status(201).json(cartItem);
    return;
  }

  const newCartItem = await Cart.create({
    userId,
    productId,
    quantity,
  });
  const cartItemPopulated = await newCartItem.populate("productId");
  res.status(201).json(cartItemPopulated);
};

export const removeFromCart = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  const { cartItemId } = req.params;

  if (!cartItemId) {
    res.status(422).json({ message: "Cart item ID is required" });
    return;
  }
  await Cart.findByIdAndDelete(cartItemId);
  res.status(200).json({ message: `Cart item with ID ${cartItemId} deleted` });
};

export const updateCartItem = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    res.status(422).json({ message: "Quantity does not meet requirements" });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  const { cartItemId } = req.params;

  if (!cartItemId) {
    res.status(422).json({ message: "Cart item ID is required" });
    return;
  }

  const cartItem = await Cart.findByIdAndUpdate(
    cartItemId,
    {
      quantity,
    },
    { new: true }
  ).populate("productId");
  res.status(201).json(cartItem);
};
