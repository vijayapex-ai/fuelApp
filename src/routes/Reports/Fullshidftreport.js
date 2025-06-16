const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// Helper function to get financial year table names
function getFinancialYearTable(dateStr, isGst = false) {
    const date = new Date(dateStr);
    const year = date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
    return `${year}${isGst ? '_gst_bills' : '_bills'}`;
}

router.get('/summary', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter is required" });

    const retailTable = getFinancialYearTable(date);
    const gstTable = getFinancialYearTable(date, true);

    db.query(
        `SELECT 
            COALESCE(SUM(amount), 0) AS totalRetail,
            COALESCE(SUM(CASE WHEN modeOfSales = 'credit' THEN amount ELSE 0 END), 0) AS retailCredit
        FROM \`${retailTable}\`
        WHERE shiftDate = ?`,
        [date],
        (retailErr, retailResults) => {
            if (retailErr) {
                console.error('Retail query error:', retailErr);
                return res.status(500).json({ error: "Error fetching retail data" });
            }

            db.query(
                `SELECT 
                    COALESCE(SUM(grandTotal), 0) AS totalGst,
                    COALESCE(SUM(CASE WHEN modeOfSales = 'credit' THEN grandTotal ELSE 0 END), 0) AS gstCredit
                FROM \`${gstTable}\`
                WHERE shiftDate = ?`,
                [date],
                (gstErr, gstResults) => {
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
                }
            );
        }
    );
});

router.get('/daybook-receipts', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter is required" });

    const year = new Date(date).getMonth() < 3 ? new Date(date).getFullYear() - 1 : new Date(date).getFullYear();
    const tableName = `\`${year}_daybook\``;

    const creditQuery = `
        SELECT 
            accountName,
            credit AS amount,
            description,
            createdAt
        FROM ${tableName}
        WHERE shiftDate = ?
            AND credit > 0
        ORDER BY createdAt
    `;

    const debitQuery = `
        SELECT 
            accountName,
            debit AS amount,
            description,
            createdAt
        FROM ${tableName}
        WHERE shiftDate = ?
            AND debit > 0
        ORDER BY createdAt
    `;

    try {
        const [credits] = await db.promise().query(creditQuery, [date]);
        const [debits] = await db.promise().query(debitQuery, [date]);

        res.json({ credits, debits });
    } catch (err) {
        console.error('Daybook receipts query error:', err);
        res.status(500).json({ error: "Error fetching daybook receipts" });
    }
});

router.get('/produtsaleretail', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter is required" });

    const tableName = getFinancialYearTable(date);

    db.query(`
        SELECT 
            productName,
            SUM(qty) AS totalQty,
            SUM(amount) AS totalAmount
        FROM \`${tableName}\`
        WHERE shiftDate = ?
        GROUP BY productName
    `, [date], (err, results) => {
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({
                error: "Internal server error",
                details: err.message
            });
        }
        res.json(results.length > 0 ? results : []);
    });
});

router.get('/produtsalegst', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter is required" });

    const tableName = getFinancialYearTable(date, true);

    db.query(`
        SELECT 
            productName,
            SUM(qty) AS totalQty,
            SUM(amount) AS totalAmount
        FROM \`${tableName}\`
        WHERE shiftDate = ?
        GROUP BY productName
    `, [date], (err, results) => {
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({
                error: "Internal server error",
                details: err.message
            });
        }
        res.json(results.length > 0 ? results : []);
    });
});

router.get('/tax-summary', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter is required" });

    const tableName = getFinancialYearTable(date, true);

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
        WHERE shiftDate = ?
        GROUP BY gstproduct, hsnCode, taxPercent
        ORDER BY product
    `;

    try {
        const [rows] = await db.promise().query(query, [date]);

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
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date parameter is required" });

    const retailTable = getFinancialYearTable(date);
    const gstTable = getFinancialYearTable(date, true);

    const retailCreditQuery = `
        SELECT 
            partyName AS ACCOUNT,
            vehicleNumber AS VEHICLE,
            billNumber AS BILLNO,
            amount AS AMOUNT
        FROM \`${retailTable}\`
        WHERE shiftDate = ? AND modeOfSales = 'credit'
    `;

    const gstCreditQuery = `
        SELECT 
            partyName AS ACCOUNT,
            vehicleNumber AS VEHICLE,
            billNumber AS BILLNO,
            grandTotal AS AMOUNT
        FROM \`${gstTable}\`
        WHERE shiftDate = ? AND modeOfSales = 'credit'
    `;

    try {
        const [retailCredits] = await db.promise().query(retailCreditQuery, [date]);
        const [gstCredits] = await db.promise().query(gstCreditQuery, [date]);

        const allCredits = [...retailCredits, ...gstCredits];

        res.json(allCredits);
    } catch (err) {
        console.error("Credit bills query error:", err);
        res.status(500).json({ error: "Error fetching credit bills" });
    }
});

module.exports = router;
