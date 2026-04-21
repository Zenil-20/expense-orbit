require("dotenv").config({ quiet: true });
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db");
const routes = require("./routes/expenseRoutes");
const startCron = require("./cron/cronJob");

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());
app.get("/api/health", (req, res) => res.json({ ok: true, service: "expense-orbit-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/expenses", routes);

const startServer = async () => {
    try {
        await connectDB();
        startCron();

        app.listen(process.env.PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${process.env.PORT} (bound to 0.0.0.0)`);
        });
    } catch (error) {
        process.exit(1);
    }
};

startServer();

