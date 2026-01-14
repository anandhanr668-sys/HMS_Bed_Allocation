const pool = require("../config/db");
const ruleService = require("../services/ruleService");

exports.submitMetrics = async (req, res) => {
  const { patientId, spo2, bpm, bp, temperature } = req.body;

  try {
    await pool.query(
      `INSERT INTO patient_health_metrics
       (patient_id, spo2, bpm, bp, temperature)
       VALUES ($1, $2, $3, $4, $5)`,
      [patientId, spo2, bpm, bp, temperature]
    );

    // Trigger rule evaluation
    const riskStatus = await ruleService.evaluateRisk({
      spo2,
      bpm,
      bp,
      temperature,
    });

    res.json({
      message: "Metrics submitted",
      riskStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Metrics submission failed", error });
  }
};
