import AppVersion from "../models/AppVersion.js";

export const uploadAppVersion = async (req, res) => {
  try {
    const { platform, version, fileSize, patchNotes, changelog } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    // 🚨 Reject duplicate version per platform
    const existing = await AppVersion.findOne({ platform, version });
    if (existing) {
      return res.status(409).json({
        message: `Version ${version} already exists for ${platform}`,
      });
    }

    const fileUrl = `/uploads/apps/${platform}/${req.file.filename}`;

    const app = await AppVersion.create({
      userId: req.user._id, // 👈 admin who uploaded
      platform,
      version,
      fileSize,
      patchNotes,
      changelog: changelog ? changelog.split("\n") : [],
      fileUrl,
    });

    res.json({
      success: true,
      message: "App uploaded successfully",
      app,
    });
  } catch (err) {
    console.error("UPLOAD APP ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAppVersions = async (req, res) => {
  const { platform } = req.query;

  const filter = platform ? { platform } : {};

  const versions = await AppVersion.find(filter)
    // .populate("userId", "name email")
    .sort({ isDefault: -1, createdAt: -1 });

  res.json({ success: true, versions });
};

export const setDefaultVersion = async (req, res) => {
  const app = await AppVersion.findById(req.params.id);
  if (!app) return res.status(404).json({ message: "Not found" });

  await AppVersion.updateMany({ platform: app.platform }, { isDefault: false });

  app.isDefault = true;
  await app.save();

  res.json({ success: true, message: "Default version updated" });
};
