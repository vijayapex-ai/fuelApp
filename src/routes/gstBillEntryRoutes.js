const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to get current financial year suffix
function getFinancialYearTable() {
  const today = new Date();
  const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  return `${year}_gst_bills`;
}

// Ensure the financial year table exists
async function ensureBillTableExists(tableName) {
    const createQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      billNumber VARCHAR(255),
      partyName VARCHAR(255),
      indentNumber VARCHAR(255),
      saleType VARCHAR(50),
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
      cgst DECIMAL(10,2),
      sgst DECIMAL(10,2),
      igst DECIMAL(10,2),
      grandTotal DECIMAL(10,2),
      shiftNo INT,
      shiftDate DATE,
      gstproduct VARCHAR(255),
      hsnCode VARCHAR(255),
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
          billNumber, partyName, indentNumber, saleType, billPrint,
          modeOfSales, vehicleNumber, discount
        } = form;
  
        const {
          code, productName, unit, qty, rate, amount,
          cgst = 0, sgst = 0, igst = 0, hsnCode
        } = product;
  
        // Ensure all values are treated as numbers
        const totalAmount = parseFloat(amount) || 0;  // Convert amount to number or default to 0
        const parsedCgst = parseFloat(cgst) || 0;  // Convert cgst to number or default to 0
        const parsedSgst = parseFloat(sgst) || 0;  // Convert sgst to number or default to 0
        const parsedIgst = parseFloat(igst) || 0;  // Convert igst to number or default to 0
  
        let grandTotal = totalAmount;
  
        // Calculate the grand total based on the sale type and tax type (CGST/SGST or IGST)
        if (modeOfSales === 'Credit') {
          if (form.isInterState) {
            grandTotal += parsedIgst;  // For interstate, use IGST
          } else {
            grandTotal += (parsedCgst + parsedSgst);  // For intra-state, use CGST and SGST
          }
        }
  
        // Insert query for the product
        const insertQuery = `
          INSERT INTO \`${tableName}\` (
            billNumber, partyName, indentNumber, saleType, billPrint,
            modeOfSales, vehicleNumber, discount,
            code, productName, unit, qty, rate, amount,
            cgst, sgst, igst, grandTotal, shiftNo, shiftDate, gstproduct, hsnCode
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          billNumber, partyName, indentNumber, saleType, billPrint,
          modeOfSales, vehicleNumber, discount || 0,
          code, productName, unit, qty, rate, amount,
          parsedCgst, parsedSgst, parsedIgst, grandTotal.toFixed(2), 
          form.shiftNo, form.shiftDate,  product.gstProduct, hsnCode   
        ];
  
        return db.promise().query(insertQuery, values);
      });
  
      // Execute all insert queries in parallel
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


  // GET GST Sales Summary Report


module.exports = router;
