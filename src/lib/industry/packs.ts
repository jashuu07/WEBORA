import type {
  BusinessHours,
  Faq,
  IndustryId,
  IndustryPack,
  MenuCategory,
  MenuItem,
  Offer,
  Testimonial,
  ToneId,
} from '@/types';

export type { Offer, MenuCategory, MenuItem, Testimonial, Faq, IndustryPack };

/**
 * Industry packs — the content brain of the local generation engine.
 *
 * A pack provides structured, industry-accurate raw material (offers, menu,
 * social proof, FAQs, SEO terms) which the copywriter in
 * `src/services/ai/local-engine` adapts to the owner's business profile.
 *
 * Adding a new industry = adding one pack. No component changes required.
 */

const HOURS_STANDARD: BusinessHours[] = [
  { day: 'Monday', hours: '10:00 AM – 9:00 PM' },
  { day: 'Tuesday', hours: '10:00 AM – 9:00 PM' },
  { day: 'Wednesday', hours: '10:00 AM – 9:00 PM' },
  { day: 'Thursday', hours: '10:00 AM – 9:00 PM' },
  { day: 'Friday', hours: '10:00 AM – 10:00 PM' },
  { day: 'Saturday', hours: '9:00 AM – 10:00 PM' },
  { day: 'Sunday', hours: '9:00 AM – 8:00 PM' },
];

