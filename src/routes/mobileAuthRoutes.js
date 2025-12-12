import express from "express";
import { login } from "../controllers/mobileController.js";

const router = express.Router();
// router.use(protect);

router.post("/login", login);

export default router;
