import EmailSettings from "../models/EmailSettings.js";
import nodemailer from "nodemailer";
import Imap from "imap";
import Joi from "joi";
import { encrypt } from "../utils/aesEncryption.js";

const settingsSchema = Joi.object({
  email: Joi.string().email().required(),

  smtpHost: Joi.string().required(),
  smtpPort: Joi.number().required(),
  smtpUsername: Joi.string().required(),
  smtpPassword: Joi.string().required(),

  imapHost: Joi.string().required(),
  imapPort: Joi.number().required(),
  imapUsername: Joi.string().required(),
  imapPassword: Joi.string().required(),

  autoSyncEnabled: Joi.boolean().default(false),
  autoSyncInterval: Joi.number().min(5).max(60).default(15),
});

// --------------------- GET SETTINGS ---------------------
export const getEmailSettings = async (req, res) => {
  const settings = await EmailSettings.findOne({ userId: req.user._id });

  if (!settings) {
    return res.json({ exists: false, settings: null });
  }

  res.json({ exists: true, settings });
};

// --------------------- SAVE SETTINGS ---------------------
export const saveEmailSettings = async (req, res) => {
  const { error, value } = settingsSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  let smtpOk = false;
  let imapOk = false;

  try {
    const transporter = nodemailer.createTransport({
      host: value.smtpHost,
      port: Number(value.smtpPort),
      secure: Number(value.smtpPort) === 465,
      auth: {
        user: value.smtpUsername,
        pass: value.smtpPassword,
      },
    });

    await transporter.verify();
    smtpOk = true;
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "SMTP failed: " + err.message,
    });
  }

  try {
    await new Promise((resolve, reject) => {
      const imap = new Imap({
        user: value.imapUsername,
        password: value.imapPassword,
        host: value.imapHost,
        port: Number(value.imapPort),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once("ready", () => {
        imap.end();
        resolve(true);
      });

      imap.once("error", (err) => reject(err));
      imap.connect();
    });

    imapOk = true;
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "IMAP failed: " + err.message,
    });
  }

  const settings = await EmailSettings.findOneAndUpdate(
    { userId: req.user._id },
    {
      ...value,
      smtpPassword: encrypt(value.smtpPassword),
      imapPassword: encrypt(value.imapPassword),
      userId: req.user._id,
      isConnected: smtpOk && imapOk,
      lastSyncedAt: smtpOk && imapOk ? new Date() : null,
    },
    { new: true, upsert: true }
  );

  res.json({
    success: true,
    message: "Settings saved and tested successfully!",
    settings,
  });
};

// --------------------- TEST SMTP ---------------------
export const testSMTP = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUsername, smtpPassword } = req.body;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });

    await transporter.verify();

    res.json({ success: true, message: "SMTP connected successfully" });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "SMTP connection failed: " + err.message,
    });
  }
};

// --------------------- TEST IMAP ---------------------
export const testIMAP = async (req, res) => {
  const { imapHost, imapPort, imapUsername, imapPassword } = req.body;

  const imap = new Imap({
    user: imapUsername,
    password: imapPassword,
    host: imapHost,
    port: Number(imapPort),
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false, // <<< FIX: Accept Gmail’s certificate
    },
  });

  imap.once("ready", () => {
    imap.end();
    res.json({ success: true, message: "IMAP connected successfully" });
  });

  imap.once("error", (err) => {
    res.status(400).json({
      success: false,
      message: "IMAP connection failed: " + err.message,
    });
  });

  imap.connect();
};
