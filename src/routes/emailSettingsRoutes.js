import express from "express";
import {
  getEmailSettings,
  saveEmailSettings,
  testSMTP,
  testIMAP,
} from "../controllers/emailSettingsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getEmailSettings);
router.post("/", protect, saveEmailSettings);
router.post("/test-smtp", protect, testSMTP);
router.post("/test-imap", protect, testIMAP);

export default router;
