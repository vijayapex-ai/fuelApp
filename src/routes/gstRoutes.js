const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ensure GSTTaxMaster table exists
const createGSTTaxTableQuery = `
  CREATE TABLE IF NOT EXISTS GSTTaxMaster (
    taxId INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    hsnCode VARCHAR(50),
    gstUnit VARCHAR(50),
    totalTax DECIMAL(6,2),
    cgst DECIMAL(6,2),
    sgst DECIMAL(6,2),
    igst DECIMAL(6,2),
    category VARCHAR(100)
  )
  `;

db.query(createGSTTaxTableQuery, (err) => {
  if (err) {
    console.error('Error creating GSTTaxMaster table:', err);
  } else {
    console.log('GSTTaxMaster table ensured');
  }
});

// Get all entries
router.get('/', (req, res) => {
  db.query('SELECT * FROM GSTTaxMaster ORDER BY taxId', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add new entry
router.post('/', (req, res) => {
  const { description, hsnCode, gstUnit, totalTax, cgst, sgst, igst, category } = req.body;
  const query = `
    INSERT INTO GSTTaxMaster (description, hsnCode, gstUnit, totalTax, cgst, sgst, igst, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [description, hsnCode, gstUnit, totalTax, cgst, sgst, igst, category], (err, result) => {
    if (err) return res.status(400).send(err);
    res.json({ id: result.insertId });
  });
});

// Update entry
router.put('/:id', (req, res) => {
  const { description, hsnCode, gstUnit, totalTax, cgst, sgst, igst, category } = req.body;
  const query = `
    UPDATE GSTTaxMaster
    SET description = ?, hsnCode = ?, gstUnit = ?, totalTax = ?, cgst = ?, sgst = ?, igst = ?, category = ?
    WHERE taxId = ?
  `;
  db.query(query, [description, hsnCode, gstUnit, totalTax, cgst, sgst, igst, category, req.params.id], (err, result) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

module.exports = router;