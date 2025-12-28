// controllers/orderController.js
const Order = require("../models/Order");
const Mediciness = require("../models/Mediciness");

const LOW_STOCK_THRESHOLD = 10;

// POST /api/orders
// body: { medicines: [{ medicineId, quantity }], totalPrice }
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicines, totalPrice } = req.body;

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "No medicines in order" });
    }

    // Optional but safer: transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // 1) Decrement stock for each item
      for (const item of medicines) {
        const { medicineId, quantity } = item;

        const med = await Mediciness.findById(medicineId).session(session);
        if (!med) {
          throw new Error(`Medicine not found: ${medicineId}`);
        }

        if (med.stock < quantity) {
          throw new Error(`Insufficient stock for ${med.name}`);
        }

        med.stock -= quantity;
        med.lowStock = med.stock > 0 && med.stock <= LOW_STOCK_THRESHOLD;
        await med.save({ session });
      }

      // 2) Create order
      const [order] = await Order.create(
        [
          {
            userId,
            medicines,
            totalPrice,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json(order);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Order transaction failed:", err.message);
      return res.status(400).json({ message: err.message });
    }
  } catch (error) {
    console.error("Error creating order:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId })
      .populate("medicines.medicineId", "name price imageUrl")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).send("Internal Server Error");
  }
};