export const INDUSTRY_PACKS: Record<IndustryId, IndustryPack> = {
  bakery: {
    id: 'bakery',
    label: 'Bakery & Café',
    emoji: '🥐',
    icon: 'croissant',
    ctaVerb: 'Order fresh',
    offersHeading: 'Baked fresh every morning',
    offersSub: 'Everything is mixed, proofed and baked in-house — never frozen, never yesterday’s.',
    heroEyebrow: 'Neighbourhood bakery & café',
    heroLines: ['Freshly baked happiness,', 'every single morning.'],
    heroSub:
      'Small-batch breads, celebration cakes, French pastries and proper coffee — baked in {city} before the city wakes up.',
    aboutHeading: 'Real butter. Real ovens. Real people.',
    aboutBody:
      'We started {name} with one deck oven and a stubborn belief that {city} deserved better bread. Today we bake over {daily} loaves a day, still by hand, still with cultured butter and slow ferments.',
    aboutBullets: [
      'Sourdough with a 24-hour cold ferment',
      'Eggless and sugar-free options on request',
      'Custom celebration cakes with 48-hour notice',
      'Open kitchen — watch the bakers work',
    ],
    offers: [
      { title: 'Artisan Breads', description: 'Sourdough, multigrain, focaccia and baguettes baked on stone.', price: 'from ₹120', icon: 'wheat' },
      { title: 'Celebration Cakes', description: 'Birthdays, anniversaries and corporate cakes, designed to your brief.', price: 'from ₹899', icon: 'cake' },
      { title: 'French Pastries', description: 'Croissants, danishes, tarts and éclairs laminated with cultured butter.', price: 'from ₹90', icon: 'cookie' },
      { title: 'Coffee & Cold Brews', description: 'Single-origin espresso, filter coffee and 18-hour cold brew.', price: 'from ₹110', icon: 'coffee' },
      { title: 'Cookies & Brownies', description: 'Thick, gooey and boxed beautifully for gifting.', price: 'from ₹60', icon: 'candy' },
      { title: 'Custom Orders', description: 'Bulk orders, hampers and event dessert tables.', price: 'on request', icon: 'gift' },
    ],
    menu: {
      heading: 'From our counter',
      categories: [
        {
          name: 'Breads',
          items: [
            { name: 'Classic Sourdough', description: 'Wild yeast, 24-hour ferment, blistered crust', price: '₹260', tag: 'Best seller' },
            { name: 'Multigrain Loaf', description: 'Five grains, flax, sunflower, honey finish', price: '₹220' },
            { name: 'Rosemary Focaccia', description: 'Olive oil, sea salt, garden rosemary', price: '₹240' },
            { name: 'Butter Croissant', description: 'Laminated 27 layers, French butter', price: '₹140', tag: 'Fresh at 8am' },
          ],
        },
        {
          name: 'Cakes & Desserts',
          items: [
            { name: 'Belgian Chocolate Truffle', description: 'Dark 62% ganache, moist chocolate sponge', price: '₹1,150', tag: 'Popular' },
            { name: 'Vanilla Bean Cheesecake', description: 'Baked, with berry compote', price: '₹1,050' },
            { name: 'Red Velvet Slice', description: 'Cream cheese frosting, cocoa crumb', price: '₹180' },
            { name: 'Lemon Tart', description: 'Zesty curd, torched meringue', price: '₹160' },
          ],
        },
        {
          name: 'Coffee Bar',
          items: [
            { name: 'Filter Coffee', description: 'Chicory blend, brass tumbler', price: '₹90' },
            { name: 'Cappuccino', description: 'Double shot, silky microfoam', price: '₹150' },
            { name: 'Cold Brew', description: '18-hour steep, over ice', price: '₹170' },
            { name: 'Masala Chai', description: 'Slow-boiled, whole spices', price: '₹70' },
          ],
        },
      ],
    },
    testimonials: [
      { quote: 'The sourdough is genuinely better than what I used to buy at fancy stores. My Sunday ritual now.', name: 'Ananya R.', role: 'Regular since 2022', rating: 5 },
      { quote: 'Ordered a custom cake for my mother’s 60th. The design brief was tiny and they nailed it.', name: 'Rohit M.', role: 'Custom cake order', rating: 5 },
      { quote: 'Fast, warm, and always fresh. The cold brew keeps me employed.', name: 'Sneha K.', role: 'Weekday regular', rating: 5 },
    ],
    faqs: [
      { q: 'Do you take same-day cake orders?', a: 'We keep a few signature cakes ready daily. Custom designs need 48 hours so we can bake and finish them properly.' },
      { q: 'Are there eggless options?', a: 'Yes — most of our cakes and all our breads are available eggless. Just mention it when you order.' },
      { q: 'Do you deliver?', a: 'We deliver within 6 km through our own riders, and partner apps cover the rest of the city.' },
      { q: 'Can I order for an event?', a: 'Absolutely. Tell us the headcount and date and we will send a dessert table plan with pricing.' },
    ],
    stats: [
      { value: '14', label: 'Years of baking' },
      { value: '1,200+', label: 'Loaves a week' },
      { value: '4.9', label: 'Google rating' },
    ],
    hours: HOURS_STANDARD,
    seoTerms: ['bakery', 'fresh bread', 'custom cakes', 'pastries', 'coffee shop'],
    primaryCta: 'Order fresh',
    secondaryCta: 'See the menu',
    galleryCaptions: ['Morning bake', 'The counter', 'Celebration cakes', 'Coffee bar', 'Sourdough close-up', 'Behind the scenes'],
    promise: 'Baked today, gone today.',
    defaultTone: 'warm',
  },

  restaurant: {
    id: 'restaurant',
    label: 'Restaurant',
    emoji: '🍽️',
    icon: 'utensils',
    ctaVerb: 'Book a table',
    offersHeading: 'Our menu, your table',
    offersSub: 'Family recipes, city produce and a kitchen that plates everything to order.',
    heroEyebrow: 'Kitchen & bar · {city}',
    heroLines: ['Real food, cooked', 'the way it should be.'],
    heroSub:
      'Slow-cooked curries, tandoor grills and street-food favourites served in a room built for long dinners with {city}’s best people.',
    aboutHeading: 'A kitchen with a memory',
    aboutBody:
      '{name} began as a family kitchen and never really stopped being one. Our masalas are roasted and ground in-house every week, our breads come out of the tandoor to order, and nothing leaves the pass that we would not serve at our own table.',
    aboutBullets: [
      'Hand-ground masalas, roasted weekly',
      'Live tandoor and open grill counter',
      'Vegetarian, vegan and Jain options',
      'Private dining for 12–40 guests',
    ],
    offers: [
      { title: 'Signature Curries', description: 'Slow-simmered gravies built on house-ground spice blends.', price: 'from ₹280', icon: 'soup' },
      { title: 'Tandoor & Grills', description: 'Charcoal-fired kebabs, breads and tikkas served sizzling.', price: 'from ₹340', icon: 'flame' },
      { title: 'Biryani & Rice', description: 'Dum-cooked biryani with aged basmati and saffron.', price: 'from ₹320', icon: 'utensils' },
      { title: 'Street Food', description: 'Chaat, kathi rolls and small plates with a modern twist.', price: 'from ₹180', icon: 'sandwich' },
      { title: 'Bar & Beverages', description: 'Craft cocktails, regional wines and zero-proof coolers.', price: 'from ₹250', icon: 'wine' },
      { title: 'Private Dining', description: 'Set menus and event hosting in our mezzanine space.', price: 'on request', icon: 'users' },
    ],
    menu: {
      heading: 'Signature dishes',
      categories: [
        {
          name: 'Starters',
          items: [
            { name: 'Murgh Malai Kebab', description: 'Cream, cheddar, green chilli, charcoal grill', price: '₹420', tag: 'Chef’s pick' },
            { name: 'Dahi Ke Kebab', description: 'Hung curd, cashew, mint chutney', price: '₹340' },
            { name: 'Prawn Koliwada', description: 'Crisp semolina crust, kokum dip', price: '₹480' },
            { name: 'Tandoori Mushroom', description: 'Button mushrooms, ajwain, smoked butter', price: '₹320' },
          ],
        },
        {
          name: 'Mains',
          items: [
            { name: 'Hyderabadi Dum Biryani', description: 'Aged basmati, saffron, sealed dum, mirchi ka salan', price: '₹460', tag: 'Most ordered' },
            { name: 'Butter Chicken', description: 'Tandoori chicken, tomato, cream, fenugreek', price: '₹440' },
            { name: 'Dal Bukhara', description: 'Black lentils, slow-cooked overnight', price: '₹320' },
            { name: 'Kerala Fish Curry', description: 'Coconut, raw mango, curry leaf', price: '₹520' },
          ],
        },
        {
          name: 'Desserts',
          items: [
            { name: 'Double Ka Meetha', description: 'Saffron bread pudding, dry fruit', price: '₹240' },
            { name: 'Gulab Jamun Cheesecake', description: 'Baked cheese, rose syrup', price: '₹280' },
            { name: 'Kulfi Falooda', description: 'Slow-churned kulfi, rose noodles', price: '₹220' },
          ],
        },
      ],
    },
    testimonials: [
      { quote: 'The biryani is the real dum-style thing — you can smell it before it reaches the table.', name: 'Karthik V.', role: 'Google review', rating: 5 },
      { quote: 'We hosted 30 people upstairs. Service was calm, food came hot, everyone asked where this place was.', name: 'Meera J.', role: 'Private dining guest', rating: 5 },
      { quote: 'Vegetarian options that are not an afterthought. Rare and appreciated.', name: 'Imran S.', role: 'Regular', rating: 4 },
    ],
    faqs: [
      { q: 'Do you take reservations?', a: 'Yes, tables for 2–12 can be booked online or on WhatsApp. Larger groups go to our private dining team.' },
      { q: 'Is there parking?', a: 'Valet is available every evening from 7 PM, plus basement parking in the same building.' },
      { q: 'Do you cater events?', a: 'We cater 50–500 guests with live counters. Share your date and headcount for a tasting.' },
      { q: 'Are you family friendly?', a: 'Very. We have high chairs, a kids’ menu and a no-smoking dining hall.' },
    ],
    stats: [
      { value: '18', label: 'Years on this street' },
      { value: '120', label: 'Seats + terrace' },
      { value: '4.8', label: 'Guest rating' },
    ],
    hours: HOURS_STANDARD,
    seoTerms: ['restaurant', 'biryani', 'family dining', 'table booking', 'tandoor'],
    primaryCta: 'Book a table',
    secondaryCta: 'View the menu',
    galleryCaptions: ['Signature biryani', 'The dining hall', 'Tandoor counter', 'Dessert table', 'Terrace seating', 'Chef at the pass'],
    promise: 'Cooked to order, served with care.',
    defaultTone: 'warm',
  },

  salon: {
    id: 'salon',
    label: 'Salon & Spa',
    emoji: '💇',
    icon: 'scissors',
    ctaVerb: 'Book appointment',
    offersHeading: 'Services & pricing',
    offersSub: 'Senior stylists, professional products and a finish that lasts weeks — not days.',
    heroEyebrow: 'Hair · Skin · Nails',
    heroLines: ['Look like the', 'best version of you.'],
    heroSub:
      'Precision cuts, colour and skin treatments by senior professionals in a calm, spotless studio in {city}.',
    aboutHeading: 'Your chair is ready',
    aboutBody:
      'At {name}, we keep consultations honest: what suits your hair, your skin and your routine — not what sells fastest. Every service starts with a 10-minute consultation and ends with a styling walkthrough you can repeat at home.',
    aboutBullets: [
      'Senior stylists with 8+ years experience',
      'Ammonia-free colour and keratin options',
      'Sterilised tools, single-use kits',
      'Bridal and event packages',
    ],
    offers: [
      { title: 'Haircut & Styling', description: 'Consultation, precision cut, wash and blow-dry finish.', price: 'from ₹599', icon: 'scissors' },
      { title: 'Hair Colour', description: 'Global, highlights, balayage or grey coverage with ammonia-free options.', price: 'from ₹1,899', icon: 'palette' },
      { title: 'Keratin & Smoothening', description: 'Frizz control and shine with formaldehyde-free systems.', price: 'from ₹3,499', icon: 'sparkles' },
      { title: 'Advanced Facials', description: 'HydraFacial, anti-acne and brightening protocols.', price: 'from ₹1,499', icon: 'droplets' },
      { title: 'Waxing & Threading', description: 'Rica and chocolate wax, hygienic single-use strips.', price: 'from ₹199', icon: 'flower' },
      { title: 'Bridal Packages', description: 'Trials, pre-bridal skin and hair, day-of styling for the family.', price: 'on request', icon: 'crown' },
    ],
    testimonials: [
      { quote: 'The only place where the colour matched exactly what we discussed. Zero surprises, gorgeous result.', name: 'Divya P.', role: 'Balayage client', rating: 5 },
      { quote: 'My teenage daughter and my mother both come here. That is a full recommendation.', name: 'Lakshmi N.', role: 'Family client', rating: 5 },
      { quote: 'Bridal package was calm, organised and on time on the wedding morning. Priceless.', name: 'Aisha F.', role: 'Bridal client', rating: 5 },
    ],
    faqs: [
      { q: 'Do I need an appointment?', a: 'Walk-ins are welcome, but weekends fill up. Book online or on WhatsApp and we will hold your chair.' },
      { q: 'Which products do you use?', a: 'Professional ranges from L’Oréal, Wella, Schwarzkopf and Kérastase. We share the exact product list before we start.' },
      { q: 'How long does colour take?', a: 'Grey coverage takes about 60 minutes; highlights and balayage take 2.5–4 hours depending on length.' },
      { q: 'Do you offer bridal trials?', a: 'Yes — a 90-minute trial with photos, so nothing is decided on the wedding morning.' },
    ],
    stats: [
      { value: '12', label: 'Years styling {city}' },
      { value: '9', label: 'Senior professionals' },
      { value: '4.9', label: 'Client rating' },
    ],
    hours: HOURS_STANDARD,
    seoTerms: ['salon', 'haircut', 'hair colour', 'facial', 'bridal makeup'],
    primaryCta: 'Book appointment',
    secondaryCta: 'See services',
    galleryCaptions: ['Styling floor', 'Colour work', 'Bridal look', 'Spa room', 'Nail bar', 'Before & after'],
    promise: 'Booked in a minute, styled for weeks.',
    defaultTone: 'elegant',
  },

  gym: {
    id: 'gym',
    label: 'Gym & Fitness',
    emoji: '🏋️',
    icon: 'dumbbell',
    ctaVerb: 'Book free trial',
    offersHeading: 'Programmes built around results',
    offersSub: 'Coach-led training, measurable progress and equipment that is actually maintained.',
    heroEyebrow: 'Train · Track · Transform',
    heroLines: ['Stronger starts', 'on day one.'],
    heroSub:
      'Certified coaches, structured programmes and a floor that pushes you — in the heart of {city}.',
    aboutHeading: 'Not just equipment. Coaching.',
    aboutBody:
      '{name} is built on one idea: everyone who walks in gets a plan, a coach and a monthly check-in. No guessing, no random workouts. You will know what you are doing, why, and what changed in your last 30 days.',
    aboutBullets: [
      'Body composition tracking every month',
      'Max 1:6 coaching ratio in group slots',
      'Strength, CrossFit, HIIT, mobility and yoga',
      'Diet guidance included in every plan',
    ],
    offers: [
      { title: 'Strength Training', description: 'Progressive overload programming on a fully equipped free-weight floor.', price: '₹2,500/mo', icon: 'dumbbell' },
      { title: 'Personal Training', description: 'One-on-one coaching with monthly measurements and diet review.', price: '₹9,000/mo', icon: 'user' },
      { title: 'Group Classes', description: 'HIIT, functional circuits and spin — 45 minutes, high energy.', price: '₹1,800/mo', icon: 'users' },
      { title: 'Weight Loss Programme', description: '12-week transformation with coaching, nutrition and weekly reviews.', price: '₹14,999', icon: 'target' },
      { title: 'Yoga & Mobility', description: 'Morning and evening batches for flexibility and recovery.', price: '₹1,500/mo', icon: 'leaf' },
      { title: 'Sports Conditioning', description: 'Speed, agility and injury-prevention for athletes.', price: 'on request', icon: 'zap' },
    ],
    testimonials: [
      { quote: 'Down 14 kg in five months without a crazy diet. The monthly reviews kept me honest.', name: 'Sandeep G.', role: 'Weight loss programme', rating: 5 },
      { quote: 'Coaches actually correct your form. I stopped having knee pain within weeks.', name: 'Nikhil T.', role: 'Strength member', rating: 5 },
      { quote: '5:30 am batch is always full and always on time. That discipline rubs off.', name: 'Pavani S.', role: 'Group classes', rating: 4 },
    ],
    faqs: [
      { q: 'Is there a joining fee?', a: 'No joining fee, no lock-in beyond the plan you choose. Monthly, quarterly and annual options are available.' },
      { q: 'Do you provide a diet plan?', a: 'Every plan includes a nutrition guideline built around your body composition target — and we review it monthly.' },
      { q: 'What are the timings?', a: '5 AM to 10 PM on weekdays, 6 AM to 9 PM on weekends. Group class timetables are on the classes section.' },
      { q: 'Do you have trainers for beginners?', a: 'Yes. First two weeks are onboarding: technique, machine setup and a starter programme you can follow confidently.' },
    ],
    stats: [
      { value: '900+', label: 'Active members' },
      { value: '14', label: 'Certified coaches' },
      { value: '5,000', label: 'Sq ft training floor' },
    ],
    hours: [
      { day: 'Monday – Friday', hours: '5:00 AM – 10:00 PM' },
      { day: 'Saturday', hours: '6:00 AM – 9:00 PM' },
      { day: 'Sunday', hours: '6:00 AM – 1:00 PM' },
      { day: 'Public holidays', hours: '7:00 AM – 12:00 PM' },
    ],
    seoTerms: ['gym', 'personal training', 'weight loss', 'fitness classes', 'CrossFit'],
    primaryCta: 'Book free trial',
    secondaryCta: 'View programmes',
    galleryCaptions: ['Strength floor', 'Functional zone', 'Group class', 'Cardio deck', 'Coach at work', 'Transformation wall'],
    promise: 'First session free. No pressure.',
    defaultTone: 'bold',
  },

  consultant: {
    id: 'consultant',
    label: 'Consultant & Services',
    emoji: '📈',
    icon: 'briefcase',
    ctaVerb: 'Book a call',
    offersHeading: 'How I can help',
    offersSub: 'Clear scope, fixed deliverables and honest timelines — no open-ended retainers.',
    heroEyebrow: 'Consulting · {city}',
    heroLines: ['Clarity, strategy and', 'work that compounds.'],
    heroSub:
      'Hands-on advisory for founders and growing teams — from positioning and pricing to systems that actually get used.',
    aboutHeading: 'Senior thinking, without the agency overhead',
    aboutBody:
      'I work with a small number of clients at a time so the work stays personal. Every engagement starts with a diagnostic, moves through a written strategy, and ends with your team able to run it without me.',
    aboutBullets: [
      'Diagnostic-first: no advice before understanding',
      'Written deliverables, not slide decks',
      'Direct access — you work with me, not juniors',
      'Fixed-fee engagements with clear scope',
    ],
    offers: [
      { title: 'Business Diagnostic', description: 'A structured review of your model, pricing, funnel and team — with a prioritised action plan.', price: '₹35,000', icon: 'search' },
      { title: 'Growth Strategy', description: '90-day roadmap with channel mix, budgets, targets and the metrics to hold yourself to.', price: '₹85,000', icon: 'trending-up' },
      { title: 'Pricing & Positioning', description: 'Repackage your offer, fix your pricing and sharpen the message that sells it.', price: '₹55,000', icon: 'tag' },
      { title: 'Go-to-Market', description: 'Launch plan for a new product or city, from ICP to first 100 customers.', price: '₹1,20,000', icon: 'rocket' },
      { title: 'Fractional Leadership', description: 'Two days a week embedded with your team, building the systems and the muscle.', price: '₹1,50,000/mo', icon: 'users' },
      { title: 'Advisory Retainer', description: 'Monthly strategy sessions plus async support for ongoing decisions.', price: '₹40,000/mo', icon: 'repeat' },
    ],
    testimonials: [
      { quote: 'Repositioned our offer and raised prices 40%. Churn went down. That is the whole story.', name: 'Vikram A.', role: 'Founder, SaaS', rating: 5 },
      { quote: 'We got a written plan we still use 18 months later. Unusually practical consulting.', name: 'Priya D.', role: 'COO, D2C brand', rating: 5 },
      { quote: 'Straight answers, no theatre. Worth every rupee.', name: 'Rahul K.', role: 'Founder, services firm', rating: 5 },
    ],
    faqs: [
      { q: 'How do engagements start?', a: 'With a free 30-minute call to check fit, followed by a paid diagnostic if we are aligned.' },
      { q: 'Do you work remotely?', a: 'Yes. Most clients are remote with weekly video calls, plus on-site days for workshops when needed.' },
      { q: 'What size of business do you work with?', a: 'Typically ₹50 lakh to ₹50 crore revenue — big enough to have a real problem, small enough to move fast.' },
      { q: 'What is not included?', a: 'Implementation. I give you the plan, the templates and the coaching to execute it with your own team.' },
    ],
    stats: [
      { value: '120+', label: 'Engagements delivered' },
      { value: '₹400Cr', label: 'Client revenue advised' },
      { value: '11', label: 'Years advising founders' },
    ],
    hours: [
      { day: 'Monday – Friday', hours: '9:30 AM – 6:30 PM' },
      { day: 'Saturday', hours: 'By appointment' },
      { day: 'Sunday', hours: 'Closed' },
    ],
    seoTerms: ['business consultant', 'growth strategy', 'pricing consultant', 'go to market', 'advisory'],
    primaryCta: 'Book a call',
    secondaryCta: 'See services',
    galleryCaptions: ['Workshop day', 'Strategy sprint', 'Team session', 'Offsite', 'Dashboard review', 'On-site'],
    promise: 'Free 30-minute fit call.',
    defaultTone: 'professional',
  },

  portfolio: {
    id: 'portfolio',
    label: 'Portfolio & Creative',
    emoji: '🎨',
    icon: 'palette',
    ctaVerb: 'Start a project',
    offersHeading: 'What I do',
    offersSub: 'A small, focused practice — so every project gets senior attention from brief to launch.',
    heroEyebrow: 'Independent designer',
    heroLines: ['Design that does', 'a job.'],
    heroSub:
      'Brand identity, product interfaces and websites for founders who care about the details.',
    aboutHeading: 'Small studio energy, senior execution',
    aboutBody:
      'I’m a designer based in {city} working with founders and marketing teams. Most projects run 3–6 weeks: discovery, direction, build, handover. You get the files, the system and the reasoning behind every choice.',
    aboutBullets: [
      'Brand identity and visual systems',
      'Product and marketing site design',
      'Webflow / React build and handover',
      'Clear weekly updates, no black boxes',
    ],
    offers: [
      { title: 'Brand Identity', description: 'Logo system, colour, type, and a lightweight brand guide your team can use.', price: 'from ₹75,000', icon: 'palette' },
      { title: 'Website Design', description: 'Marketing site design with responsive layouts and developer-ready specs.', price: 'from ₹95,000', icon: 'layout' },
      { title: 'Product UI', description: 'Interface design for apps and dashboards, with states, flows and edge cases.', price: 'from ₹1,40,000', icon: 'smartphone' },
      { title: 'Design Systems', description: 'Tokens, components and documentation that keep a growing team consistent.', price: 'from ₹1,80,000', icon: 'layers' },
      { title: 'Packaging & Print', description: 'Labels, cartons and collateral that hold up on a shelf.', price: 'from ₹60,000', icon: 'package' },
      { title: 'Art Direction', description: 'Shoots, campaigns and social sets with a consistent visual voice.', price: 'on request', icon: 'camera' },
    ],
    testimonials: [
      { quote: 'Our new identity made fundraising conversations easier. Investors finally understood us in one slide.', name: 'Aditya B.', role: 'Founder', rating: 5 },
      { quote: 'Ships on time, explains the thinking, handles feedback like an adult. Rare combo.', name: 'Tanvi M.', role: 'Head of Marketing', rating: 5 },
      { quote: 'The design system cut our build time in half.', name: 'Joel F.', role: 'Engineering lead', rating: 5 },
    ],
    faqs: [
      { q: 'How do projects start?', a: 'A short call, then a written proposal with scope, timeline and cost. A 40% deposit books your slot.' },
      { q: 'How long does a website take?', a: 'Typically 3–5 weeks including one round of revisions and a build pass.' },
      { q: 'Do you build as well as design?', a: 'Yes — static sites and marketing pages are built and handed over ready to publish, or I can work with your developer.' },
      { q: 'How many revisions?', a: 'Two rounds per deliverable are included. Beyond that we scope it as a new phase.' },
    ],
    stats: [
      { value: '60+', label: 'Projects shipped' },
      { value: '9', label: 'Years designing' },
      { value: '4', label: 'Design awards' },
    ],
    hours: [
      { day: 'Monday – Friday', hours: '10:00 AM – 7:00 PM' },
      { day: 'Saturday', hours: 'Studio visits by appointment' },
      { day: 'Sunday', hours: 'Closed' },
    ],
    seoTerms: ['designer', 'brand identity', 'website design', 'ui designer', 'design system'],
    primaryCta: 'Start a project',
    secondaryCta: 'See selected work',
    galleryCaptions: ['Brand system', 'Website design', 'App interface', 'Packaging', 'Type study', 'Process shots'],
    promise: 'Reply within one working day.',
    defaultTone: 'elegant',
  },

  realestate: {
    id: 'realestate',
    label: 'Real Estate',
    emoji: '🏢',
    icon: 'building',
    ctaVerb: 'Book a site visit',
    offersHeading: 'Properties & services',
    offersSub: 'Verified listings, legal checks and negotiation handled end to end.',
    heroEyebrow: 'Property advisors · {city}',
    heroLines: ['Find the address', 'that fits your life.'],
    heroSub:
      'Apartments, villas and commercial spaces across {city} — with paperwork that holds up and pricing that is honest.',
    aboutHeading: 'Brokerage without the guesswork',
    aboutBody:
      '{name} works on a simple promise: every listing is personally inspected, the documentation is verified before we show it, and you get an honest opinion — including when the answer is “wait”.',
    aboutBullets: [
      'Every unit inspected and photographed by us',
      'RERA, title and encumbrance verification',
      'Loan assistance with three partner banks',
      'Rental management for NRI owners',
    ],
    offers: [
      { title: 'Buy a Home', description: 'Shortlists matched to budget, commute and school needs — with site visits in one trip.', price: 'No buyer fee', icon: 'home' },
      { title: 'Sell / List', description: 'Photography, pricing strategy, qualified buyer network and negotiation.', price: '1% commission', icon: 'tag' },
      { title: 'Rentals', description: 'Verified tenants, digital agreements and monthly collection handling.', price: '1 month rent', icon: 'key' },
      { title: 'Commercial Leasing', description: 'Office and retail spaces with fit-out partners and lease drafting.', price: 'On agreement', icon: 'building' },
      { title: 'NRI Services', description: 'Virtual tours, power of attorney support and end-to-end management.', price: 'On request', icon: 'globe' },
      { title: 'Investment Advisory', description: 'Rental yield and appreciation analysis before you commit capital.', price: 'On request', icon: 'trending-up' },
    ],
    testimonials: [
      { quote: 'They talked us out of one flat and into a better one. That honesty is why we came back to buy a second.', name: 'Sriram & Neha', role: 'Home buyers', rating: 5 },
      { quote: 'Handled the entire rental process for our flat while we were in Singapore.', name: 'Vivek R.', role: 'NRI owner', rating: 5 },
      { quote: 'Paperwork was clean, loan came through in nine days.', name: 'Farhan Q.', role: 'First-time buyer', rating: 4 },
    ],
    faqs: [
      { q: 'Do buyers pay a brokerage?', a: 'For primary sales we are paid by the developer, so buyers pay nothing. Resale transactions carry a standard fee, shared upfront.' },
      { q: 'Do you handle home loans?', a: 'Yes — we work with three banks and one NBFC, pre-check eligibility and coordinate documentation.' },
      { q: 'Can you verify legal documents?', a: 'We run title, encumbrance and RERA checks with an empanelled advocate before you pay any advance.' },
      { q: 'Do you manage rentals?', a: 'We handle tenant sourcing, agreements, deposits and monthly collection for a small management fee.' },
    ],
    stats: [
      { value: '1,800+', label: 'Deals closed' },
      { value: '₹900Cr', label: 'Property transacted' },
      { value: '98%', label: 'Clients who refer us' },
    ],
    hours: [
      { day: 'Monday – Saturday', hours: '9:30 AM – 7:30 PM' },
      { day: 'Sunday', hours: 'Site visits by appointment' },
    ],
    seoTerms: ['real estate', 'flats for sale', 'rental apartments', 'property advisor', 'commercial space'],
    primaryCta: 'Book a site visit',
    secondaryCta: 'Browse listings',
    galleryCaptions: ['Featured project', 'Living spaces', 'Amenities', 'Location', 'Clubhouse', 'Floor plans'],
    promise: 'Zero pressure, verified paperwork.',
    defaultTone: 'professional',
  },

  photography: {
    id: 'photography',
    label: 'Photography',
    emoji: '📷',
    icon: 'camera',
    ctaVerb: 'Check availability',
    offersHeading: 'Shoots & packages',
    offersSub: 'Relaxed direction, honest edits and files delivered on schedule — always.',
    heroEyebrow: 'Weddings · Portraits · Brands',
    heroLines: ['Moments worth', 'printing.'],
    heroSub:
      'Documentary-style photography in {city} — weddings, portraits and brand shoots with a warm, timeless edit.',
    aboutHeading: 'Less posing. More feeling.',
    aboutBody:
      'I photograph people as they actually are: laughing, crying, dancing badly, being themselves. My job is to be present, invisible and ready — so the photos look like the day, not like a photoshoot.',
    aboutBullets: [
      'Documentary approach with light direction',
      'Two cameras, backup to two drives on site',
      'Colour-graded to a consistent look',
      'Prints and albums available',
    ],
    offers: [
      { title: 'Wedding Coverage', description: 'Full-day coverage with two photographers, 600+ edited images and a wedding album.', price: 'from ₹1,20,000', icon: 'heart' },
      { title: 'Pre-Wedding & Couple', description: 'Three-hour session at two locations, 80 edited images, styling guidance.', price: 'from ₹32,000', icon: 'camera' },
      { title: 'Portraits & Headshots', description: 'Studio or natural-light portraits with retouching for professional use.', price: 'from ₹9,000', icon: 'user' },
      { title: 'Family & Kids', description: 'Relaxed session at home or outdoors — kids set the pace.', price: 'from ₹14,000', icon: 'users' },
      { title: 'Brand & Product', description: 'Catalogue, lifestyle and campaign shoots with usage rights included.', price: 'from ₹28,000', icon: 'package' },
      { title: 'Event & Corporate', description: 'Conferences, launches and award nights with same-day selects.', price: 'from ₹18,000', icon: 'calendar' },
    ],
    testimonials: [
      { quote: 'I forgot he was there and that is exactly why the album feels like our day.', name: 'Rithika & Arjun', role: 'Wedding clients', rating: 5 },
      { quote: 'Brand shoot delivered in four days, complete with web-ready crops. Brilliant.', name: 'Kavya S.', role: 'Founder, skincare', rating: 5 },
      { quote: 'Even our toddler cooperated. Sorcery, honestly.', name: 'Deepak V.', role: 'Family session', rating: 5 },
    ],
    faqs: [
      { q: 'How do we book a date?', a: 'A 25% advance holds the date; the balance is due a week before the shoot. Everything is confirmed in writing.' },
      { q: 'When do we get the photos?', a: 'Selects within 72 hours, full edited gallery in 2–3 weeks, albums 4–5 weeks.' },
      { q: 'Do you travel?', a: 'Yes — travel within the state is included in most packages, outside is charged at actuals.' },
      { q: 'Is a second shooter available?', a: 'Yes for weddings and large events, so you never miss the other angle.' },
    ],
    stats: [
      { value: '250+', label: 'Weddings covered' },
      { value: '10', label: 'Years behind the lens' },
      { value: '2M+', label: 'Photos delivered' },
    ],
    hours: [
      { day: 'Monday – Friday', hours: '10:00 AM – 7:00 PM (studio)' },
      { day: 'Saturday – Sunday', hours: 'Shoots by appointment' },
    ],
    seoTerms: ['photographer', 'wedding photography', 'portrait session', 'brand photography'],
    primaryCta: 'Check availability',
    secondaryCta: 'View portfolio',
    galleryCaptions: ['Wedding day', 'Portrait session', 'Brand shoot', 'Golden hour', 'Candid moments', 'Details'],
    promise: 'Replies within a few hours.',
    defaultTone: 'elegant',
  },

  retail: {
    id: 'retail',
    label: 'Shop & Retail',
    emoji: '🛍️',
    icon: 'shopping-bag',
    ctaVerb: 'Visit the store',
    offersHeading: 'What we stock',
    offersSub: 'Carefully chosen ranges, fair prices and staff who actually know the products.',
    heroEyebrow: '{city} · Since {since}',
    heroLines: ['Good things,', 'chosen carefully.'],
    heroSub:
      'Everyday essentials and hard-to-find favourites, hand-picked and priced honestly at our {city} store.',
    aboutHeading: 'A shop, not a warehouse',
    aboutBody:
      'We stock less than the big stores on purpose. Every product on our shelves has been tested by someone on the team, and if it does not last, we do not sell it. Ask us anything — we will give you a straight answer.',
    aboutBullets: [
      'Locally sourced where possible',
      'Exchange within 7 days, no interrogation',
      'Home delivery within 5 km',
      'Bulk and corporate gifting orders',
    ],
    offers: [
      { title: 'Everyday Essentials', description: 'The staples you run out of, always in stock.', price: 'From ₹49', icon: 'shopping-basket' },
      { title: 'Gifting & Hampers', description: 'Curated boxes for festivals, weddings and corporate clients.', price: 'From ₹899', icon: 'gift' },
      { title: 'Home & Kitchen', description: 'Cookware and homeware that survives real Indian kitchens.', price: 'From ₹299', icon: 'cooking-pot' },
      { title: 'Fresh & Local', description: 'Small-batch products from producers within 100 km.', price: 'From ₹99', icon: 'leaf' },
      { title: 'Bulk Orders', description: 'Office supplies, event kits and reseller pricing.', price: 'On request', icon: 'package' },
      { title: 'Home Delivery', description: 'Same-day delivery within 5 km, free above ₹999.', price: 'Free above ₹999', icon: 'truck' },
    ],
    testimonials: [
      { quote: 'They remember what I buy and call when it is back in stock. That is service.', name: 'Sara N.', role: 'Regular customer', rating: 5 },
      { quote: 'Corner shop prices with big-brand quality. Rare combination.', name: 'Mohan D.', role: 'Local resident', rating: 5 },
      { quote: 'Same-day delivery saved my Diwali gifting.', name: 'Rupali T.', role: 'Corporate order', rating: 5 },
    ],
    faqs: [
      { q: 'Do you deliver?', a: 'Yes — same-day within 5 km, free on orders above ₹999. WhatsApp us your list.' },
      { q: 'What is the return policy?', a: 'Unused items with the bill can be exchanged within 7 days. Faulty products are replaced or refunded.' },
      { q: 'Do you take bulk orders?', a: 'We do — gifting, office supplies and event packages. Send us a list and we will quote the same day.' },
      { q: 'Can I reserve items?', a: 'Message us on WhatsApp and we will hold stock for 24 hours.' },
    ],
    stats: [
      { value: '3,400+', label: 'Products stocked' },
      { value: '22', label: 'Years in the neighbourhood' },
      { value: '4.8', label: 'Customer rating' },
    ],
    hours: [
      { day: 'Monday – Saturday', hours: '9:00 AM – 9:30 PM' },
      { day: 'Sunday', hours: '10:00 AM – 8:00 PM' },
    ],
    seoTerms: ['shop', 'store', 'gifting', 'home delivery', 'local store'],
    primaryCta: 'Visit the store',
    secondaryCta: 'See what we stock',
    galleryCaptions: ['Store front', 'Shelves', 'Gift hampers', 'New arrivals', 'Behind the counter', 'Local producers'],
    promise: 'Delivery in 5 km, same day.',
    defaultTone: 'friendly',
  },

  general: {
    id: 'general',
    label: 'Local Business',
    emoji: '🏪',
    icon: 'store',
    ctaVerb: 'Get in touch',
    offersHeading: 'What we do',
    offersSub: 'Straightforward services, clear pricing and people who turn up when they say they will.',
    heroEyebrow: 'Local business · {city}',
    heroLines: ['Trusted work,', 'honest pricing.'],
    heroSub:
      'Serving homes and businesses across {city} with dependable service and a team you can actually reach.',
    aboutHeading: 'Built on repeat customers',
    aboutBody:
      'Almost everyone who calls {name} was recommended by someone else. That only happens when the work is good and the pricing is fair — so that is what we focus on, every single job.',
    aboutBullets: [
      'Free consultation and written quote',
      'Fixed pricing, no surprise line items',
      'Trained team, insured work',
      '90-day workmanship guarantee',
    ],
    offers: [
      { title: 'Consultation', description: 'A free visit or call to understand the requirement and recommend options.', price: 'Free', icon: 'message-circle' },
      { title: 'Standard Service', description: 'Our most requested package — completed in a single visit.', price: 'From ₹1,499', icon: 'tool' },
      { title: 'Premium Package', description: 'Complete solution with premium materials and extended warranty.', price: 'From ₹4,999', icon: 'star' },
      { title: 'Annual Maintenance', description: 'Scheduled check-ups that prevent costly breakdowns.', price: 'From ₹5,999/yr', icon: 'calendar-check' },
      { title: 'Emergency Service', description: 'Same-day support for urgent problems, 7 days a week.', price: 'On request', icon: 'zap' },
      { title: 'Business Contracts', description: 'Recurring service plans for offices and commercial clients.', price: 'On request', icon: 'briefcase' },
    ],
    testimonials: [
      { quote: 'Quote was honoured to the rupee and the work was finished a day early.', name: 'Ramesh B.', role: 'Customer', rating: 5 },
      { quote: 'They explained the options without pushing the expensive one.', name: 'Anita V.', role: 'Homeowner', rating: 5 },
      { quote: 'Second time using them. Same quality, same people.', name: 'Zubair H.', role: 'Repeat customer', rating: 5 },
    ],
    faqs: [
      { q: 'Do you provide a free quote?', a: 'Yes — a free consultation and a written quote before any work starts.' },
      { q: 'What areas do you cover?', a: 'We cover {city} and 40 km around it. Share your pin code and we will confirm.' },
      { q: 'Do you offer any warranty?', a: 'All workmanship carries a 90-day guarantee, and materials carry the manufacturer warranty.' },
      { q: 'How soon can you start?', a: 'Most jobs are scheduled within 48 hours. Emergency service is same-day.' },
    ],
    stats: [
      { value: '5,000+', label: 'Jobs completed' },
      { value: '15', label: 'Years in business' },
      { value: '4.8', label: 'Customer rating' },
    ],
    hours: HOURS_STANDARD,
    seoTerms: ['local business', 'services', 'professional', 'trusted', 'quote'],
    primaryCta: 'Get in touch',
    secondaryCta: 'See services',
    galleryCaptions: ['Our team', 'Recent work', 'Workshop', 'Completed project', 'In progress', 'Happy customer'],
    promise: 'Free quote within 24 hours.',
    defaultTone: 'friendly',
  },
};

