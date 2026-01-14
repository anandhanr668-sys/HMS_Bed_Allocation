const pool = require("../config/db");
const { getIO } = require("../config/socket");

exports.allocateBed = async (patientId, riskStatus) => {
  const wardType = riskStatus === "HIGH_RISK" ? "EMERGENCY" : "NORMAL";

  const bedResult = await pool.query(
    `SELECT * FROM beds 
     WHERE ward_type = $1 AND status = 'AVAILABLE'
     LIMIT 1`,
    [wardType]
  );

  if (bedResult.rows.length === 0) {
    return { success: false, message: "No beds available" };
  }

  const bed = bedResult.rows[0];

  await pool.query(
    `UPDATE beds
     SET status = 'OCCUPIED', patient_id = $1
     WHERE id = $2`,
    [patientId, bed.id]
  );

  getIO().emit("BED_ALLOCATED", {
    bedId: bed.id,
    patientId,
    wardType,
  });
 return { success: true, bedId: bed.id };
};