const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://sinchanasb72_db_user:fxdFLqoHfHVPax3O@cluster0.ugdcekn.mongodb.net/HealthTrackerDB"
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --- SCHEMAS ---
const User = mongoose.model("User", {
  name: String,
  email: String,
  password: String,
});

const Appointment = mongoose.model("Appointment", {
  email: String, // link to user
  date: String,
  doctor: String,
  attended: { type: Boolean, default: false },
  prescription: { type: String, default: "" },
});

// --- LOGIN / REGISTER ---
app.post("/login", async (req, res) => {
  const { email, password, name } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email, password, name });
    await user.save();
  } else if (user.password !== password) {
    return res.json({ success: false, message: "Invalid password" });
  }

  res.json({ success: true, user });
});

// --- GET user’s appointments ---
app.get("/appointments/:email", async (req, res) => {
  const { email } = req.params;
  const appointments = await Appointment.find({ email });
  res.json(appointments);
});

// --- ADD new appointment ---
app.post("/appointments", async (req, res) => {
  const { email, date, doctor } = req.body;
  const appointment = new Appointment({ email, date, doctor });
  await appointment.save();
  res.json({ success: true, message: "Appointment added", appointment });
});

// --- UPDATE appointment (mark done / add prescription) ---
app.put("/appointments/:id", async (req, res) => {
  const { id } = req.params;
  const { attended, prescription } = req.body;

  try {
    const updated = await Appointment.findByIdAndUpdate(
      id,
      { attended, prescription },
      { new: true }
    );
    res.json({ success: true, appointment: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating appointment" });
  }
});

// --- DELETE appointment ---
app.delete("/appointments/:id", async (req, res) => {
  const { id } = req.params;
  await Appointment.findByIdAndDelete(id);
  res.json({ success: true, message: "Appointment deleted" });
});

// --- START SERVER ---
app.listen(5000, () => console.log("🚀 Server running on port 5000"));