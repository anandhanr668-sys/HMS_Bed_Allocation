const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post(
  "/register",
  auth,
  role("FRONT_DESK"),
  patientController.registerPatient
);

module.exports = router;
