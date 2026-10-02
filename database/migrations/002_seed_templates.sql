-- ============================================================================
-- WEBORA — template catalogue seed
-- Mirrors src/lib/templates/catalog.ts so SQL consumers (analytics,
-- recommendations in a BI tool) can join against the same identifiers.
-- Safe to re-run: rows are upserted by id.
-- ============================================================================

insert into public.templates (id, name, industry, style_id, tagline, description, image, blueprint, popularity)
values
  ('tpl-bakery','Golden Crumb','bakery','warm-artisan','Warm artisan bakery & café',
   'A bakery site built around appetite: full-bleed hero, menu with prices, gallery of the bake and a strong order CTA.',
   '/img/bakery-hero.jpg',
   '["nav","hero","stats","services","menu","gallery","testimonials","hours","cta","contact","footer"]'::jsonb, 96),

  ('tpl-restaurant','Copper Table','restaurant','noir-luxe','Upscale dining & reservations',
   'Dark, appetising and reservation-led. Menu categories, private dining, reviews and a booking-first hero.',
   '/img/restaurant-hero.jpg',
   '["nav","hero","about","menu","gallery","testimonials","hours","cta","contact","footer"]'::jsonb, 94),

  ('tpl-salon','Studio Noir','salon','noir-luxe','Salon, spa & bridal studio',
   'Service-and-price led with a booking CTA in every band, plus a bridal package section that converts.',
   '/img/salon-hero.jpg',
   '["nav","hero","services","pricing","gallery","testimonials","team","hours","contact","footer"]'::jsonb, 91),

  ('tpl-gym','Iron District','gym','bold-energy','Gym, PT & group classes',
   'High-contrast and performance-driven. Programme cards, transformation proof and a free-trial CTA.',
   '/img/gym-hero.jpg',
   '["nav","hero","stats","services","pricing","gallery","testimonials","faq","cta","contact","footer"]'::jsonb, 89),

  ('tpl-consultant','Northwind','consultant','midnight','Consultant & professional services',
   'Credibility-first: scoped engagements, proof numbers, FAQs and a booking call CTA.',
   '/img/consultant-hero.jpg',
   '["nav","hero","stats","services","about","testimonials","faq","cta","contact","footer"]'::jsonb, 87),

  ('tpl-portfolio','Atelier','portfolio','editorial','Designer & creative portfolio',
   'Editorial grid with generous whitespace. Work comes first, biography second, enquiry last.',
   '/img/portfolio-hero.jpg',
   '["nav","hero","gallery","services","about","testimonials","cta","contact","footer"]'::jsonb, 85),

  ('tpl-realestate','Skyline','realestate','midnight','Property advisory & listings',
   'Trust-led layout for high-value decisions: services, verified paperwork, reviews and site-visit booking.',
   '/img/realestate-hero.jpg',
   '["nav","hero","services","stats","gallery","testimonials","about","cta","contact","footer"]'::jsonb, 84),

  ('tpl-photography','Lightbox','photography','editorial','Photography & film',
   'Image-forward with a mosaic gallery and packages, tuned for bookings and date enquiries.',
   '/img/photography-hero.jpg',
   '["nav","hero","gallery","services","pricing","testimonials","faq","contact","footer"]'::jsonb, 88),

  ('tpl-retail','Corner Store','retail','warm-artisan','Local shop & online catalogue',
   'Friendly and fast: what you stock, delivery promise, store hours and a WhatsApp order button.',
   '/img/retail-hero.jpg',
   '["nav","hero","services","gallery","testimonials","hours","contact","footer"]'::jsonb, 82)
on conflict (id) do update set
  name        = excluded.name,
  industry    = excluded.industry,
  style_id    = excluded.style_id,
  tagline     = excluded.tagline,
  description = excluded.description,
  image       = excluded.image,
  blueprint   = excluded.blueprint,
  popularity  = excluded.popularity;
