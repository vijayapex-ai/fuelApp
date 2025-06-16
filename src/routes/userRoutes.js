const express = require('express');
const router = express.Router();
const db = require('../database/db');


// Ensure users table exists
const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `;

db.query(createUsersTableQuery, (err) => {
  if (err) {
    console.error('Error creating users table:', err);
  } else {
    console.log('Users table ensured');
  }
});


router.get('/', (req, res)=>{
    db.query('SELECT * FROM users', (err, results)=>{
        if (err) {
            console.error('Fetch error:', err);
            return res.status(500).json({ message: 'Fetch failed', error: err });
          }
          res.status(200).json(results);
    })
})

module.exports = router;