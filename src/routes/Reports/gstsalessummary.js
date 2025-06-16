const express = require('express');
const router = express.Router();
const db = require('../../database/db');


// Helper function to get current financial year table
function getFinancialYearTable() {
    const today = new Date();
    const year = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
    return `${year}_gst_bills`;
  }
  

// Helper function to check if table exists
async function ensureBillTableExists(tableName) {
  const [tables] = await db.promise().query("SHOW TABLES LIKE ?", [tableName]);
  if (tables.length === 0) {
    throw new Error(`Table ${tableName} does not exist`);
  }
}

router.get('/summary', async (req, res) => {
    const { fromDate, toDate } = req.query;
    
    try {
        const tableName = getFinancialYearTable();
        await ensureBillTableExists(tableName);
  
        const query = `
            SELECT 
                productName AS product,
                unit,
                gstproduct,
                SUM(qty) AS qty,
                SUM(amount) AS amount,
                SUM(cgst) AS cgst,
                SUM(sgst) AS sgst,
                SUM(igst) AS igst
            FROM \`${tableName}\`
            WHERE shiftDate BETWEEN ? AND ?
            GROUP BY productName, unit, gstproduct
            ORDER BY productName
        `;
  
        const [rows] = await db.promise().query(query, [fromDate, toDate]);
        
        // Format numbers and handle null values
        const formattedRows = rows.map(row => ({
            ...row,
            qty: row.qty || 0,
            amount: parseFloat(row.amount || 0),
            cgst: parseFloat(row.cgst || 0),
            sgst: parseFloat(row.sgst || 0),
            igst: parseFloat(row.igst || 0)
        }));
        
        res.json(formattedRows);
    } catch (err) {
        console.error('Error fetching GST summary:', err);
        const message = err.message.includes('does not exist') 
            ? 'Financial year table not available yet' 
            : 'Failed to fetch summary';
        res.status(500).json({ error: message });
    }
});
  
module.exports = router;