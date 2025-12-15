import { Worker } from "bullmq";
import JobEmail from "../models/JobEmail.js";
import EmailTemplate from "../models/EmailTemplate.js";
import Resume from "../models/Resume.js";
import EmailSettings from "../models/EmailSettings.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import { decrypt } from "../utils/aesEncryption.js";
import { validateEmailDomain } from "../utils/dnsValidation.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { redisConnection } from "../config/redis.js";

dotenv.config(); // so .env loads

// ----------------------------------------
// CONNECT TO MONGODB FOR WORKER PROCESS
// ----------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("📦 Worker connected to MongoDB"))
  .catch((err) => console.error("❌ Worker DB connection failed:", err));

// const connection = { host: "localhost", port: 6379 };

export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    try {
      const emailId = job.data.emailId;

      console.log(emailId, "id");
      const emailLog = await JobEmail.findById(emailId);
      if (!emailLog) return;

      // Step 1 — mark as sending
      emailLog.status = "sending";
      await emailLog.save();

      const { userId, recruiterEmail, templateId, resumeId, company, role } =
        emailLog;

      const settings = await EmailSettings.findOne({ userId });
      if (!settings) {
        emailLog.status = "failed";
        await emailLog.save();
        return;
      }

      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        emailLog.status = "failed";
        await emailLog.save();
        return;
      }

      const user = await User.findById(userId);

      // Fill template variables
      const subject = template.subject
        .replace(/\{\{name\}\}/g, user?.name || "")
        .replace(/\{\{company\}\}/g, company || "")
        .replace(/\{\{role\}\}/g, role || "");

      const body = template.body
        .replace(/\{\{name\}\}/g, user?.name || "")
        .replace(/\{\{company\}\}/g, company || "")
        .replace(/\{\{role\}\}/g, role || "");

      const resume = resumeId ? await Resume.findById(resumeId) : null;

      // Validate domain
      const isValidDomain = await validateEmailDomain(recruiterEmail);
      if (!isValidDomain) {
        emailLog.status = "failed";
        await emailLog.save();
        return;
      }

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
        attachments: resume
          ? [{ filename: resume.fileName, path: resume.filePath }]
          : [],
      };

      // Step 2 — attempt sending
      try {
        const info = await transporter.sendMail(mailOptions);

        if (info.rejected?.length > 0) {
          emailLog.status = "failed";
        } else {
          emailLog.status = "sent";
        }
      } catch (err) {
        console.error("SMTP SEND ERROR:", err);
        emailLog.status = "failed";
      }

      // Step 3 — save final status
      await emailLog.save();
    } catch (err) {
      console.error("WORKER FATAL ERROR:", err);
    }
  },
  { connection: redisConnection }
);
