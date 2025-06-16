const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/daybookentry
router.post('/', async (req, res) => {
  const { shiftDate, shiftNo, entries } = req.body;

  if (!shiftDate || !shiftNo || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  const year = new Date(shiftDate).getFullYear();
  const tableName = `${year}_daybook`;

  // ✅ Step 1: Create table if not exists
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shiftDate DATE NOT NULL,
      shiftNo INT NOT NULL,
      entryType VARCHAR(50) NOT NULL,
      accountName VARCHAR(255) NOT NULL,
      debit DECIMAL(12,2) DEFAULT 0.00,
      credit DECIMAL(12,2) DEFAULT 0.00,
      description TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await db.promise().query(createTableQuery);

    // ✅ Step 2: Insert entries
    const insertPromises = entries.map(entry => {
      const { entryType, accountName, debit, credit, description } = entry;
      const insertQuery = `
        INSERT INTO \`${tableName}\` (
          shiftDate, shiftNo, entryType, accountName,
          debit, credit, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        shiftDate,
        shiftNo,
        entryType,
        accountName,
        debit || 0.00,
        credit || 0.00,
        description || ''
      ];
      return db.promise().query(insertQuery, values);
    });

    await Promise.all(insertPromises);
    res.json({ message: 'Day book entries saved successfully.' });

  } catch (err) {
    console.error('Day book error:', err);
    res.status(500).json({ error: 'Failed to process entries', message: err.message });
  }
});

// GET /api/daybookentry?shiftDate=2025-05-03&shiftNo=1
router.get('/', async (req, res) => {
  const { shiftDate, shiftNo } = req.query;

  if (!shiftDate || !shiftNo) {
    return res.status(400).json({ error: 'Missing shiftDate or shiftNo' });
  }

  const year = new Date(shiftDate).getFullYear();
  const tableName = `${year}_daybook`;

  const query = `
    SELECT entryType, accountName, debit, credit, description
    FROM \`${tableName}\`
    WHERE shiftDate = ? AND shiftNo = ?
  `;

  try {
    const [rows] = await db.promise().query(query, [shiftDate, shiftNo]);
    res.json(rows);
  } catch (err) {
    if (err.message.includes('doesn\'t exist')) {
      res.json([]); // No entries if table doesn’t exist
    } else {
      console.error('Fetch daybook error:', err);
      res.status(500).json({ error: 'Failed to fetch entries' });
    }
  }
});


module.exports = router;
