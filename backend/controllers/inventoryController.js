// controllers/inventoryController.js
const MedicineBasic = require("../models/MedicineBasic");

// GET /api/inventory/low-stock?threshold=10
exports.getLowStock = async (req, res) => {
  const threshold = Number(req.query.threshold || 10);
  const meds = await MedicineBasic.find({
    stock: { $gt: 0, $lt: threshold },
  }).sort({ stock: 1 });
  res.json(meds);
};

exports.updateStock = async (req, res) => {
  const { medicineId, newStock } = req.body;
  const med = await MedicineBasic.findByIdAndUpdate(
    medicineId,
    { stock: newStock, lowStock: newStock > 0 && newStock < 10 },
    { new: true }
  );
  if (!med) return res.status(404).json({ message: "Medicine not found" });
  res.json(med);
};
