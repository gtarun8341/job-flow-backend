import express from "express";
import { protect } from "../middleware/auth.js";
import { getJobEmailStats } from "../controllers/emailController.js";

const router = express.Router();
// router.use(protect);

router.get("/stats", protect, getJobEmailStats);

export default router;
