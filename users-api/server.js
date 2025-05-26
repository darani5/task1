// server.js
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQLite DB setup
const dbFile = path.join(__dirname, "users.db");
const db = new sqlite3.Database(dbFile);

// Create users table if it doesn't exist (manual id)
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    )`
  );
});

// GET /api/users
app.get("/api/users", (req, res) => {
  const { page = 1, limit = 10, search = "", sort = "id", order = "asc" } = req.query;

  const offset = (page - 1) * limit;
  const searchPattern = `%${search}%`;

  const countQuery = `SELECT COUNT(*) AS total FROM users WHERE name LIKE ? OR email LIKE ?`;
  const dataQuery = `
    SELECT * FROM users
    WHERE name LIKE ? OR email LIKE ?
    ORDER BY ${sort} ${order.toUpperCase()}
    LIMIT ? OFFSET ?
  `;

  db.get(countQuery, [searchPattern, searchPattern], (err, countRow) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(dataQuery, [searchPattern, searchPattern, limit, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        data: rows,
        meta: {
          total: countRow.total,
          page: Number(page),
          limit: Number(limit),
        },
      });
    });
  });
});

// POST /api/users (add new user with manual id)
app.post("/api/users", (req, res) => {
  const { id, name, email } = req.body;
  if (id == null || !name || !email) {
    return res.status(400).json({ error: "ID, name, and email required" });
  }

  const insertQuery = `INSERT INTO users (id, name, email) VALUES (?, ?, ?)`;
  db.run(insertQuery, [id, name, email], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id, name, email });
  });
});

// PATCH /api/users/:id (edit user)
app.patch("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email required" });
  }

  const updateQuery = `UPDATE users SET name = ?, email = ? WHERE id = ?`;

  db.run(updateQuery, [name, email, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: Number(id), name, email });
  });
});

// DELETE /api/users/:id
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;

  const deleteQuery = `DELETE FROM users WHERE id = ?`;

  db.run(deleteQuery, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
