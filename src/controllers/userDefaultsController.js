import UserDefaults from "../models/UserDefaults.js";

export const getUserDefaults = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = "all" } = req.query; // default: return everything

    const defaults = await UserDefaults.findOne({ userId }).lean();

    // If no defaults saved yet
    if (!defaults) {
      return res.json({
        success: true,
        defaults: {
          defaultResumeId: null,
          defaultTemplateId: null,
        },
      });
    }

    // Return only what user requested
    if (type === "resume") {
      return res.json({
        success: true,
        defaultResumeId: defaults.defaultResumeId || null,
      });
    }

    if (type === "template") {
      return res.json({
        success: true,
        defaultTemplateId: defaults.defaultTemplateId || null,
      });
    }

    // Default → return ALL
    return res.json({
      success: true,
      defaults: {
        defaultResumeId: defaults.defaultResumeId || null,
        defaultTemplateId: defaults.defaultTemplateId || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defaults",
    });
  }
};

export const setDefaultResume = async (req, res) => {
  const userId = req.user._id;
  const { resumeId } = req.params;

  const updated = await UserDefaults.findOneAndUpdate(
    { userId },
    { $set: { defaultResumeId: resumeId } },
    { new: true, upsert: true }
  );

  return res.json({
    success: true,
    message: "Default resume updated",
    defaults: updated,
  });
};

export const setDefaultTemplate = async (req, res) => {
  const userId = req.user._id;
  const { templateId } = req.params;

  const updated = await UserDefaults.findOneAndUpdate(
    { userId },
    { $set: { defaultTemplateId: templateId } },
    { new: true, upsert: true }
  );

  return res.json({
    success: true,
    message: "Default template updated",
    defaults: updated,
  });
};
