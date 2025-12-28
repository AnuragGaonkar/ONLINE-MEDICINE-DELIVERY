const mongoose = require("mongoose");
const Mediciness = require("../models/Medicine");
const MedicineDetails = require("../models/MedicineDetails");

exports.getCombinedMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // 1) Get from mediciness (cards/inventory)
    const basic = await Mediciness.findById(id);
    if (!basic) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // 2) Get details from medicines by name
    const details = await MedicineDetails.findOne({
      name: basic.name.trim()
    });

    // 3) If no details, return basic info
    if (!details) {
      return res.json({
        _id: basic._id,
        name: basic.name,
        category: basic.category,
        price: basic.price,
        stock: basic.stock,
        imageUrl: basic.imageUrl,
        in_stock: basic.stock > 0,
        availability: basic.stock > 0 ? "In Stock" : "Out of Stock",
        side_effects: [],
        contraindications: [],
        brand_name: [],
        precautions: [],
        alternativeMedicines: [],
        recommended_dosage: {},
      });
    }

    // 4) Merge both
    const combined = {
      _id: basic._id,
      imageUrl: basic.imageUrl,
      stock: basic.stock,

      name: details.name,
      description: details.description,
      use0: details.use0, use1: details.use1, use2: details.use2,
      use3: details.use3, use4: details.use4,
      dosage: details.dosage,
      side_effects: details.side_effects || [],
      contraindications: details.contraindications || [],
      brand_name: details.brand_name || [],
      price: details.price || `${basic.price}`,
      delivery_time: details.delivery_time,
      prescription_required: typeof details.prescription_required === "boolean" 
        ? details.prescription_required 
        : basic.prescriptionRequired,
      in_stock: typeof details.in_stock === "boolean" 
        ? details.in_stock 
        : basic.stock > 0,
      recommended_dosage: details.recommended_dosage || {},
      availability: details.availability || (basic.stock > 0 ? "In Stock" : "Out of Stock"),
      precautions: details.precautions || [],
      alternativeMedicines: details.alternativeMedicines || [],
      manufacturer: details.manufacturer,
      category: details.category || basic.category,
      rating: details.rating,
    };

    res.json(combined);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
