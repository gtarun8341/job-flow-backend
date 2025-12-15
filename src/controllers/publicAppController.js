import AppVersion from "../models/AppVersion.js";
import path from "path";
import fs from "fs";

export const downloadApp = async (req, res) => {
  try {
    const { platform, version } = req.query;

    // ✅ Validate platform
    if (!platform || !["windows", "android"].includes(platform)) {
      return res.status(400).json({
        message: "Valid platform (windows | android) is required",
      });
    }

    // 🔍 Find app version
    const app = await AppVersion.findOne(
      version
        ? { platform, version } // specific version
        : { platform, isDefault: true } // default version
    );

    if (!app) {
      return res.status(404).json({
        message: version
          ? `Version ${version} not found for ${platform}`
          : `Default version not found for ${platform}`,
      });
    }

    // 📂 Resolve file path
    const filePath = path.join(process.cwd(), app.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found on server",
      });
    }

    // ⬇️ Download
    res.download(filePath);
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).json({ message: "Download failed" });
  }
};
