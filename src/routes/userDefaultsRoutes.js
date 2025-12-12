import express from "express";
import { protect } from "../middleware/auth.js";
import {
  setDefaultResume,
  setDefaultTemplate,
  getUserDefaults,
} from "../controllers/userDefaultsController.js";

const router = express.Router();

router.get("/", protect, getUserDefaults);
router.put("/resume/:resumeId", protect, setDefaultResume);
router.put("/template/:templateId", protect, setDefaultTemplate);

export default router;
