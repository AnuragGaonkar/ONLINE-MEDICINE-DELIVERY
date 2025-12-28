// controllers/orderController.js
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");   // <<< CHANGE IMPORT

const LOW_STOCK_THRESHOLD = 10;

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicines, totalPrice } = req.body;

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "No medicines in order" });
    }

    const session = await Order.startSession();
    session.startTransaction();

    try {
      for (const item of medicines) {
        const { medicineId, quantity } = item;

        const med = await Medicine.findById(medicineId).session(session); // <<< USE Medicine
        if (!med) {
          throw new Error(`Medicine not found: ${medicineId}`);
        }

        if (med.stock < quantity) {
          throw new Error(`Insufficient stock for ${med.name}`);
        }

        med.stock -= quantity;
        // optional: add lowStock if you want
        med.lowStock = med.stock > 0 && med.stock <= LOW_STOCK_THRESHOLD;
        await med.save({ session });
      }

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
