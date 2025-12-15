import express from "express";
import {
  uploadAppVersion,
  getAppVersions,
  setDefaultVersion,
} from "../controllers/adminAppController.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { uploadApp } from "../middleware/uploadApp.js";

const router = express.Router();

router.get("/", getAppVersions);

router.post(
  "/upload",
  protect,
  adminOnly,
  uploadApp.single("file"),
  uploadAppVersion
);

router.patch("/:id/set-default", protect, adminOnly, setDefaultVersion);

export default router;
