require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");



const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in your .env");
}


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  //max: 20
});


// Start (checking purpose)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to your Express server" });
});

// Get all users (GET)
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC;");
    return res.json(result.rows);
  }
  catch (err) {
    console.error("Failed to fetch users:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get user by id (GET)
app.get("/api/users/:id", async (req, res) => {
  try {
    const userID = req.params.id;
    const result = await pool.query("SELECT * FROM users WHERE id = $1;", [userID]);
    
    if (result.rows.length === 0){
      return res.status(404).json({ error: "User not found "});
    }
    
    return res.json(result.rows[0]);
  }
  catch (err) {
    console.error("Failed to fetch user: ", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create new user (POST)
app.post("/api/users", async (req, res) => {
  try {
    const {
      first_name, 
      last_name, 
      email, 
      profile_picture_url} = req.body;

      const insertQuery = `INSERT INTO users (first_name, last_name, email, profile_picture_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`;

      const result = await pool.query(insertQuery, [
        first_name, 
        last_name, 
        email, 
        profile_picture_url,
      ]);
      return res.status(201).json(result.rows[0]);
  }
  catch (err) {
    console.error("Failed to create user: ", err);
    return res.status(500).json({ error: "Failed to create users" });
  }
})

// Update user (PUT)
app.put("/api/users/:id", async (req, res) => {
  try {
    const userID = req.params.id;
    const { 
      first_name, 
      last_name, 
      email, 
      profile_picture_url} = req.body;

      const updateQuery = `UPDATE users SET first_name=$1, last_name=$2, email=$3, profile_picture_url=$4
      WHERE id=$5
      RETURNING *;`;

      const result = await pool.query(updateQuery, [
      first_name, 
      last_name, 
      email, 
      profile_picture_url,
      userID
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(201).json(result.rows[0]);
  }
  catch (err) {
    console.error("Failed to update user: ", err);
    return res.status(500).json({ error: "Failed to update users" });
  }
})

// Delete user (DELETE)
app.delete("/api/users/:id", async (req, res) => {
  
  try {
    const userID = req.params.id;
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *;", [userID]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(201).json({ message: "User deleted successfully" });
  }
  catch (err) {
    console.error("Failed to delete user: ", err);
    return res.status(500).json({ error: "Failed to delete users" });
  }
})

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
