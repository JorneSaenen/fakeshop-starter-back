import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { Cart } from "../models/cartModel";
import { Order } from "../models/orderModel";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createOrder = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const cart = await Cart.find({ userId });
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }

  const products = cart.map((item) => {
    return {
      productId: item.productId,
      quantity: item.quantity,
    };
  });

  const order = await Order.create({
    products,
    userId,
  });
  res.status(201).json(order);
};

//
export const payment = async (req: Request, res: Response) => {
  // get User data from Clerk
  const { items } = req.body;
  const lineItems = [];
  // Finetune the data with de models
  for (const item of items) {
    const lineItem = {
      price_data: {
        currency: "eur",
        product_data: {
          name: item.title,
          images: item.images,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    };
    lineItems.push(lineItem);
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "bancontact", "ideal"],
    mode: "payment",
    line_items: lineItems,
    // use the user data from Clerk
    customer_email: "IgR6s@example.com",
    shipping_address_collection: {
      allowed_countries: ["BE"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            currency: "eur",
            amount: 500,
          },
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 5,
            },
            maximum: {
              unit: "business_day",
              value: 7,
            },
          },
          display_name: "Standard shipping",
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            currency: "eur",
            amount: 1500,
          },
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 2,
            },
          },
          display_name: "Express shipping",
        },
      },
    ],
    // send user to the orders page after payment
    success_url: "http://localhost:3000/success.html",
    // Send user to the order page whe finds a button to try  pay again
    cancel_url: "http://localhost:3000/cancel.html",
  });
  res.status(201).json({
    url: session.url,
  });
};
