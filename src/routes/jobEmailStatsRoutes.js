// routes/jobEmailStatsRoutes.js
import express from "express";
import {
  getEmailStats,
  syncJobEmailStats,
} from "../controllers/jobEmailStatsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET dashboard stats
router.get("/", protect, getEmailStats);
router.post("/sync", protect, syncJobEmailStats);

export default router;
