const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// Helper function to get financial year table names
function getFinancialYearTable(dateStr, isGst = false) {
    const date = new Date(dateStr);
    const year = date.getMonth() < 3 ? date.getFullYear() - 1 : date.getFullYear();
    return `${year}${isGst ? '_gst_bills' : '_bills'}`;
}


router.get('/bills', (req, res) => {
    const { fromDate, toDate, format, party } = req.query;

    if (!fromDate || !toDate) {
        return res.status(400).json({ error: "Missing fromDate or toDate" });
    }

    const billsTable = getFinancialYearTable(fromDate);
    const gstBillsTable = getFinancialYearTable(fromDate, true);

    let allBills = [];

    // First query for GST bills
    db.query(
        `SELECT billNumber, partyName, indentNumber, vehicleNumber, qty, unit, productName, amount, shiftDate 
         FROM ${gstBillsTable} 
         WHERE modeOfSales = 'Credit' AND shiftDate BETWEEN ? AND ? ${party ? 'AND partyName = ?' : ''}`,
        party ? [fromDate, toDate, party] : [fromDate, toDate],
        (err, gstBills) => {
            if (err) {
                console.error("Error fetching GST bills:", err);
                return res.status(500).json({ error: "Failed to fetch GST bills" });
            }

            // Second query for normal bills
            db.query(
                `SELECT billNumber, partyName, indentNumber, vehicleNumber, qty, unit, productName, amount, shiftDate 
                 FROM ${billsTable} 
                 WHERE modeOfSales = 'Credit' AND shiftDate BETWEEN ? AND ? ${party ? 'AND partyName = ?' : ''}`,
                party ? [fromDate, toDate, party] : [fromDate, toDate],
                (err, normalBills) => {
                    if (err) {
                        console.error("Error fetching normal bills:", err);
                        return res.status(500).json({ error: "Failed to fetch normal bills" });
                    }

                    allBills = [...gstBills, ...normalBills];

                    // Grouping logic
                    const grouped = {};
                    allBills.forEach(bill => {
                        const vehicle = bill.vehicleNumber?.trim() || 'GENSET';
                        const key = `${bill.partyName}__${vehicle}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push({
                            date: formatDate(bill.shiftDate),
                            indent: bill.indentNumber,
                            product: bill.productName,
                            qty: parseFloat(bill.qty).toFixed(3),
                            unit: bill.unit,
                            billNo: bill.billNumber,
                            amount: parseFloat(bill.amount).toFixed(2)
                        });
                    });

                    const result = Object.entries(grouped).map(([key, bills]) => {
                        const [partyName, vehicle] = key.split("__");
                        const total = bills.reduce((sum, b) => sum + parseFloat(b.amount), 0).toFixed(2);
                        return { partyName, vehicle, bills, total };
                    });

                    res.json({ data: result });
                }
            );
        }
    );
});


router.get('/party', (req, res) => {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
        return res.status(400).json({ error: "Missing fromDate or toDate" });
    }

    const billsTable = getFinancialYearTable(fromDate);
    const gstBillsTable = getFinancialYearTable(fromDate, true);

    let allParties = [];

    // First query for normal parties
    db.query(
        `SELECT DISTINCT partyName FROM ${billsTable} 
         WHERE modeOfSales = 'Credit' AND shiftDate BETWEEN ? AND ?`,
        [fromDate, toDate],
        (err, normalParties) => {
            if (err) {
                console.error("Error fetching normal parties:", err);
                return res.status(500).json({ error: "Failed to fetch normal parties" });
            }

            // Second query for GST parties
            db.query(
                `SELECT DISTINCT partyName FROM ${gstBillsTable} 
                 WHERE modeOfSales = 'Credit' AND shiftDate BETWEEN ? AND ?`,
                [fromDate, toDate],
                (err, gstParties) => {
                    if (err) {
                        console.error("Error fetching GST parties:", err);
                        return res.status(500).json({ error: "Failed to fetch GST parties" });
                    }

                    allParties = [...normalParties.map(p => p.partyName), ...gstParties.map(p => p.partyName)];
                    const uniqueParties = [...new Set(allParties)];

                    res.json({ data: uniqueParties });
                }
            );
        }
    );
});


// Utility function
function formatDate(dateStr) {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
}


module.exports = router;