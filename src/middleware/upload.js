import multer from "multer";
import path from "path";
import fs from "fs";

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = `uploads/resumes/${req.user._id}`;

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },

  filename: (req, file, cb) => {
    let customName = req.body.fileName || "";
    customName = customName.replace(/\s+/g, "_");

    // Always take extension from uploaded file
    const originalExt = path.extname(file.originalname) || ".pdf";
    const base = customName
      ? customName
      : path.basename(file.originalname, originalExt);

    const userDir = `uploads/resumes/${req.user._id}`;

    let finalName = `${base}${originalExt}`;
    let counter = 1;

    // Auto-increment if exists
    while (fs.existsSync(path.join(userDir, finalName))) {
      finalName = `${base}(${counter})${originalExt}`;
      counter++;
    }

    cb(null, finalName);
  },
});

// IMPORTANT: use .fields for filename + file together
export const uploadResume = multer({
  storage,
  fileFilter(req, file, cb) {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF/DOC/DOCX allowed"));
    }

    cb(null, true);
  },
}).fields([{ name: "resume", maxCount: 1 }]);
