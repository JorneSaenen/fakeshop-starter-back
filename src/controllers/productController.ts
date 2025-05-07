import { Request, Response } from "express";
import { Product } from "../models/productModel";

export const getProducts = async (req: Request, res: Response) => {
  const products = await Product.find();
  res.status(200).json(products);
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  res.status(200).json(product);
};
