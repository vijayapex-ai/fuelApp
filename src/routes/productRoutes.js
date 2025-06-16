const express = require('express');
const router = express.Router();
const db = require('../database/db');


// Ensure Product table exists
const createProductTableQuery = `
  CREATE TABLE IF NOT EXISTS Product (
    productId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL
  )
  `;

db.query(createProductTableQuery, (err) => {
  if (err) {
    console.error('Error creating Product table:', err);
  } else {
    console.log('Product table ensured');
  }
});


// Get all products with rate
router.get('/', (req, res) => {
  const query = 'SELECT * FROM Product ORDER BY productId ASC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add a new product with rate
router.post('/', (req, res) => {
  const { name, rate } = req.body;
  const query = 'INSERT INTO Product (name, rate) VALUES (?, ?)';
  db.query(query, [name, rate], (err, result) => {
    if (err) return res.status(400).send(err);
    res.json({ productId: result.insertId });
  });
});

// Update product and rate
router.put('/:id', (req, res) => {
  const { name, rate } = req.body;
  const query = 'UPDATE Product SET name = ?, rate = ? WHERE productId = ?';
  db.query(query, [name, rate, req.params.id], (err) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

module.exports = router;
