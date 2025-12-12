import Joi from "joi";

export const templateSchema = Joi.object({
  title: Joi.string().min(2).required(),
  subject: Joi.string().min(2).required(),
  body: Joi.string().min(5).required(),
});
