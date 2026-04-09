const express = require("express");
const cors = require("cors");
const app = express();
const cookies = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");


app.use(cors({
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']  // Add 'Authorization' to allowed headers
}));

app.use(express.json());
app.use(cookies());

app.use("/api/v1", authRoutes);


module.exports = app;