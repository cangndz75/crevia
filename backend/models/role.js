const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
