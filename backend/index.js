import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import dashboardRoutes from "./Routes/dashboard.js";
import deployRoutes from "./Routes/deploy.js"; // 👈 Include this

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json()); // 👈 Required to parse JSON request bodies

// --- GitHub Auth Routes ---
app.get("/auth/github", (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo%20read:user`;
  res.redirect(redirectUrl);
});

app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );
    const accessToken = tokenRes.data.access_token;
    res.redirect(`http://localhost:5173?token=${accessToken}`);
  } catch (err) {
    console.error("Token exchange failed:", err.response?.data || err.message);
    res.status(500).send("Authentication failed");
  }
});

app.get("/auth/validate-token", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json({ valid: true, user: userRes.data });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// --- Mount Feature Routes ---
app.use("/dashboard", dashboardRoutes); // 👈 e.g., GET /dashboard/deployments
app.use("/deploy", deployRoutes);       // 👈 e.g., POST /deploy

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Auth & Deployment server running at http://localhost:${PORT}`);
}); 
