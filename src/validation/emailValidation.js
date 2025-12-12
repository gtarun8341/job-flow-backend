import Joi from "joi";

export const sendEmailSchema = Joi.object({
  recruiterEmail: Joi.string().email().required(),
  company: Joi.string().optional().allow(null, ""),
  role: Joi.string().optional().allow(null, ""),
  notes: Joi.string().allow(""),
  templateId: Joi.string().required(),
  resumeId: Joi.string().optional().allow(null, ""), // NEW
});
