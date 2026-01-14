const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const bedRoutes = require("./routes/bedRoutes");
const protocolRoutes = require("./routes/protocolRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/protocols", protocolRoutes);

app.get("/", (req, res) => {
  res.send("LCNC Hospital Platform API Running");
});

module.exports = app;
