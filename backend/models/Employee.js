const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "Employee" },
    department: { type: String, default: "General" },
    isSpecial: { type: Boolean, default: false },
    activity: { type: Number, default: 0 },
    employmentStatus: {
      type: String,
      enum: ["Active", "Inactive", "On Leave", "Offline"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
