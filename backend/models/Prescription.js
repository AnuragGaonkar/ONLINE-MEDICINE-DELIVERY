const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: { type: String, required: true }, // Image URL (uploaded to S3 or another storage)
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
