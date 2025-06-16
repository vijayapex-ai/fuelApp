const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Create table if it doesn't exist
const createCustomerTableQuery = `
  CREATE TABLE IF NOT EXISTS customer_master (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    accountName VARCHAR(255) NOT NULL,
    address1 VARCHAR(255),
    address2 VARCHAR(255),
    place VARCHAR(255),
    state VARCHAR(100),
    pinCode VARCHAR(20),
    tinNo VARCHAR(50),
    cstNo VARCHAR(50),
    gstNo VARCHAR(50),
    mobileNumber VARCHAR(15) NOT NULL
  )
  `;

db.query(createCustomerTableQuery, (err) => {
  if (err) {
    console.error('Error creating customer_master table:', err);
  } else {
    console.log('customer_master table ensured');
  }
});


// ✅ GET all customers (with optional search)
router.get('/', (req, res) => {
  let query = 'SELECT * FROM customer_master';
  const params = [];
  
  // Optional search by accountName
  if (req.query.search) {
    query += ' WHERE accountName LIKE ?';
    params.push(`%${req.query.search}%`);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Database error',
        message: err.message 
      });
    }
    res.json(results);
  });
});

// ✅ GET single customer
router.get('/:id', (req, res) => {
  const query = 'SELECT * FROM customer_master WHERE customerId = ?';
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(results[0]);
  });
});

// ✅ CREATE customer
router.post('/', (req, res) => {
  const {
    accountName, address1, address2,
    place, state, pinCode,
    tinNo, cstNo, gstNo, mobileNumber
  } = req.body;

  // Validate required fields
  if (!accountName || !mobileNumber) {
    return res.status(400).json({ 
      error: 'Validation error',
      message: 'Account Name and Mobile Number are required.' 
    });
  }

  // Validate mobile number format (basic check)
  if (!/^\d{10,15}$/.test(mobileNumber)) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Mobile number must be 10-15 digits'
    });
  }

  const query = `
    INSERT INTO customer_master (
      accountName, address1, address2, place,
      state, pinCode, tinNo, cstNo, gstNo, mobileNumber
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    accountName, 
    address1 || null, 
    address2 || null,
    place || null, 
    state || null, 
    pinCode || null,
    tinNo || null, 
    cstNo || null, 
    gstNo || null, 
    mobileNumber
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Database error',
        message: err.message 
      });
    }
    res.status(201).json({ 
      id: result.insertId,
      message: 'Customer created successfully' 
    });
  });
});

// ✅ UPDATE customer
router.put('/:id', (req, res) => {
  const customerId = req.params.id;
  const {
    accountName, address1, address2,
    place, state, pinCode,
    tinNo, cstNo, gstNo, mobileNumber
  } = req.body;

  // Validate required fields
  if (!accountName || !mobileNumber) {
    return res.status(400).json({ 
      error: 'Validation error',
      message: 'Account Name and Mobile Number are required.' 
    });
  }

  // First check if customer exists
  db.query('SELECT 1 FROM customer_master WHERE customerId = ?', [customerId], 
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Proceed with update
      const query = `
        UPDATE customer_master SET
          accountName = ?, address1 = ?, address2 = ?,
          place = ?, state = ?, pinCode = ?,
          tinNo = ?, cstNo = ?, gstNo = ?, mobileNumber = ?
        WHERE customerId = ?
      `;

      const values = [
        accountName, 
        address1 || null, 
        address2 || null,
        place || null, 
        state || null, 
        pinCode || null,
        tinNo || null, 
        cstNo || null, 
        gstNo || null, 
        mobileNumber,
        customerId
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ 
          message: 'Customer updated successfully',
          affectedRows: result.affectedRows 
        });
      });
  });
});

// ✅ DELETE customer
router.delete('/:id', (req, res) => {
  const customerId = req.params.id;

  // First check if customer exists
  db.query('SELECT 1 FROM customer_master WHERE customerId = ?', [customerId], 
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Proceed with deletion
      db.query('DELETE FROM customer_master WHERE customerId = ?', [customerId], 
        (err, result) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ 
            message: 'Customer deleted successfully',
            affectedRows: result.affectedRows 
          });
      });
  });
});

module.exports = router;