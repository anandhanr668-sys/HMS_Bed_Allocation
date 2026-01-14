const pool = require("../config/db");

exports.registerPatient = async (req, res) => {
  const { name, phone, email, age, gender } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO patient_master 
       (name, phone, email, age, gender)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [name, phone, email, age, gender]
    );

    res.status(201).json({
      message: "Patient registered",
      patientId: result.rows[0].id,
    });
  } catch (error) {
    res.status(500).json({ message: "Patient registration failed", error });
  }
};
