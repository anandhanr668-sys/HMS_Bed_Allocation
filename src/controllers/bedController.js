const pool = require("../config/db");
const { getIO } = require("../config/socket");

exports.updateBedStatus = async (req, res) => {
  const { bedId, status, patientId } = req.body;

  try {
    await pool.query(
      `UPDATE beds 
       SET status = $1, patient_id = $2
       WHERE id = $3`,
      [status, patientId || null, bedId]
    );

    getIO().emit("BED_UPDATED", { bedId, status });

    res.json({ message: "Bed status updated" });
  } catch (error) {
    res.status(500).json({ message: "Bed update failed", error });
  }
};
