import EmailTemplate from "../models/EmailTemplate.js";
import { templateSchema } from "../validation/templateValidation.js";

// ---------------- GET ALL ----------------
export const getTemplates = async (req, res) => {
  const templates = await EmailTemplate.find({ userId: req.user._id }).sort({
    updatedAt: -1,
  });

  res.json({ success: true, templates });
};

// ---------------- GET ONE ----------------
export const getTemplateById = async (req, res) => {
  const template = await EmailTemplate.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!template)
    return res.status(404).json({ success: false, message: "Not found" });

  res.json({ success: true, template });
};

// ---------------- CREATE ----------------
export const createTemplate = async (req, res) => {
  const { error, value } = templateSchema.validate(req.body);
  if (error)
    return res.status(400).json({ success: false, message: error.message });

  const template = await EmailTemplate.create({
    ...value,
    userId: req.user._id,
  });

  res.json({ success: true, message: "Template created", template });
};

// ---------------- UPDATE ----------------
export const updateTemplate = async (req, res) => {
  const { error, value } = templateSchema.validate(req.body);
  if (error)
    return res.status(400).json({ success: false, message: error.message });

  const template = await EmailTemplate.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { ...value },
    { new: true }
  );

  if (!template)
    return res.status(404).json({ success: false, message: "Not found" });

  res.json({ success: true, message: "Template updated", template });
};

// ---------------- DELETE ----------------
export const deleteTemplate = async (req, res) => {
  const deleted = await EmailTemplate.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!deleted)
    return res.status(404).json({ success: false, message: "Not found" });

  res.json({ success: true, message: "Template deleted" });
};
