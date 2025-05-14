import { Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { Cart } from "../models/cartModel";
import { Order } from "../models/orderModel";
import Stripe from "stripe";
import { ProductType } from "../models/productModel";
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
  const cart = await Cart.find({ userId }).populate<{ productId: ProductType }>(
    "productId"
  );
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
    metadata: {
      userId,
    },
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

    success_url:
      "http://localhost:3000/api/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: `http://localhost:3000/api/checkout/canceled`,
  });

  res.status(200).json({ url: session.url });
};

export const success = async (req: Request, res: Response) => {
  const session = await stripe.checkout.sessions.retrieve(
    req.query.session_id as string
  );
  if (!session) {
    res.status(404).json({ message: "Session not found" });
    return;
  }
  await createOrder(session.metadata!.userId!);
  // Clear the cart
  await Cart.deleteMany({
    userId: session.metadata!.userId!,
  });
  res.send(`<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Bevestigd</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .confirmation {
      background-color: #ffffff;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .timer {
      font-size: 1.5rem;
      margin-top: 1rem;
      color: #444;
    }
  </style>
</head>
<body>
  <div class="confirmation">
    <h1>Bedankt voor je bestelling!</h1>
    <p>Je order is succesvol geplaatst.</p>
    <div class="timer">
      Je wordt binnen <span id="countdown">5</span> seconden doorgestuurd naar de homepagina...
    </div>
  </div>

  <script>
    let countdown = 5;
    const countdownElement = document.getElementById("countdown");

    const interval = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      if (countdown === 0) {
        clearInterval(interval);
        window.location.href = "http://localhost:5173/orders";
      }
    }, 1000);
  </script>
</body>
</html>
`);
};
export const canceled = async (req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Mislukt</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #fff5f5;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .error-box {
      background-color: #ffe5e5;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid #ff4d4d;
    }
    h1 {
      color: #cc0000;
    }
    .timer {
      font-size: 1.5rem;
      margin-top: 1rem;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="error-box">
    <h1>Helaas, je bestelling is mislukt</h1>
    <p>Er ging iets mis tijdens het verwerken van je order.</p>
    <div class="timer">
      Je wordt binnen <span id="countdown">5</span> seconden teruggestuurd naar de homepagina...
    </div>
  </div>

  <script>
    let countdown = 5;
    const countdownElement = document.getElementById("countdown");

    const interval = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      if (countdown === 0) {
        clearInterval(interval);
        window.location.href = "http://localhost:5173";
      }
    }, 1000);
  </script>
</body>
</html>
`);
};
