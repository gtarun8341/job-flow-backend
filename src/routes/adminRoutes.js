import express from "express";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import {
  getAllUsersForAdmin,
  makeUserAdmin,
  deleteUser,
} from "../controllers/adminController.js";
const router = express.Router();

router.get("/", protect, adminOnly, getAllUsersForAdmin);
router.patch("/:id/make-admin", protect, adminOnly, makeUserAdmin);
router.delete("/:id", protect, adminOnly, deleteUser);
export default router;
