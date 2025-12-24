// controllers/paymentController.js
const stripeSecret = process.env.STRIPE_SECRET;

if (!stripeSecret) {
  console.error("Stripe secret key is not set.");
}

const stripe = require("stripe")(stripeSecret);

const Order = require("../models/Order");
const User = require("../models/User");
const Cart = require("../models/Cart");
const nodemailer = require("nodemailer");

const getNumericPrice = (rawPrice) => {
  if (typeof rawPrice === "number") return rawPrice;
  const num = parseFloat(String(rawPrice).replace(/[^\d.]/g, ""));
  return Number.isNaN(num) ? 0 : num;
};

// STEP 1: called from frontend to start Checkout
exports.paymentCheckout = async (req, res) => {
  try {
    console.log("Incoming Request Body:", req.body);

    const { cartItems } = req.body;
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "No items in the cart" });
    }

    const lineItems = cartItems.map((item) => {
      const numericPrice = getNumericPrice(item.price);
      console.log("Line item to Stripe:", {
        name: item.name,
        rawPrice: item.price,
        priceRupees: numericPrice,
      });

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name,
            images: item.imageUrl ? [item.imageUrl] : [],
          },
          unit_amount: Math.round(numericPrice * 100),
        },
        quantity: item.quantity,
      };
    });

    const totalAmount = cartItems.reduce((sum, item) => {
      const numericPrice = getNumericPrice(item.price);
      return sum + Math.round(numericPrice * 100) * item.quantity;
    }, 0); // paise

    // MUST be present because route uses getUser
    const userId = req.user && req.user.id;
    console.log("PAYMENT route req.user:", req.user);
    console.log("PAYMENT route userId:", userId);

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let customerEmail = null;
    const user = await User.findById(userId).select("email");
    if (user) customerEmail = user.email;

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${frontendUrl}/payment-success?amount=${totalAmount}&email=${encodeURIComponent(
        customerEmail || ""
      )}`,
      cancel_url: `${frontendUrl}/payment-failure`,
      customer_email: customerEmail || undefined,
      metadata: {
        userId: String(userId), // force non-empty string
        cart: JSON.stringify(
          cartItems.map((item) => {
            const numericPrice = getNumericPrice(item.price);
            return {
              medicineId: item.medicineId || item._id,
              name: item.name,
              quantity: item.quantity,
              price: numericPrice,
            };
          })
        ),
        totalAmount: String(totalAmount),
      },
    });

    return res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// STEP 2: Stripe webhook to store order + clear cart + send email
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handleStripeWebhook = async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];

    if (!endpointSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not set");
      return res.status(500).send("Webhook secret not configured");
    }

    // req.body is raw buffer because of express.raw in index.js
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const metadata = session.metadata || {};
      const cart = metadata.cart ? JSON.parse(metadata.cart) : [];
      const totalAmount = Number(metadata.totalAmount || 0);
      const userId = metadata.userId || null;
      const email =
        session.customer_details?.email || session.customer_email;

      console.log("WEBHOOK metadata:", metadata);
      console.log("WEBHOOK userId:", userId);

      if (!userId) {
        console.error(
          "WEBHOOK ERROR: userId missing in metadata, cannot create Order."
        );
        // Do NOT try to save Order if userId is missing
        return res.json({ received: true });
      }

      const orderDoc = new Order({
        userId,
        medicines: cart.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
        })),
        totalAmount: totalAmount / 100, // rupees
        paymentStatus: "Completed",
        deliveryStatus: "Processing",
      });

      await orderDoc.save();

      if (userId) {
        await Cart.deleteOne({ userId });
      }

      // ---- UPDATED ETA: 3 hours instead of 2 days ----
      const etaMinutes =
      Math.floor(Math.random() * (120 - 30 + 1)) + 30;
      const eta = new Date();
      eta.setMinutes(eta.getMinutes() + etaMinutes);
      const etaString = eta.toLocaleString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      if (email && process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const itemsText = cart
          .map(
            (i) =>
              `• ${i.name} × ${i.quantity} — ₹${(
                i.price * i.quantity
              ).toFixed(2)}`
          )
          .join("\n");

        const mailBody = `
Hi,

Your order ${orderDoc._id} has been placed successfully.

Order total: ₹${(totalAmount / 100).toFixed(2)}
Estimated delivery: ${etaString}

Items:
${itemsText}

Thank you for ordering with MediQuick.
`;

        await transporter.sendMail({
          from: `"MediQuick" <${
            process.env.SMTP_FROM || process.env.SMTP_USER
          }>`,
          to: email,
          subject: "Your MediQuick order is confirmed",
          text: mailBody,
        });
      }
    } catch (err) {
      console.error("Error handling checkout.session.completed:", err);
      // Do not rethrow; Stripe will retry if non‑2xx, but we already respond below
    }
  }

  res.json({ received: true });
};
