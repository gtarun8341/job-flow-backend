import multer from "multer";
import path from "path";
import fs from "fs";

const baseDir = "uploads/apps";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { platform } = req.body;

    if (!["windows", "android"].includes(platform)) {
      return cb(new Error("Invalid platform"));
    }

    const dir = path.join(baseDir, platform);
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanVersion = req.body.version.replace(/\s+/g, "_");

    cb(null, `jobflow-${cleanVersion}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    (req.body.platform === "windows" && file.originalname.endsWith(".exe")) ||
    (req.body.platform === "android" && file.originalname.endsWith(".apk"))
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for platform"));
  }
};

export const uploadApp = multer({
  storage,
  fileFilter,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB
});
