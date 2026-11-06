const { z } = require('zod');

const fullName = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[\p{L}\p{M}][\p{L}\p{M} '.-]*$/u, 'invalid name');

const email = z.string().trim().toLowerCase().max(255).email();

const passport = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,12}$/, 'invalid passport');

const occupation = z.string().trim().min(2).max(100);
const fileNumber = z.string().trim().toUpperCase().max(50);
const destinationCountry = z.string().trim().min(2).max(100);


const createSchema = z
  .object({
    full_name: fullName,
    email,
    passport_number: passport,
    occupation,
    file_number: fileNumber,
    destination_country: destinationCountry,

    // Optional demo payment fields
    demo_card_number: z.string()
  .trim()
  .max(32)
  .regex(
    /^(?:|TEST-[A-Z0-9]{4,24}|[0-9]{8,20})$/i,
    'Invalid demo card reference'
  )
  .optional()
  .default(''),

    demo_expiry_date: z.string().trim().max(10).regex(
      /^[0-9/]*$/,
      'invalid expiry format'
    ).optional().default(''),

    demo_cvc_entered: z.boolean().optional().default(false),
  })
  .strict();

const updateSchema = createSchema
  .partial()
  .strict()
  .refine((o) => Object.keys(o).length > 0, 'empty update');

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
});

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(255),
    password: z.string().min(1).max(200),
  })
  .strict();

module.exports = { createSchema, updateSchema, idSchema, listSchema, loginSchema };
