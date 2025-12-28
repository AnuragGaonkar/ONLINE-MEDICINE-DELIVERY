// controllers/inventoryController.js
const Medicine = require("../models/Medicine");

// ... getInventory, getLowStock, updateStock stay unchanged ...

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
