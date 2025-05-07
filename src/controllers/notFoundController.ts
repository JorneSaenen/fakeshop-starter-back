import { Request, Response } from "express";
import { ApiError } from "../errors";

export const notFound = (req: Request, res: Response) => {
  throw new ApiError(404, `The requested endpoint doesn't exist.`);
};
