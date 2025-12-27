// controllers/inventoryController.js
const Medicine = require("../models/MedicineDetails");

// GET /api/inventory - Get all medicines sorted by name
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

// GET /api/inventory/low-stock?threshold=10 - Low stock medicines
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

// PUT /api/inventory/update-stock/:id - Update stock for medicine
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStock } = req.body;

    const med = await Medicine.findByIdAndUpdate(
      id,
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

// GET /api/inventory/search?q=keyword&category=Analgesic - Search medicines
exports.searchMedicines = async (req, res) => {
  try {
    const { q, category } = req.query;
    let query = {};

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    const meds = await Medicine.find(query)
      .sort({ name: 1 })
      .limit(20)
      .select("name description category price priceNumeric stock imageUrl rating");

    res.json(meds);
  } catch (err) {
    console.error("Error in searchMedicines:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/inventory/:id - Get single medicine details
exports.getMedicineById = async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);
    if (!med) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.json(med);
  } catch (err) {
    console.error("Error in getMedicineById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/inventory/out-of-stock - Out of stock medicines
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
