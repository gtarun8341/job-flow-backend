import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import emailSettingsRoutes from "./routes/emailSettingsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sendEmailRoutes from "./routes/sendEmailRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import jobEmailStatsRoutes from "./routes/jobEmailStatsRoutes.js";
import DesktopTokenRoutes from "./routes/DesktopTokenRoutes.js";
import userDefaultsRoutes from "./routes/userDefaultsRoutes.js";
import mobileAuthRoutes from "./routes/mobileAuthRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://127.0.0.1:5173",
//       "http://localhost:8080",
//       "http://127.0.0.1:8080",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
app.use(
  cors({
    origin: "*", // TEMP for development
    credentials: true,
  })
);

app.use(express.json());
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads")
  )
);

app.get("/", (req, res) => {
  res.json({ message: "Recruiter Outreach Tracker API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/email-settings", emailSettingsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/send-email", sendEmailRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/job-stats", jobEmailStatsRoutes);
app.use("/api/desktop-token", DesktopTokenRoutes);
app.use("/api/defaults", userDefaultsRoutes);
app.use("/api/mobile", mobileAuthRoutes);

app.use(errorHandler);

export default app;
