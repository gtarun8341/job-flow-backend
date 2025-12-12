import EmailSettings from "../models/EmailSettings.js";
import EmailTemplate from "../models/EmailTemplate.js";
import JobEmail from "../models/JobEmail.js";
import Resume from "../models/Resume.js";
import nodemailer from "nodemailer";
import { sendEmailSchema } from "../validation/emailValidation.js";
import { decrypt } from "../utils/aesEncryption.js";
import { validateEmailDomain } from "../utils/dnsValidation.js";

// GET /search-recruiters?query=abc
export const searchRecruiterEmails = async (req, res) => {
  try {
    const userId = req.user._id;
    const query = req.query.query?.trim().toLowerCase();

    if (!query || query.length < 2) {
      return res.json({ success: true, results: [] });
    }

    // find recruiters matching the query
    const logs = await JobEmail.aggregate([
      { $match: { userId, recruiterEmail: { $regex: query, $options: "i" } } },

      {
        $group: {
          _id: "$recruiterEmail",
          count: { $sum: 1 },
          lastEmail: { $last: "$$ROOT" },
        },
      },

      { $limit: 10 },
    ]);

    const results = logs.map((r) => ({
      recruiterEmail: r._id,
      count: r.count,
      lastCompany: r.lastEmail.company || "",
      lastRole: r.lastEmail.role || "",
      lastSentAt: r.lastEmail.createdAt,
    }));

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendJobEmail = async (req, res) => {
  try {
    const { error, value } = sendEmailSchema.validate(req.body);
    if (error)
      return res.status(400).json({ success: false, message: error.message });

    const { recruiterEmail, company, role, notes, templateId, resumeId } =
      value;
    const userId = req.user._id;

    // Get SMTP Settings
    const settings = await EmailSettings.findOne({ userId });
    if (!settings)
      return res
        .status(400)
        .json({ success: false, message: "SMTP not configured" });

    // Get Template
    const template = await EmailTemplate.findOne({ _id: templateId, userId });
    if (!template)
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });

    // Build email content
    const subject = template.subject
      .replace(/\{\{name\}\}/g, req.user.name)
      .replace(/\{\{company\}\}/g, company || "")
      .replace(/\{\{role\}\}/g, role || "");

    const body = template.body
      .replace(/\{\{name\}\}/g, req.user.name)
      .replace(/\{\{company\}\}/g, company || "")
      .replace(/\{\{role\}\}/g, role || "");

    // SMTP Transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUsername,
        pass: decrypt(settings.smtpPassword),
      },
    });

    const mailOptions = {
      from: settings.smtpUsername,
      to: recruiterEmail,
      subject,
      text: body,
      attachments: [],
    };

    // Optional Resume
    if (resumeId) {
      const storedResume = await Resume.findOne({ _id: resumeId, userId });

      if (storedResume) {
        mailOptions.attachments.push({
          filename: storedResume.fileName,
          path: storedResume.filePath,
        });
      }
    }

    let status = "sent";
    let smtpResponse = null;

    try {
      // Check domain validity first
      if (!(await validateEmailDomain(recruiterEmail))) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or domain. Cannot send email.",
        });
      }

      const info = await transporter.sendMail(mailOptions);
      smtpResponse = info;

      // console.log("SMTP RESPONSE:", info);

      if (info.rejected && info.rejected.length > 0) {
        status = "failed";
      }
    } catch (error) {
      console.error("SMTP ERROR:", error);
      status = "failed";
    }

    // Log
    const log = await JobEmail.create({
      userId,
      recruiterEmail,
      company,
      role,
      notes,
      templateId,
      resumeId,
      status,
    });

    return res.json({
      success: status === "sent",
      message:
        status === "sent" ? "Email sent successfully" : "Email delivery failed",
      status,
      log,
      smtpInfo: smtpResponse,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
