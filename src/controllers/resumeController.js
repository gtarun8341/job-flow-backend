import Resume from "../models/Resume.js";
import Joi from "joi";
import fs from "fs";

const resumeSchema = Joi.object({
  description: Joi.string().required(),
  fileName: Joi.string().optional().allow(""),
});

// UPLOAD
export const uploadResumeFile = async (req, res) => {
  try {
    const { error, value } = resumeSchema.validate(req.body);
    if (error)
      return res.status(400).json({ success: false, message: error.message });

    if (!req.files || !req.files.resume)
      return res
        .status(400)
        .json({ success: false, message: "Resume file missing" });

    const file = req.files.resume[0];

    const resume = await Resume.create({
      userId: req.user._id,
      description: value.description,
      fileName: file.filename,
      filePath: file.path,
    });

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      resume,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET
export const getResumes = async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, resumes });
};

// DELETE
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume)
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });

    // DELETE FILE FROM SERVER
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
