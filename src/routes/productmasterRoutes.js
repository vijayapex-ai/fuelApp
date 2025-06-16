const express = require('express');
const router = express.Router();
const db = require('../database/db');


// Ensure ProductMaster table exists
const createProductTableQuery = `
  CREATE TABLE IF NOT EXISTS ProductMaster (
    productId INT PRIMARY KEY,
    productName VARCHAR(255) NOT NULL,
    commodityName VARCHAR(255),
    unitOfMeasurement VARCHAR(50),
    gstProduct VARCHAR(100),
    conversionFactor DECIMAL(10,4),
    salesRate DECIMAL(10,2),
    mrp DECIMAL(10,2)
  )
  `;

db.query(createProductTableQuery, (err) => {
  if (err) {
    console.error('Error creating ProductMaster table:', err);
  } else {
    console.log('ProductMaster table ensured');
  }
});


// 🔍 GET all products
router.get('/', (req, res) => {
  db.query('SELECT * FROM ProductMaster ORDER BY productId', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// ➕ ADD new product
router.post('/', (req, res) => {
  const {
    productId,
    productName,
    commodityName,
    unitOfMeasurement,
    gstProduct,
    conversionFactor,
    salesRate,
    mrp
  } = req.body;

  const query = `
    INSERT INTO ProductMaster
    (productId, productName, commodityName, unitOfMeasurement, gstProduct, conversionFactor, salesRate, mrp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    productId,
    productName,
    commodityName,
    unitOfMeasurement,
    gstProduct,
    conversionFactor,
    salesRate,
    mrp
  ], (err, result) => {
    if (err) return res.status(400).send(err);
    res.json({ id: result.insertId });
  });
});

// ✏️ UPDATE existing product
router.put('/:id', (req, res) => {
  const {
    productName,
    commodityName,
    unitOfMeasurement,
    gstProduct,
    conversionFactor,
    salesRate,
    mrp
  } = req.body;

  const query = `
    UPDATE ProductMaster
    SET productName = ?, commodityName = ?, unitOfMeasurement = ?, gstProduct = ?,
        conversionFactor = ?, salesRate = ?, mrp = ?
    WHERE productId = ?
  `;

  db.query(query, [
    productName,
    commodityName,
    unitOfMeasurement,
    gstProduct,
    conversionFactor,
    salesRate,
    mrp,
    req.params.id
  ], (err, result) => {
    if (err) return res.status(400).send(err);
    res.sendStatus(200);
  });
});

module.exports = router;