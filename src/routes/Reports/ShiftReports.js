const express = require('express');
const router = express.Router();
const db = require('../../database/db');

function getFinancialYearTable(dateStr, type = 'retail') {
  const date = new Date(dateStr);
  const year = date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
  if (type === 'gst') return `${year}_gst_bills`;
  if (type === 'daybook') return `${year}_daybook`;
  return `${year}_bills`;
}

router.get('/summary', (req, res) => {
  const { date, shiftNo } = req.query;
  if (!date || !shiftNo) return res.status(400).json({ error: "Date and shiftNo parameters are required" });

  const retailTable = getFinancialYearTable(date);
  const gstTable = getFinancialYearTable(date, 'gst');

  db.query(`
    SELECT 
      COALESCE(SUM(amount), 0) AS totalRetail,
      COALESCE(SUM(CASE WHEN modeOfSales = 'credit' THEN amount ELSE 0 END), 0) AS retailCredit
    FROM \`${retailTable}\`
    WHERE shiftDate = ? AND shiftNo = ?
  `, [date, shiftNo], (retailErr, retailResults) => {
    if (retailErr) {
      console.error('Retail query error:', retailErr);
      return res.status(500).json({ error: "Error fetching retail data" });
    }

    db.query(`
      SELECT 
        COALESCE(SUM(grandTotal), 0) AS totalGst,
        COALESCE(SUM(CASE WHEN modeOfSales = 'credit' THEN grandTotal ELSE 0 END), 0) AS gstCredit
      FROM \`${gstTable}\`
      WHERE shiftDate = ? AND shiftNo = ?
    `, [date, shiftNo], (gstErr, gstResults) => {
      if (gstErr) {
        console.error('GST query error:', gstErr);
        return res.status(500).json({ error: "Error fetching GST data" });
      }

      const totalSales = parseFloat(retailResults[0].totalRetail) + parseFloat(gstResults[0].totalGst);
      const creditSales = parseFloat(retailResults[0].retailCredit) + parseFloat(gstResults[0].gstCredit);
      const balanceInHand = totalSales - creditSales;

      res.json({
        totalSales: totalSales.toFixed(2),
        creditSales: creditSales.toFixed(2),
        balanceInHand: balanceInHand.toFixed(2)
      });
    });
  });
});

router.get('/daybook-receipts', async (req, res) => {
  const { date, shiftNo } = req.query;
  if (!date || !shiftNo) return res.status(400).json({ error: "Date and shiftNo parameters are required" });

  const daybookTable = getFinancialYearTable(date, 'daybook');

  const creditQuery = `
    SELECT accountName, credit AS amount, description, createdAt
    FROM \`${daybookTable}\`
    WHERE shiftDate = ? AND shiftNo = ? AND credit > 0
    ORDER BY createdAt
  `;

  const debitQuery = `
    SELECT accountName, debit AS amount, description, createdAt
    FROM \`${daybookTable}\`
    WHERE shiftDate = ? AND shiftNo = ? AND debit > 0
    ORDER BY createdAt
  `;

  try {
    const [credits] = await db.promise().query(creditQuery, [date, shiftNo]);
    const [debits] = await db.promise().query(debitQuery, [date, shiftNo]);
    res.json({ credits, debits });
  } catch (err) {
    console.error('Daybook receipts query error:', err);
    res.status(500).json({ error: "Error fetching daybook receipts" });
  }
});

router.get('/produtsaleretail', (req, res) => {
  const { date, shiftNo } = req.query;
  if (!date || !shiftNo) return res.status(400).json({ error: "Date and shiftNo parameters are required" });

  const tableName = getFinancialYearTable(date);

  db.query(`
    SELECT productName, SUM(qty) AS totalQty, SUM(amount) AS totalAmount
    FROM \`${tableName}\`
    WHERE shiftDate = ? AND shiftNo = ?
    GROUP BY productName
  `, [date, shiftNo], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
    res.json(results.length > 0 ? results : []);
  });
});

router.get('/produtsalegst', (req, res) => {
  const { date, shiftNo } = req.query;
  if (!date || !shiftNo) return res.status(400).json({ error: "Date and shiftNo parameters are required" });

  const tableName = getFinancialYearTable(date, 'gst');

  db.query(`
    SELECT productName, SUM(qty) AS totalQty, SUM(amount) AS totalAmount
    FROM \`${tableName}\`
    WHERE shiftDate = ? AND shiftNo = ?
    GROUP BY productName
  `, [date, shiftNo], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
    res.json(results.length > 0 ? results : []);
  });
});

router.get('/tax-summary', async (req, res) => {
  const { date, shiftNo } = req.query;
  if (!date || !shiftNo) return res.status(400).json({ error: "Date and shiftNo parameters are required" });

  const tableName = getFinancialYearTable(date, 'gst');

  const query = `
    SELECT
      gstproduct AS product,
      hsnCode,
      ROUND((cgst + sgst + igst) * 100 / amount, 1) AS taxPercent,
      SUM(amount) AS grossAmt,
      SUM(cgst) AS totalCgst,
      SUM(sgst) AS totalSgst,
      SUM(igst) AS totalIgst,
      SUM(grandTotal) AS billAmt,
      ROUND(100 * SUM(cgst) / SUM(amount), 1) AS cgstPercent,
      ROUND(100 * SUM(sgst) / SUM(amount), 1) AS sgstPercent
    FROM \`${tableName}\`
    WHERE shiftDate = ? AND shiftNo = ?
    GROUP BY gstproduct, hsnCode, taxPercent
    ORDER BY product
  `;

  try {
    const [rows] = await db.promise().query(query, [date, shiftNo]);

    let total = {
      grossAmt: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      billAmt: 0
    };

    for (const row of rows) {
      total.grossAmt += parseFloat(row.grossAmt);
      total.totalCgst += parseFloat(row.totalCgst);
      total.totalSgst += parseFloat(row.totalSgst);
      total.totalIgst += parseFloat(row.totalIgst);
      total.billAmt += parseFloat(row.billAmt);
    }

    res.json({ data: rows, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/credit-bills', async (req, res) => {
  const { date, shiftNo } = req.query;
  if (!date || !shiftNo) return res.status(400).json({ error: "Date and shiftNo parameters are required" });

  const retailTable = getFinancialYearTable(date);
  const gstTable = getFinancialYearTable(date, 'gst');

  const retailCreditQuery = `
    SELECT 
      partyName AS ACCOUNT,
      vehicleNumber AS VEHICLE,
      billNumber AS BILLNO,
      amount AS AMOUNT
    FROM \`${retailTable}\`
    WHERE shiftDate = ? AND shiftNo = ? AND modeOfSales = 'credit'
  `;

  const gstCreditQuery = `
    SELECT 
      partyName AS ACCOUNT,
      vehicleNumber AS VEHICLE,
      billNumber AS BILLNO,
      grandTotal AS AMOUNT
    FROM \`${gstTable}\`
    WHERE shiftDate = ? AND shiftNo = ? AND modeOfSales = 'credit'
  `;

  try {
    const [retailCredits] = await db.promise().query(retailCreditQuery, [date, shiftNo]);
    const [gstCredits] = await db.promise().query(gstCreditQuery, [date, shiftNo]);

    const allCredits = [...retailCredits, ...gstCredits];
    res.json(allCredits);
  } catch (err) {
    console.error("Credit bills query error:", err);
    res.status(500).json({ error: "Error fetching credit bills" });
  }
});

module.exports = router;
