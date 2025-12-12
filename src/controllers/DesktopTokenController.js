import DesktopToken from "../models/DesktopToken.js";
import JobEmail from "../models/JobEmail.js";
import UserDefaults from "../models/UserDefaults.js";
import EmailTemplate from "../models/EmailTemplate.js";
import Resume from "../models/Resume.js";
import { Queue } from "bullmq";

const emailQueue = new Queue("emailQueue", {
  connection: { host: "localhost", port: 6379 },
});

export const createDesktopToken = async (req, res) => {
  try {
    const userId = req.user._id; // from JWT login session

    await DesktopToken.deleteMany({ userId });

    const newToken = await DesktopToken.generate(userId);

    return res.json({
      success: true,
      token: newToken.token,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Token generation failed." });
  }
};

export const getMyDesktopToken = async (req, res) => {
  try {
    const tokenDoc = await DesktopToken.findOne({ userId: req.user._id });

    if (!tokenDoc) {
      return res.json({ success: true, token: null });
    }

    return res.json({
      success: true,
      token: tokenDoc.token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch token",
    });
  }
};

export const captureEmail = async (req, res) => {
  try {
    const { email, token } = req.body;
    console.log(email);
    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: "Email or token missing",
      });
    }

    // Validate token
    const tokenData = await DesktopToken.findOne({ token });
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const userId = tokenData.userId;

    // Fetch defaults
    const defaults = await UserDefaults.findOne({ userId });
    if (!defaults || !defaults.defaultTemplateId) {
      return res.status(400).json({
        success: false,
        message: "No default template set.",
      });
    }

    const templateId = defaults.defaultTemplateId;
    const resumeId = defaults.defaultResumeId || null;

    // Validate template
    const templateExists = await EmailTemplate.findOne({
      _id: templateId,
      userId,
    });
    if (!templateExists) {
      return res.status(400).json({
        success: false,
        message: "Default template is invalid or deleted.",
      });
    }

    // Validate resume (optional)
    if (resumeId) {
      const resumeExists = await Resume.findOne({ _id: resumeId, userId });
      if (!resumeExists) {
        return res.status(400).json({
          success: false,
          message: "Default resume is invalid or deleted.",
        });
      }
    }

    // Create queued job (no SMTP send here!)
    const job = await JobEmail.create({
      userId,
      recruiterEmail: email,
      company: "",
      role: "",
      notes: "",
      templateId,
      resumeId,
      status: "queued",
      source: "desktop-app",
    });

    await emailQueue.add("sendEmail", { emailId: job._id });

    return res.status(200).json({
      success: true,
      message: "Email captured — sending shortly...",
      jobId: job._id,
    });
  } catch (err) {
    console.error("CAPTURE EMAIL ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
