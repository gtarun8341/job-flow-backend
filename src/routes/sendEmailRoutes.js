import express from "express";
import { protect } from "../middleware/auth.js";
import {
  sendJobEmail,
  searchRecruiterEmails,
} from "../controllers/sendEmailController.js";

const router = express.Router();

router.post("/", protect, sendJobEmail);
router.get("/search-recruiters", protect, searchRecruiterEmails);

export default router;
