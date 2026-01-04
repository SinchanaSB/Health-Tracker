const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// 🧠 Replace with your actual MongoDB connection string
mongoose
  .connect("      ")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const Profile = mongoose.model("Profile", {
  name: String,
  age: String,
  conditions: String,
});

const Appointment = mongoose.model("Appointment", {
  date: String,
  doctor: String,
});

const Prescription = mongoose.model("Prescription", {
  name: String,
  image: String,
});

// --- ROUTES ---

app.post("/profile", async (req, res) => {
  await Profile.findOneAndUpdate({}, req.body, { upsert: true });
  res.send("Profile saved");
});

app.get("/appointments", async (req, res) => {
  res.json(await Appointment.find());
});

app.post("/appointments", async (req, res) => {
  const appointment = new Appointment(req.body);
  await appointment.save();
  res.send("Appointment added");
});

app.get("/prescriptions", async (req, res) => {
  res.json(await Prescription.find());
});

app.post("/prescriptions", async (req, res) => {
  const prescription = new Prescription(req.body);
  await prescription.save();
  res.send("Prescription added");
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
