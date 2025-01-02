require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = require("./configs/supabase");
const express = require("express");
//const { Pool } = require("pg");
const cors = require("cors");


const app = express();
app.use(cors({
  origin: "http://localhost:3005",
  credentials: true,
}));
app.use(express.json());

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY required in your .env");
}

/*Authentication functions*/

// Register
app.post("/api/register", async (req, res) => {
  const {email, password} = req.body;
  try{
    const {data, error} = await supabase.auth.signUp({
      email, 
      password,
    });
    if (error) throw error;
    res.json({ messsage: "Registrationsuccessful!", user: data.user});

  }
  catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Login
app.post("/api/login", async (req, res) => {
  const {email, password} = req.body;
  try {
    const {data, error} = await supabase.auth.signInWithPassword({
      email, 
      password,
    });
    if (error) throw error;
    res.json({ token: data.session.access_token});
  }
  catch (error) {
    res.status(400).json({ error: error.message});
  }
});

const checkAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const {
      data: { user}, 
      error,
    } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = user;
    next();
  }
  catch (error) {
    res.status(401).json({ error: "Invalid token "});
  }
};

//check authenticated
app.get("/api/protected", checkAuth, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user.email,
    timestamp: new Date().toISOString(), 
  });
});

// Start (checking purpose)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to your Express server", environment: NODE_ENV, });
  
});

// Get all users (GET)
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }
  catch (err) {
    console.error("Failed to fetch users:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get joined users (users + userprofiles)
app.get("/api/users/profiles", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        "graduationYear",
        user_profiles (
          bio
        )
      `);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }
  catch (err) {
    console.error("Failed to fetch users + profiles:", err);
    return res.status(500).json({ error: "Failed to fetch users + profiles" });
  }
});
// Get user by id (GET)
app.get("/api/users/:id", async (req, res) => {
  try {
    const userID = req.params.id;
    console.log("Fetching profile for user:", userID);

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        "graduationYear",
        user_profiles (
          bio
        )
      `)
      .eq("id", userID)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
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
      graduationYear,
      profilepicture} = req.body;

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          first_name: first_name,
          last_name: last_name,
          email: email,
          graduationYear: graduationYear || null,
          profilepicture: profilepicture || null,
        }
      ])
      .single();

      if (error) {
        console.error("Supabase error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({message: "Added user successfully"});
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
    //const userID = req.user.id;
    const {
      first_name, 
      last_name, 
      email, 
      graduationYear,
      profilepicture} = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        email,
        graduationYear,
        profilepicture, 
    })
    .eq("id", userID)
    .select("*")   
    .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({error: error.message});
    }
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(data);
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
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", userID)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({error: error.message});
    }
    return res.json({ message: "User deleted successfully" });
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
