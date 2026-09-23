require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const mpesaRoutes = require("./routes/mpesa");
const whatsappRoutes = require("./routes/whatsapp");
const premiumRoutes = require("./routes/premium");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));

app.use(
  "/api",
  rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false })
);

app.get("/api/health", (req, res) => res.json({ ok: true, name: "UP TOWN API" }));

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/premium", premiumRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`UP TOWN API running on port ${port}`));
