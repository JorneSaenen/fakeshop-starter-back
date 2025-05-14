import { Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { Cart } from "../models/cartModel";
import { Order } from "../models/orderModel";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const createOrder = async (userId: string) => {
  const cart = await Cart.find({ userId });
  if (!cart) {
    throw new Error("Cart not found");
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
    status: "paid",
  });
  return order;
};

export const payment = async (req: Request, res: Response) => {
  // get User data from Clerk
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await clerkClient.users.getUser(userId);

  // Do the payment with Stripe
  const cart = await Cart.find({ userId }).populate("productId");
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }

  const lineItems = [];
  for (const item of cart) {
    const lineItem = {
      price_data: {
        currency: "eur",
        product_data: {
          name: item.productId.title,
          images: item.productId.images,
        },
        unit_amount: Math.round(item.productId.price * 100),
      },
      quantity: item.quantity,
    };
    lineItems.push(lineItem);
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card", "bancontact", "ideal"],
    mode: "payment",
    line_items: lineItems,
    customer_email: user.emailAddresses[0].emailAddress,
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
    success_url: `http://localhost:3000/success`,
    cancel_url: `http://localhost:3000/canceled`,
  });

  res.status(200).json({ url: session.url });
};
