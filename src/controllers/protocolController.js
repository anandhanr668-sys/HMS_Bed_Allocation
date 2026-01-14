const pool = require("../config/db");

exports.createProtocol = async (req, res) => {
  const { parameter, min_value, max_value, severity, priority } = req.body;

  try {
    await pool.query(
      `INSERT INTO protocols
       (parameter, min_value, max_value, severity, priority, active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [parameter, min_value, max_value, severity, priority]
    );

    res.status(201).json({ message: "Protocol created" });
  } catch (error) {
    res.status(500).json({ message: "Protocol creation failed", error });
  }
};

exports.getActiveProtocols = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM protocols WHERE active = true"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch protocols", error });
  }
};
