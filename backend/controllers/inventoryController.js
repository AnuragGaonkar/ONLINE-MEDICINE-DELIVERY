// controllers/inventoryController.js
const Medicine = require("../models/Medicine");  // use existing model

// GET /api/inventory
exports.getInventory = async (req, res) => {
  try {
    const meds = await Medicine.find().sort({ name: 1 });
    res.json(meds);
  } catch (err) {
    console.error("Error in getInventory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/inventory/low-stock?threshold=10
exports.getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold || 10);
    const meds = await Medicine.find({
      stock: { $gt: 0, $lt: threshold },
    }).sort({ stock: 1 });
    res.json(meds);
  } catch (err) {
    console.error("Error in getLowStock:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/inventory/update-stock
exports.updateStock = async (req, res) => {
  try {
    const { medicineId, newStock } = req.body;

    const med = await Medicine.findByIdAndUpdate(
      medicineId,
      {
        stock: newStock,
        lowStock: newStock > 0 && newStock < 10,
        in_stock: newStock > 0,
      },
      { new: true }
    );

    if (!med) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json(med);
  } catch (err) {
    console.error("Error in updateStock:", err);
    res.status(500).json({ message: "Server error" });
  }
};
