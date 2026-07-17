import Joi from 'joi';

export const createCitySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'City name is required',
  }),
  state: Joi.string().trim().required().messages({
    'string.empty': 'State name is required',
  }),
  isActive: Joi.boolean().default(true),
});
