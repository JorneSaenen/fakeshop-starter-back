import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { Order } from "../models/orderModel";
export const getOrdersByCurrentUser = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  const orders = await Order.find({ userId }).populate("products.productId");
  res.status(200).json(orders);
};

export const getOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  const order = await Order.findOne({ _id: id, userId }).populate(
    "products.productId"
  );
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  res.status(200).json(order);
};
