// db.js
const sqlite3 = require("sqlite3").verbose();
// Use a file-based DB so you keep data between restarts; change to ":memory:" if you really want it ephemeral
const db = new sqlite3.Database("users.db");

db.serialize(() => {
  // Create the table if it doesn't already exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY ,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )
  `);
});

module.exports = db;
