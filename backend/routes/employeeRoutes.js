const express = require("express");
const Employee = require("../models/Employee");

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const data = await Employee.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: "Failed to create employee", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: "Failed to update employee", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete employee", error: error.message });
  }
});

module.exports = router;
