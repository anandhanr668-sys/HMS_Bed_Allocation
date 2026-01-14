const express = require("express");
const router = express.Router();
const bedController = require("../controllers/bedController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.put(
  "/update",
  auth,
  role("NURSE"),
  bedController.updateBedStatus
);

module.exports = router;
