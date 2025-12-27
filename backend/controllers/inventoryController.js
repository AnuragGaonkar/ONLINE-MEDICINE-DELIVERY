const Medicine = require("../models/MedicineDetails");

// GET /api/inventory/inventory
exports.getInventory = async (req, res) => {
  try {
    const meds = await Medicine.find()
      .sort({ name: 1 })
      .select("name category price priceNumeric stock imageUrl prescription_required in_stock rating");
    res.json(meds);
  } catch (err) {
    console.error("Error in getInventory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/inventory/inventory/low-stock?threshold=10
exports.getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold || 10);
    const meds = await Medicine.find({
      stock: { $gt: 0, $lt: threshold },
      in_stock: true,
    })
      .sort({ stock: 1 })
      .select("name category price stock imageUrl");
    res.json(meds);
  } catch (err) {
    console.error("Error in getLowStock:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/inventory/inventory/update-stock
exports.updateStock = async (req, res) => {
  try {
    const { medicineId, newStock } = req.body;
    
    const med = await Medicine.findByIdAndUpdate(
      medicineId,
      {
        stock: newStock,
        in_stock: newStock > 0,
        lowStock: newStock > 0 && newStock < 10,
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

// GET /api/inventory/inventory/out-of-stock
exports.getOutOfStock = async (req, res) => {
  try {
    const meds = await Medicine.find({ stock: 0 })
      .sort({ name: 1 })
      .select("name category price stock");
    res.json(meds);
  } catch (err) {
    console.error("Error in getOutOfStock:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/inventory/inventory/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalMedicines = await Medicine.countDocuments();
    const inStock = await Medicine.countDocuments({ in_stock: true });
    const lowStock = await Medicine.countDocuments({ lowStock: true });
    const outOfStock = await Medicine.countDocuments({ stock: 0 });

    res.json({
      totalMedicines,
      inStock,
      lowStock,
      outOfStock,
      lowStockPercentage: ((lowStock / totalMedicines) * 100).toFixed(1)
    });
  } catch (err) {
    console.error("Error in getDashboardStats:", err);
    res.status(500).json({ message: "Server error" });
  }
};
