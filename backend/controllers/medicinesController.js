// controllers/medicinesController.js
const Medicine = require("../models/Medicine"); // Adjust the path as necessary

// Get list of medicines with filters
exports.getMedicines = async (req, res) => {
  try {
    const filters = req.query; // Use query parameters for filtering
    const medicines = await Medicine.find(filters); // Adjust as necessary based on your model
    res.status(200).json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get details of a specific medicine by ID
exports.getMedicineById = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const medicine = await Medicine.findById(medicineId); // Adjust as necessary based on your model

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.status(200).json(medicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
