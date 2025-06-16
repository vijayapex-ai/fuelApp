const express = require('express');
const router = express.Router();
const db = require('../database/db');

const createVehicleTableQuery = `
  CREATE TABLE IF NOT EXISTS Vehicle (
    vehicleId INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT NOT NULL,
    vehicleNumber VARCHAR(255) NOT NULL,
    FOREIGN KEY (customerId) REFERENCES Customer(id) ON DELETE CASCADE
  )
  `;

db.query(createVehicleTableQuery, (err) => {
  if (err) {
    console.error('Error creating Vehicle table:', err);
  } else {
    console.log('Vehicle table ensured');
  }
});

// Get all vehicles by customer
router.get('/:customerId', (req, res) => {
  const { customerId } = req.params;
  db.query('SELECT * FROM Vehicle WHERE customerId = ?', [customerId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Save/update vehicles for a customer
router.post('/:customerId', (req, res) => {
  const { customerId } = req.params;
  const { vehicles } = req.body;
  db.query('DELETE FROM Vehicle WHERE customerId = ?', [customerId], (err) => {
    if (err) return res.status(500).send(err);
    if (!vehicles.length) return res.sendStatus(200);
    const values = vehicles.map(v => [customerId, v]);
    db.query('INSERT INTO Vehicle (customerId, vehicleNumber) VALUES ?', [values], (err) => {
      if (err) return res.status(500).send(err);
      res.sendStatus(200);
    });
  });
});

module.exports = router;