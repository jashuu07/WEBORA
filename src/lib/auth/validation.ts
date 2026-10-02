import { z } from 'zod';

/** Shared request validation — every API route parses its body with these. */

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name.').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
  company: z.string().trim().max(120).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});

export const resetConfirmSchema = z.object({
  token: z.string().min(10, 'This reset link is not valid.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  company: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
});

const hoursSchema = z.object({ day: z.string(), hours: z.string() });

export const businessProfileSchema = z.object({
  name: z.string().trim().min(1, 'Your business name is required.').max(90),
  type: z.string().trim().max(60).default(''),
  industry: z.string().trim().default('general'),
  description: z.string().trim().min(15, 'Tell us a little more — at least 15 characters.').max(1200),
  city: z.string().trim().max(60).default(''),
  country: z.string().trim().max(60).default('India'),
  services: z.array(z.string().trim().max(80)).max(12).default([]),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().max(120).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  hours: z.array(hoursSchema).max(14).optional(),
  social: z
    .object({
      whatsapp: z.string().trim().optional().or(z.literal('')),
      instagram: z.string().trim().optional().or(z.literal('')),
      facebook: z.string().trim().optional().or(z.literal('')),
      twitter: z.string().trim().optional().or(z.literal('')),
      youtube: z.string().trim().optional().or(z.literal('')),
      linkedin: z.string().trim().optional().or(z.literal('')),
    })
    .optional(),
  logoUrl: z.string().trim().optional().or(z.literal('')),
  currency: z.string().trim().max(6).default('INR'),
  tone: z.enum(['warm', 'bold', 'elegant', 'friendly', 'professional']).default('professional'),
  tags: z.array(z.string()).default([]),
});

export const generateSchema = z.object({
  business: businessProfileSchema,
  styleId: z.string().trim().min(1),
  templateId: z.string().trim().optional(),
  siteId: z.string().trim().optional(),
  businessTypeHint: z.string().trim().optional(),
});

export const websitePatchSchema = z.object({
  name: z.string().trim().min(1).max(90).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.')
    .min(3)
    .max(48)
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
  styleId: z.string().optional(),
  tokens: z.record(z.any()).optional(),
  pages: z.array(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  seo: z.record(z.any()).optional(),
  business: businessProfileSchema.partial().optional(),
  thumbnail: z.string().optional(),
});

export const sectionPatchSchema = z.object({
  pageId: z.string().min(1),
  sectionId: z.string().min(1),
  props: z.record(z.any()).optional(),
  visible: z.boolean().optional(),
  spacing: z.record(z.any()).optional(),
  label: z.string().optional(),
});

export const addSectionSchema = z.object({
  pageId: z.string().min(1),
  type: z.string().min(1),
  index: z.number().int().min(0).optional(),
  props: z.record(z.any()).optional(),
});

export const reorderSchema = z.object({
  pageId: z.string().min(1),
  order: z.array(z.string()).min(1),
});

export const domainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, 'Enter a domain like myshop.com'),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please add your name.').max(80),
  email: z.string().trim().email('Please add a valid email.').max(120).or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Please write a short message.').max(2000),
});

export const pageSchema = z.object({
  title: z.string().trim().min(1).max(60),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.')
    .min(1)
    .max(48),
  inNav: z.boolean().default(true),
  /** Which starter sections to include. */
  preset: z.enum(['blank', 'about', 'services', 'gallery', 'contact']).default('blank'),
});
