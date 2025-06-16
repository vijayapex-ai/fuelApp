const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to get current financial year suffix
function getFinancialYearTable() {
  const today = new Date();
  const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  return `${year}_bills`;
}

// Ensure the financial year table exists
async function ensureBillTableExists(tableName) {
  const createQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      billNumber VARCHAR(255),
      partyName VARCHAR(255),
      indentNumber VARCHAR(255),
      billPrint VARCHAR(10),
      modeOfSales VARCHAR(50),
      vehicleNumber VARCHAR(50),
      discount DECIMAL(10,2),
      code VARCHAR(50),
      productName VARCHAR(255),
      unit VARCHAR(10),
      qty DECIMAL(10,2),
      rate DECIMAL(10,2),
      amount DECIMAL(10,2),
      shiftNo INT,
      shiftDate DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  return db.promise().query(createQuery);
}

// POST route to save bill data
router.post('/save', async (req, res) => {
  const form = req.body;
  const tableName = getFinancialYearTable();

  try {
    await ensureBillTableExists(tableName);

    const insertPromises = form.productList.map(product => {
      const {
        billNumber, partyName, indentNumber, billPrint,
        modeOfSales, vehicleNumber, discount
      } = form;

      const {
        code, productName, unit, qty, rate, amount
      } = product;

      const insertQuery = `
        INSERT INTO \`${tableName}\` (
          billNumber, partyName, indentNumber, billPrint,
          modeOfSales, vehicleNumber, discount,
          code, productName, unit, qty, rate, amount,
          shiftNo, shiftDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        billNumber, partyName, indentNumber, billPrint,
        modeOfSales, vehicleNumber, discount || 0,
        code, productName, unit, qty, rate, amount,
        form.shiftNo, form.shiftDate
      ];

      return db.promise().query(insertQuery, values);
    });

    await Promise.all(insertPromises);

    res.status(200).json({ message: 'Bill data inserted successfully' });
  } catch (err) {
    console.error('Insert failed:', err);
    res.status(500).json({ error: 'Failed to insert data' });
  }
});

  // GET next bill number
  router.get('/next-bill-number', async (req, res) => {
    try {
      const tableName = getFinancialYearTable();
  
      // Ensure the table exists before querying
      await ensureBillTableExists(tableName);
  
      const [rows] = await db.promise().query(`SELECT MAX(billNumber) AS maxBill FROM \`${tableName}\``);
      const nextBillNumber = rows[0].maxBill ? parseInt(rows[0].maxBill) + 1 : 100;
  
      res.json({ nextBillNumber });
    } catch (err) {
      console.error('Error fetching next bill number:', err);
      res.status(500).json({ error: 'Failed to fetch next bill number' });
    }
  });
  

  // Add this to your bills route file
  router.get('/product-totals', async (req, res) => {
    try {
        const tableName = getFinancialYearTable();
        const { shiftDate, shiftNo } = req.query;

        // Validate required parameters
        if (!shiftDate || !shiftNo) {
            return res.status(400).json({ 
                error: 'Both shiftDate and shiftNo parameters are required' 
            });
        }

        // Ensure the table exists
        await ensureBillTableExists(tableName);

        const query = `
            SELECT 
                productName,
                SUM(qty) as totalQty,
                COUNT(DISTINCT billNumber) as billCount
            FROM \`${tableName}\`
            WHERE DATE(shiftDate) = ? 
            AND shiftNo = ?
            GROUP BY productName
        `;

        const params = [shiftDate, shiftNo];

        const [results] = await db.promise().query(query, params);
        
        res.json(results);
        console.log('Query results:', results);
    } catch (err) {
        console.error('Error fetching product totals:', err);
        res.status(500).json({ 
            error: 'Failed to fetch product totals',
            details: err.message 
        });
    }
  });


module.exports = router;
