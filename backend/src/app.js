const helmet = require("helmet");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const requestLogger = require("./middleware/requestLogger");
const catalogRoutes = require("./routes/catalog.routes");
const stockRoutes = require("./routes/stock.routes");
const purchasingRoutes = require("./routes/purchasing.routes");
const orderRoutes = require("./routes/order.routes");
const shippingRoutes = require("./routes/shipping.routes");

const app = express();
app.use(requestLogger);

// const allowedOrigins = (process.env.APP_ORIGIN || "http://localhost:8080,http://127.0.0.1:8080")
//     .split(",")
//     .map((origin) => origin.trim())
//     .filter(Boolean);

//     app.use(cors({
//         origin: allowedOrigins,
//         credentials: true
//     }));
app.use(cors());    
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "TechCart API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api", catalogRoutes);
app.use("/api", orderRoutes);
app.use("/api", shippingRoutes);
app.use("/api/admin/stock", stockRoutes);
app.use("/api/admin", purchasingRoutes);

// Unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});


 // Central error handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    if (err.statusCode && err.statusCode < 500) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});


module.exports = app;
