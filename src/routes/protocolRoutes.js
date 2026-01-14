const express = require("express");
const router = express.Router();
const protocolController = require("../controllers/protocolController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post(
  "/",
  auth,
  role("ADMIN"),
  protocolController.createProtocol
);

router.get(
  "/",
  auth,
  role("ADMIN"),
  protocolController.getActiveProtocols
);

module.exports = router;
