// controllers/inventoryController.js
const Medicine = require("../models/Medicine");

// GET /api/inventory
exports.getInventory = async (req, res) => {
  try {
    const meds = await Medicine.find({}).sort({ name: 1 });
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
      { stock: newStock },
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

// POST /api/inventory/restock
// body: { medicineId, quantity, supplierName, supplierContact, invoiceNumber, notes }
exports.restockMedicine = async (req, res) => {
  try {
    const {
      medicineId,
      quantity,
      supplierName,
      supplierContact,
      invoiceNumber,
      notes,
    } = req.body;

    const qty = Number(quantity);

    if (!medicineId || !qty || qty <= 0) {
      return res
        .status(400)
        .json({ message: "medicineId and positive quantity are required" });
    }

    const med = await Medicine.findById(medicineId);
    if (!med) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    med.stock += qty;
    await med.save();

    return res.json({
      message: "Medicine restocked successfully",
      medicine: med,
      restockMeta: {
        supplierName,
        supplierContact,
        invoiceNumber,
        notes,
        quantityAdded: qty,
        date: new Date(),
      },
    });
  } catch (err) {
    console.error("Error in restockMedicine:", err);
    res.status(500).json({ message: "Server error" });
  }
};
