const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper function to get table name from date
const getPumpReadingTableName = (date) => {
  if (!date) {
    throw new Error('Date is required to determine table name');
  }
  const year = date.split('-')[0];
  const month = date.split('-')[1];
  return `${year}_${month}_pumpreadings`;
};
// Ensure PumpConfiguration table exists (only needs one main table)
const createPumpConfigurationTableQuery = `
  CREATE TABLE IF NOT EXISTS PumpConfiguration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    productCode VARCHAR(255) NOT NULL,
    productName VARCHAR(255) NOT NULL,
    pumpCode VARCHAR(255) NOT NULL
  )
`;

db.query(createPumpConfigurationTableQuery, (err) => {
  if (err) {
    console.error('Error creating PumpConfiguration table:', err);
  } else {
    console.log('PumpConfiguration table ensured');
  }
});

// Helper function to create month-specific tables
const ensurePumpReadingTable = (tableName) => {
  const query = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productCode VARCHAR(255) NOT NULL,
      productName VARCHAR(255) NOT NULL,
      pumpCode VARCHAR(255) NOT NULL,
      openingReading DECIMAL(10, 2) NOT NULL,
      closingReading DECIMAL(10, 2) NOT NULL,
      saleLitre DECIMAL(10, 2) NOT NULL,
      shift VARCHAR(10) NOT NULL,
      date DATE NOT NULL,
      readingDate Date,
      status VARCHAR(50) NOT NULL
    )
  `;

  db.query(query, (err) => {
    if (err) {
      console.error(`Error creating table ${tableName}:`, err);
    } else {
      console.log(`Table ${tableName} ensured`);
    }
  });
};

// POST: Add multiple configurations
router.post('/', (req, res) => {
  const configurations = req.body;

  const values = configurations.map(c => [
    c.productCode,
    c.productName,
    c.pumpCode,
  ]);

  const query = `
    INSERT INTO PumpConfiguration
    (productCode, productName, pumpCode)
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ message: 'Insert failed', error: err });
    }
    res.status(201).json({ message: 'Configurations saved successfully', result });
  });
});

// GET: Fetch all configurations
router.get('/', (req, res) => {
  db.query('SELECT * FROM PumpConfiguration', (err, results) => {
    if (err) {
      console.error('Fetch error:', err);
      return res.status(500).json({ message: 'Fetch failed', error: err });
    }
    res.status(200).json(results);
  });
});

// PUT: Update pumpCode by id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { pumpCode } = req.body;

  const query = `
    UPDATE PumpConfiguration
    SET pumpCode = ?
    WHERE id = ?
  `;

  db.query(query, [pumpCode, id], (err, result) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ message: 'Update failed', error: err });
    }
    res.status(200).json({ message: 'Pump code updated successfully', result });
  });
});

router.post('/entry', async (req, res) => {
  const entries = req.body.entries;
  
  if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'Entries must be an array' });
  }

  try {
      const results = [];
      await db.promise().beginTransaction();

      try {
          for (const entry of entries) {
              // Validate required fields
              if (!entry.pumpCode || !entry.productCode || !entry.productName) {
                  throw new Error('Product Code, Product Name, and Pump Code are required');
              }

              const tableName = getPumpReadingTableName(entry.date || new Date().toISOString().split('T')[0]);
              await ensurePumpReadingTable(tableName);

              // Set defaults
              const completeEntry = {
                  openingReading: 0,
                  closingReading: 0,
                  saleLitre: 0,
                  shift: '1',
                  date: new Date().toISOString().split('T')[0],
                  readingDate: new Date().toISOString().split('T')[0],
                  status: 'pending',
                  ...entry
              };

              if (entry.id) {
                  // Update existing entry
                  const [updateResult] = await db.promise().query(`
                      UPDATE ${tableName} 
                      SET 
                          closingReading = ?, 
                          saleLitre = ?, 
                          status = ?,
                          openingReading = ?,
                          productCode = ?,
                          productName = ?,
                          readingDate = ?,
                          shift = ?,
                          date = ?
                      WHERE id = ?
                  `, [
                      completeEntry.closingReading,
                      completeEntry.saleLitre,
                      completeEntry.status,
                      completeEntry.openingReading,
                      completeEntry.productCode,
                      completeEntry.productName,
                      completeEntry.readingDate,
                      completeEntry.shift,
                      completeEntry.date,
                      entry.id
                  ]);
                  
                  results.push({ id: entry.id, action: 'updated', affectedRows: updateResult.affectedRows });

                  // Make this part of the main transaction
                if (completeEntry.closingReading !== 0 && completeEntry.status === 'closed') {
                    await updateNextShiftOpening(tableName, completeEntry);
                }
              } else {
                  // Insert new entry
                  const [insertResult] = await db.promise().query(`
                      INSERT INTO ${tableName} 
                      (productCode, productName, pumpCode, openingReading, closingReading, saleLitre, shift, date, readingDate, status)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `, [
                      completeEntry.productCode,
                      completeEntry.productName,
                      completeEntry.pumpCode,
                      completeEntry.openingReading,
                      completeEntry.closingReading,
                      completeEntry.saleLitre,
                      completeEntry.shift,
                      completeEntry.date,
                      completeEntry.readingDate,
                      completeEntry.status
                  ]);

                  results.push({ id: insertResult.insertId, action: 'inserted', affectedRows: insertResult.affectedRows });
              }
          }

          await db.promise().commit();
          res.status(200).json({ 
              message: 'Entries processed successfully',
              details: results
          });
      } catch (err) {
          await db.promise().rollback();
          throw err;
      }
  } catch (err) {
      console.error('Error processing entries:', err);
      res.status(500).json({ 
          message: 'Database error',
          error: err.message
      });
  }
});

