import express from "express";
import { downloadApp } from "../controllers/publicAppController.js";

const router = express.Router();

/**
 * GET /api/apps/download
 * Query:
 *  - platform=windows|android (required)
 *  - version=1.3.0 (optional → default)
 */
router.get("/download", downloadApp);

export default router;
