import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors";
import { Error as MongooseValidationError } from "mongoose";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const data = {
    endpoint: req.originalUrl,
    method: req.method,
  };

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message, ...data });
    return;
  }

  if (err instanceof MongooseValidationError) {
    res.status(400).json({ message: err.message, ...data });
    return;
  }
  console.log("Error:", err);

  res.status(500).json({ message: "Internal Server Error", ...data });
};
