const pool = require("../config/db");

exports.evaluateRisk = async (metrics) => {
  const { spo2, bpm, bp, temperature } = metrics;

  const protocols = await pool.query(
    "SELECT * FROM protocols WHERE active = true"
  );

  let riskStatus = "NORMAL";

  protocols.rows.forEach((rule) => {
    const value = metrics[rule.parameter.toLowerCase()];

    if (value < rule.min_value || value > rule.max_value) {
      riskStatus = "HIGH_RISK";
    }
  });

  return riskStatus;
};
