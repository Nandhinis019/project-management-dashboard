const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const employeeRoutes = require("./routes/employeeRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/projectmangement";

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.use("/api/employees", employeeRoutes);
app.use("/api/projects", projectRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Mongo connection failed:", error.message);
    process.exit(1);
  });