// Helper function to update next shift's opening reading
async function updateNextShiftOpening(tableName, currentEntry) {
    try {
        const currentShift = parseInt(currentEntry.shift);
        const nextShift = currentShift === 1 ? 2 : 1;
        
        // Determine the correct date for the next shift
        let nextDate;
        if (currentShift === 1) {
            // Same day for shift 1 to shift 2
            nextDate = currentEntry.date;
        } else {
            // Next day for shift 2 to shift 1
            const dateObj = new Date(currentEntry.date);
            dateObj.setDate(dateObj.getDate() + 1);
            nextDate = dateObj.toISOString().split('T')[0];
        }

        // Fetch the correct next shift record
        const [nextRecords] = await db.promise().query(`
            SELECT id, openingReading 
            FROM ${tableName} 
            WHERE pumpCode = ? 
            AND shift = ? 
            AND date = ?
            AND id > ?
            ORDER BY id ASC
            LIMIT 1
        `, [currentEntry.pumpCode, nextShift, nextDate, currentEntry.id]);

        if (nextRecords.length === 0) {
            console.log(`No next shift record found for pump ${currentEntry.pumpCode}, date ${nextDate}, shift ${nextShift}`);
            return;
        }

        const nextRecord = nextRecords[0];

        // Convert to numbers for precise comparison
        const currentClosingReading = parseFloat(currentEntry.closingReading).toFixed(2);
        const nextOpeningReading = parseFloat(nextRecord.openingReading).toFixed(2);

        // Only update if the readings differ
        if (currentClosingReading !== nextOpeningReading) {
            await db.promise().query(`
                UPDATE ${tableName}
                SET openingReading = ?
                WHERE id = ?
            `, [currentClosingReading, nextRecord.id]);
            
            console.log(`Successfully updated next shift opening reading:
            Pump: ${currentEntry.pumpCode}
            Current Shift: ${currentShift} (${currentEntry.date})
            Next Shift: ${nextShift} (${nextDate})
            Updated Opening: ${currentClosingReading}
            Previous Opening: ${nextOpeningReading}`);
        } else {
            console.log(`Opening reading already synchronized for pump ${currentEntry.pumpCode}, date ${nextDate}, shift ${nextShift}`);
        }
    } catch (err) {
        console.error('Error in updateNextShiftOpening:', err);
        throw err; // Re-throw to trigger transaction rollback
    }
}


router.post('/init-reading', (req, res) => {
  const entries = req.body.entries;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: 'Entries array is required and cannot be empty.' });
  }

  // Extract the date from the first entry to get the correct table name
  const tableName = getPumpReadingTableName(entries[0].date);
  
  // Ensure the dynamic table exists
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productCode VARCHAR(255) NOT NULL,
      productName VARCHAR(255) NOT NULL,
      pumpCode VARCHAR(255) NOT NULL,
      openingReading DECIMAL(10, 2) NOT NULL,
      closingReading DECIMAL(10, 2) NOT NULL,
      saleLitre DECIMAL(10, 2) NOT NULL,
      shift VARCHAR(10) NOT NULL,
      date DATE NOT NULL,
      readingDate DATE,
      status VARCHAR(50) NOT NULL
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.error(`Error creating table ${tableName}:`, err);
      return res.status(500).json({ message: 'Failed to create table', error: err });
    }

    // Insert the entries into the dynamic table
    const values = entries.map(e => [
      e.productCode,
      e.productName,
      e.pumpCode,
      e.openingReading,
      0.0,       // closingReading
      0.0,       // saleLitre
      e.shift || 'A',
      e.date,
      e.readingDate,
      'pending'  // status
    ]);

    const query = `
      INSERT INTO ${tableName}
      (productCode, productName, pumpCode, openingReading, closingReading, saleLitre, shift, date, readingDate, status)
      VALUES ?
    `;

    db.query(query, [values], (err, result) => {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ message: 'Opening reading insert failed', error: err });
      }
      res.status(201).json({ message: 'Opening readings saved successfully', result });
    });
  });
});