export const INDUSTRY_LIST: IndustryPack[] = Object.values(INDUSTRY_PACKS);

/**
 * Maps free-text business descriptions to an industry pack.
 * Used by the generator's "understanding your business" stage.
 */
const INDUSTRY_KEYWORDS: Record<IndustryId, string[]> = {
  bakery: ['bakery', 'bake', 'cake', 'pastry', 'bread', 'patisserie', 'croissant', 'dessert', 'coffee shop', 'cafe', 'café'],
  restaurant: ['restaurant', 'dine', 'biryani', 'food', 'kitchen', 'dhaba', 'catering', 'meals', 'cuisine', 'eatery', 'hotel food'],
  salon: ['salon', 'hair', 'beauty', 'spa', 'makeup', 'bridal', 'nails', 'parlour', 'barber', 'skin clinic', 'facial'],
  gym: ['gym', 'fitness', 'training', 'crossfit', 'yoga', 'zumba', 'workout', 'pilates', 'coach', 'physio'],
  consultant: ['consult', 'advisor', 'advisory', 'strategy', 'accounting', 'legal', 'ca ', 'chartered', 'tax', 'agency', 'marketing agency', 'it services'],
  portfolio: ['portfolio', 'designer', 'developer', 'freelance', 'illustrator', 'artist', 'ux', 'branding', 'writer', 'creator'],
  realestate: ['real estate', 'property', 'realtor', 'flat', 'apartment', 'villa', 'rent', 'broker', 'builder', 'construction', 'interior'],
  photography: ['photo', 'photograph', 'videograph', 'wedding shoot', 'studio', 'filmmaker', 'drone'],
  retail: ['shop', 'store', 'retail', 'boutique', 'supermarket', 'grocery', 'gift', 'stationery', 'hardware', 'electronics', 'clothing store'],
  general: [],
};

export function detectIndustry(text: string): { industry: IndustryId; confidence: number; matched: string[] } {
  const haystack = ` ${text.toLowerCase()} `;
  let best: { industry: IndustryId; matched: string[] } = { industry: 'general', matched: [] };

  (Object.keys(INDUSTRY_KEYWORDS) as IndustryId[]).forEach((industry) => {
    if (industry === 'general') return;
    const matched = INDUSTRY_KEYWORDS[industry].filter((kw) => haystack.includes(kw));
    if (matched.length > best.matched.length) best = { industry, matched };
  });

  const confidence = best.matched.length === 0 ? 0.35 : Math.min(0.99, 0.6 + best.matched.length * 0.13);
  return { industry: best.industry, confidence, matched: best.matched };
}

export function getPack(industry: IndustryId | string | undefined): IndustryPack {
  return INDUSTRY_PACKS[(industry as IndustryId) ?? 'general'] ?? INDUSTRY_PACKS.general;
}
