import express from "express";
import { protect } from "../middleware/auth.js";
import { uploadResume } from "../middleware/upload.js";
import {
  uploadResumeFile,
  getResumes,
  deleteResume,
} from "../controllers/resumeController.js";

const router = express.Router();

router.get("/", protect, getResumes);
router.post("/", protect, uploadResume, uploadResumeFile);
router.delete("/:id", protect, deleteResume);

export default router;
