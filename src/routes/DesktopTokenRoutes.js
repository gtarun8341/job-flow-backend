import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createDesktopToken,
  captureEmail,
  getMyDesktopToken,
  desktopLogin,
} from "../controllers/DesktopTokenController.js";

const router = express.Router();
// router.use(protect);

router.post("/create", protect, createDesktopToken);
router.get("/me", protect, getMyDesktopToken);
router.post("/capture-email", captureEmail);
router.post("/login", desktopLogin);

export default router;
