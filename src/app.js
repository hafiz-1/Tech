const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cors());
app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "TechCart API is running"
    });
});

module.exports = app;