router.get('/opening', async (req, res) => {
  const { shift, date } = req.query;
  
  if (!shift || !date) {
    return res.status(400).json({ message: 'Shift and date parameters are required' });
  }

  try {
    const tableName = getPumpReadingTableName(date);
    ensurePumpReadingTable(tableName);

    const [results] = await db.promise().query(
      `SELECT * FROM ${tableName} WHERE shift = ? AND readingDate = ?`,
      [shift, date]
    );

    res.json(results);
  } catch (err) {
    console.error('Error fetching opening readings:', err);
    res.status(500).json({ 
      message: 'Database error', 
      error: err.message 
    });
  }
});


router.get('/closing', async (req, res) => {
  const { shift, date } = req.query;
  
  if (!shift || !date) {
    return res.status(400).json({ message: 'Shift and date parameters are required' });
  }

  try {
    const tableName = getPumpReadingTableName(date);
    ensurePumpReadingTable(tableName);

    const [results] = await db.promise().query(
      `SELECT * FROM ${tableName} WHERE shift = ? AND readingDate = ?`,
      [shift, date]
    );

    res.json(results);
  } catch (err) {
    console.error('Error fetching closing readings:', err);
    res.status(500).json({ 
      message: 'Database error', 
      error: err.message 
    });
  }
});


/// 
router.post('/next-shift-opening', async (req, res) => {
  const { entries, currentShift, date } = req.body;
  
  // Validate input
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ message: 'Entries array is required and cannot be empty' });
  }

  const currentShiftNum = parseInt(currentShift);
  if (![1, 2].includes(currentShiftNum)) {
    return res.status(400).json({ message: 'Invalid current shift. Must be 1 or 2' });
  }

  try {
    // Calculate next shift and dates
    const nextShiftNumber = currentShiftNum === 1 ? 2 : 1;
    const recordDate = date;
    
    // Modified date logic based on your requirements
    const readingDate = currentShiftNum === 1 
      ? new Date(new Date(date).setDate(new Date(date).getDate() + 1))
          .toISOString().split('T')[0] // Next day for shift 1→2
      : date; // Same day for shift 2→1

    const tableName = getPumpReadingTableName(recordDate);
    await ensurePumpReadingTable(tableName);

    await db.promise().beginTransaction();

    try {
      // First close current shift entries
      for (const entry of entries) {
        await db.promise().query(`
          UPDATE ${tableName}
          SET status = 'closed'
          WHERE pumpCode = ? AND shift = ? AND date = ?
        `, [entry.pumpCode, currentShiftNum, recordDate]);
      }

      // Create next shift openings
      for (const entry of entries) {
        // Get the current closing reading to use as next opening
        const [currentReading] = await db.promise().query(`
          SELECT closingReading FROM ${tableName}
          WHERE pumpCode = ? AND shift = ? AND date = ?
        `, [entry.pumpCode, currentShiftNum, recordDate]);

        const openingReading = currentReading[0]?.closingReading || 0;

        await db.promise().query(`
          INSERT INTO ${tableName} 
          (productCode, productName, pumpCode, openingReading, closingReading, saleLitre, shift, date, readingDate, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          openingReading = VALUES(openingReading),
          closingReading = VALUES(closingReading),
          saleLitre = VALUES(saleLitre),
          readingDate = VALUES(readingDate),
          status = VALUES(status)
        `, [
          entry.productCode,
          entry.productName,
          entry.pumpCode,
          openingReading, // Set from previous closing reading
          0,              // Reset closing reading
          0,              // Reset sales
          nextShiftNumber,
          recordDate,
          readingDate,    // Modified date logic applied here
          'pending'
        ]);
      }

      await db.promise().commit();
      
      res.json({ 
        success: true,
        message: 'Shift transition completed successfully',
        data: {
          currentShift: currentShiftNum,
          newShift: nextShiftNumber,
          recordDate,
          readingDate,
          transitionType: currentShiftNum === 1 ? 'Day to Night' : 'Night to Day',
          note: currentShiftNum === 1 
            ? 'Shift 1→2: Reading date advanced to next day' 
            : 'Shift 2→1: Same day reading'
        }
      });
    } catch (err) {
      await db.promise().rollback();
      console.error('Transaction error:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error in shift transition:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete shift transition',
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

module.exports = router;