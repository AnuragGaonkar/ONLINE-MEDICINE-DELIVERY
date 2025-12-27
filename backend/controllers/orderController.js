// controllers/orderController.js
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const MedicineBasic = require("../models/MedicineBasic"); // used by inventoryController

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicines, totalPrice } = req.body;
    // medicines: [{ medicineId, quantity }]

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "No medicines in order" });
    }

    // 1) create order
    const order = await Order.create({
      userId,
      medicines,
      totalPrice,
    });

    const LOW_STOCK_THRESHOLD = 10;

    // 2) decrement stock for each medicine
    for (const item of medicines) {
      const { medicineId, quantity } = item;

      // decrement main Medicine collection
      const med = await Medicine.findByIdAndUpdate(
        medicineId,
        { $inc: { stock: -quantity } },
        { new: true }
      );

      // keep in_stock flag in sync
      if (med && med.stock <= 0 && med.in_stock) {
        med.in_stock = false;
        await med.save();
      }

      // 3) reflect in inventory mirror (MedicineBasic) if you are using it
      if (medicineId) {
        const invMed = await MedicineBasic.findByIdAndUpdate(
          medicineId,
          { $inc: { stock: -quantity } },
          { new: true }
        );

        // optional: mark low‑stock for admin (no user message)
        if (invMed && invMed.stock > 0 && invMed.stock <= LOW_STOCK_THRESHOLD) {
          // e.g. flag in the document; your admin inventory page
          // can highlight anything with lowStock: true
          invMed.lowStock = true;
          await invMed.save();
        }
      }
    }

    return res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};

// GET /api/orders/my (unchanged)
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
