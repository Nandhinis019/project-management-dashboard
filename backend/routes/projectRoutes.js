const express = require("express");
const Project = require("../models/Project");

const router = express.Router();

router.get("/", async (_, res) => {
  try {
    const data = await Project.find()
      .populate("assignedEmployees", "name role department isSpecial activity employmentStatus")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const project = await Project.create(req.body);
    const full = await Project.findById(project._id).populate(
      "assignedEmployees",
      "name role department isSpecial activity employmentStatus"
    );
    res.status(201).json(full);
  } catch (error) {
    res.status(400).json({ message: "Failed to create project", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedEmployees", "name role department isSpecial activity employmentStatus");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: "Failed to update project", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete project", error: error.message });
  }
});

module.exports = router;
