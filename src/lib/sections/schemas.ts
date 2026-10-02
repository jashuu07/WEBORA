import type { FieldDef, Section, SectionType, Spacing } from '@/types';

/**
 * Section registry.
 *
 * Each entry defines
 *   - how the section renders by default (`defaults`)
 *   - which controls the editor's right-hand inspector shows (`fields`)
 *   - how it is labelled in the left-hand section list (`label`, `icon`)
 *
 * The editor is entirely schema-driven: add a field here and it appears in the
 * UI, with values persisted through the normal PATCH /api/sites/:id flow.
 */

export interface SectionDefinition {
  type: SectionType;
  label: string;
  icon: string;
  description: string;
  /** Sections that can appear more than once on a page. */
  repeatable?: boolean;
  /** Shown in the "add section" library. */
  libraryGroup: 'Core' | 'Content' | 'Convert' | 'Contact';
  fields: FieldDef[];
  defaults: Record<string, unknown>;
}

const listOf = (itemFields: FieldDef[], label = 'Items'): FieldDef => ({
  key: 'items',
  label,
  kind: 'list',
  itemFields,
});

const ICON_OPTIONS = [
  { label: 'Wheat', value: 'wheat' },
  { label: 'Cake', value: 'cake' },
  { label: 'Coffee', value: 'coffee' },
  { label: 'Utensils', value: 'utensils' },
  { label: 'Flame', value: 'flame' },
  { label: 'Scissors', value: 'scissors' },
  { label: 'Palette', value: 'palette' },
  { label: 'Sparkles', value: 'sparkles' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Target', value: 'target' },
  { label: 'Briefcase', value: 'briefcase' },
  { label: 'Trending Up', value: 'trending-up' },
  { label: 'Rocket', value: 'rocket' },
  { label: 'Camera', value: 'camera' },
  { label: 'Home', value: 'home' },
  { label: 'Building', value: 'building' },
  { label: 'Shopping Bag', value: 'shopping-bag' },
  { label: 'Store', value: 'store' },
  { label: 'Star', value: 'star' },
  { label: 'Heart', value: 'heart' },
  { label: 'Users', value: 'users' },
  { label: 'Clock', value: 'clock' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Zap', value: 'zap' },
  { label: 'Shield', value: 'shield' },
  { label: 'Award', value: 'award' },
  { label: 'Leaf', value: 'leaf' },
  { label: 'Wrench', value: 'wrench' },
  { label: 'Phone', value: 'phone' },
  { label: 'Truck', value: 'truck' },
];

const ICON_FIELD = (key = 'icon', label = 'Icon'): FieldDef => ({
  key,
  label,
  kind: 'select',
  options: ICON_OPTIONS,
});

export const SECTION_DEFS: Record<SectionType, SectionDefinition> = {
  nav: {
    type: 'nav',
    label: 'Navigation',
    icon: 'menu',
    description: 'Sticky top bar with your logo, page links and call-to-action.',
    libraryGroup: 'Core',
    fields: [
      { key: 'brand', label: 'Brand name', kind: 'text' },
      { key: 'logoUrl', label: 'Logo image', kind: 'image', help: 'Optional — overrides the text logo.' },
      listOf(
        [
          { key: 'label', label: 'Label', kind: 'text' },
          { key: 'href', label: 'Link', kind: 'link' },
        ],
        'Menu links',
      ),
      { key: 'ctaLabel', label: 'Button label', kind: 'text' },
      { key: 'ctaHref', label: 'Button link', kind: 'link' },
      { key: 'sticky', label: 'Sticky on scroll', kind: 'toggle' },
      { key: 'showPhone', label: 'Show phone number', kind: 'toggle' },
      { key: 'phone', label: 'Phone', kind: 'text' },
    ],
    defaults: {
      brand: 'Your Business',
      logoUrl: '',
      items: [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Services', href: '/services' },
        { label: 'Contact', href: '/contact' },
      ],
      ctaLabel: 'Get in touch',
      ctaHref: '/contact',
      sticky: true,
      showPhone: true,
      phone: '',
    },
  },

  hero: {
    type: 'hero',
    label: 'Hero',
    icon: 'layout-template',
    description: 'The first screen: headline, supporting line and your main call-to-action.',
    libraryGroup: 'Core',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Headline', kind: 'textarea' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      { key: 'primaryLabel', label: 'Primary button', kind: 'text' },
      { key: 'primaryHref', label: 'Primary link', kind: 'link' },
      { key: 'secondaryLabel', label: 'Secondary button', kind: 'text' },
      { key: 'secondaryHref', label: 'Secondary link', kind: 'link' },
      { key: 'image', label: 'Image', kind: 'image' },
      {
        key: 'layout',
        label: 'Layout',
        kind: 'select',
        options: [
          { label: 'Image right (split)', value: 'split' },
          { label: 'Full-width image', value: 'overlay' },
          { label: 'Centred text', value: 'centered' },
        ],
      },
      { key: 'trustLine', label: 'Trust line', kind: 'text', help: 'Small line under the buttons, e.g. “4.9★ from 320 reviews”.' },
    ],
    defaults: {
      eyebrow: '',
      heading: 'Your business,\nonline and ready.',
      sub: 'Tell customers what you do and why you are worth the visit.',
      primaryLabel: 'Get in touch',
      primaryHref: '/contact',
      secondaryLabel: '',
      secondaryHref: '',
      image: '',
      layout: 'split',
      trustLine: '',
    },
  },

  about: {
    type: 'about',
    label: 'About',
    icon: 'info',
    description: 'Your story, credentials and what makes you different.',
    libraryGroup: 'Content',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'body', label: 'Body copy', kind: 'textarea' },
      listOf([{ key: 'text', label: 'Point', kind: 'text' }], 'Bullets'),
      { key: 'image', label: 'Image', kind: 'image' },
      {
        key: 'layout',
        label: 'Layout',
        kind: 'select',
        options: [
          { label: 'Image left', value: 'image-left' },
          { label: 'Image right', value: 'image-right' },
          { label: 'No image', value: 'no-image' },
        ],
      },
    ],
    defaults: {
      eyebrow: 'About us',
      heading: 'A little about us',
      body: 'Use this space to tell customers who you are, how long you have been doing this, and what they can expect.',
      items: [{ text: 'Locally owned and operated' }],
      image: '',
      layout: 'image-left',
    },
  },

  services: {
    type: 'services',
    label: 'Services',
    icon: 'list',
    description: 'Your offers in cards, with optional prices.',
    libraryGroup: 'Content',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      {
        key: 'columns',
        label: 'Columns',
        kind: 'select',
        options: [
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
        ],
      },
      { key: 'showIcons', label: 'Show icons', kind: 'toggle' },
      { key: 'showPrices', label: 'Show prices', kind: 'toggle' },
      listOf(
        [
          ICON_FIELD(),
          { key: 'title', label: 'Title', kind: 'text' },
          { key: 'description', label: 'Description', kind: 'textarea' },
          { key: 'price', label: 'Price', kind: 'text' },
        ],
        'Offers',
      ),
    ],
    defaults: {
      eyebrow: 'What we do',
      heading: 'Services',
      sub: '',
      columns: '3',
      showIcons: true,
      showPrices: true,
      items: [
        { icon: 'star', title: 'Service one', description: 'Short description of this service.', price: '' },
        { icon: 'zap', title: 'Service two', description: 'Short description of this service.', price: '' },
        { icon: 'shield', title: 'Service three', description: 'Short description of this service.', price: '' },
      ],
    },
  },

  menu: {
    type: 'menu',
    label: 'Menu / Price list',
    icon: 'utensils',
    description: 'Grouped items with prices — perfect for food, treatments or packages.',
    libraryGroup: 'Content',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      { key: 'note', label: 'Note', kind: 'text' },
      listOf(
        [
          { key: 'name', label: 'Category', kind: 'text' },
          {
            key: 'items',
            label: 'Items',
            kind: 'list',
            itemFields: [
              { key: 'name', label: 'Item', kind: 'text' },
              { key: 'description', label: 'Description', kind: 'text' },
              { key: 'price', label: 'Price', kind: 'text' },
              { key: 'tag', label: 'Tag', kind: 'text' },
            ],
          },
        ],
        'Categories',
      ),
    ],
    defaults: {
      eyebrow: 'Menu',
      heading: 'What we serve',
      sub: '',
      note: '',
      items: [
        {
          name: 'Category one',
          items: [{ name: 'Item', description: 'Description', price: '₹—', tag: '' }],
        },
      ],
    },
  },

  gallery: {
    type: 'gallery',
    label: 'Gallery',
    icon: 'images',
    description: 'Photos of your work, space or products.',
    libraryGroup: 'Content',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      {
        key: 'layout',
        label: 'Layout',
        kind: 'select',
        options: [
          { label: 'Grid', value: 'grid' },
          { label: 'Mosaic', value: 'mosaic' },
          { label: 'Strip', value: 'strip' },
        ],
      },
      listOf(
        [
          { key: 'image', label: 'Image', kind: 'image' },
          { key: 'caption', label: 'Caption', kind: 'text' },
        ],
        'Images',
      ),
    ],
    defaults: {
      eyebrow: 'Gallery',
      heading: 'A look around',
      sub: '',
      layout: 'grid',
      items: [
        { image: '', caption: 'Photo one' },
        { image: '', caption: 'Photo two' },
        { image: '', caption: 'Photo three' },
      ],
    },
  },

  pricing: {
    type: 'pricing',
    label: 'Pricing',
    icon: 'tag',
    description: 'Plans and packages side by side.',
    libraryGroup: 'Convert',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      { key: 'note', label: 'Footnote', kind: 'text' },
      listOf(
        [
          { key: 'name', label: 'Plan', kind: 'text' },
          { key: 'price', label: 'Price', kind: 'text' },
          { key: 'period', label: 'Period', kind: 'text' },
          { key: 'description', label: 'Description', kind: 'text' },
          { key: 'features', label: 'Features (one per line)', kind: 'textarea' },
          { key: 'ctaLabel', label: 'Button label', kind: 'text' },
          { key: 'ctaHref', label: 'Button link', kind: 'link' },
          { key: 'highlight', label: 'Highlight this plan', kind: 'toggle' },
        ],
        'Plans',
      ),
    ],
    defaults: {
      eyebrow: 'Pricing',
      heading: 'Simple, honest pricing',
      sub: '',
      note: '',
      items: [
        { name: 'Basic', price: '₹—', period: '', description: '', features: 'Feature one\nFeature two', ctaLabel: 'Enquire', ctaHref: '/contact', highlight: false },
      ],
    },
  },

  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    icon: 'quote',
    description: 'Reviews from real customers — the fastest way to build trust.',
    libraryGroup: 'Convert',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      {
        key: 'layout',
        label: 'Layout',
        kind: 'select',
        options: [
          { label: 'Cards', value: 'cards' },
          { label: 'Large quote', value: 'feature' },
        ],
      },
      listOf(
        [
          { key: 'quote', label: 'Quote', kind: 'textarea' },
          { key: 'name', label: 'Name', kind: 'text' },
          { key: 'role', label: 'Context', kind: 'text' },
          { key: 'rating', label: 'Rating (1-5)', kind: 'number', min: 1, max: 5 },
        ],
        'Reviews',
      ),
    ],
    defaults: {
      eyebrow: 'Reviews',
      heading: 'What customers say',
      sub: '',
      layout: 'cards',
      items: [{ quote: 'Great service and fair pricing.', name: 'Customer name', role: '', rating: 5 }],
    },
  },

  hours: {
    type: 'hours',
    label: 'Business hours',
    icon: 'clock',
    description: 'Opening times with a live “open now” indicator.',
    libraryGroup: 'Contact',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'note', label: 'Note', kind: 'text' },
      { key: 'showNow', label: 'Show open/closed badge', kind: 'toggle' },
      listOf(
        [
          { key: 'day', label: 'Day', kind: 'text' },
          { key: 'hours', label: 'Hours', kind: 'text' },
        ],
        'Rows',
      ),
      { key: 'image', label: 'Image', kind: 'image' },
    ],
    defaults: {
      eyebrow: 'Opening hours',
      heading: 'When we are open',
      note: '',
      showNow: true,
      items: [{ day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM' }],
      image: '',
    },
  },

  team: {
    type: 'team',
    label: 'Team',
    icon: 'users',
    description: 'Introduce the people customers will meet.',
    libraryGroup: 'Content',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      listOf(
        [
          { key: 'name', label: 'Name', kind: 'text' },
          { key: 'role', label: 'Role', kind: 'text' },
          { key: 'bio', label: 'Short bio', kind: 'textarea' },
          { key: 'image', label: 'Photo', kind: 'image' },
        ],
        'Members',
      ),
    ],
    defaults: {
      eyebrow: 'Our team',
      heading: 'The people behind the work',
      sub: '',
      items: [{ name: 'Team member', role: 'Role', bio: '', image: '' }],
    },
  },

  stats: {
    type: 'stats',
    label: 'Stats band',
    icon: 'bar-chart',
    description: 'A quick band of proof numbers.',
    libraryGroup: 'Convert',
    fields: [
      listOf(
        [
          { key: 'value', label: 'Value', kind: 'text' },
          { key: 'label', label: 'Label', kind: 'text' },
        ],
        'Stats',
      ),
      {
        key: 'variant',
        label: 'Style',
        kind: 'select',
        options: [
          { label: 'Accent band', value: 'band' },
          { label: 'Quiet row', value: 'inline' },
        ],
      },
    ],
    defaults: {
      items: [
        { value: '10+', label: 'Years experience' },
        { value: '500+', label: 'Happy customers' },
        { value: '4.9', label: 'Average rating' },
      ],
      variant: 'band',
    },
  },

  faq: {
    type: 'faq',
    label: 'FAQ',
    icon: 'help-circle',
    description: 'Answer the questions you get on every call.',
    libraryGroup: 'Content',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      listOf(
        [
          { key: 'q', label: 'Question', kind: 'text' },
          { key: 'a', label: 'Answer', kind: 'textarea' },
        ],
        'Questions',
      ),
    ],
    defaults: {
      eyebrow: 'FAQ',
      heading: 'Questions we get asked',
      sub: '',
      items: [{ q: 'Do you take bookings?', a: 'Yes — call or message us and we will confirm.' }],
    },
  },

  cta: {
    type: 'cta',
    label: 'Call to action',
    icon: 'megaphone',
    description: 'A bold band that pushes visitors to act.',
    libraryGroup: 'Convert',
    fields: [
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      { key: 'primaryLabel', label: 'Primary button', kind: 'text' },
      { key: 'primaryHref', label: 'Primary link', kind: 'link' },
      { key: 'secondaryLabel', label: 'Secondary button', kind: 'text' },
      { key: 'secondaryHref', label: 'Secondary link', kind: 'link' },
      {
        key: 'variant',
        label: 'Style',
        kind: 'select',
        options: [
          { label: 'Solid accent', value: 'solid' },
          { label: 'Dark panel', value: 'dark' },
          { label: 'Soft card', value: 'soft' },
        ],
      },
    ],
    defaults: {
      heading: 'Ready to get started?',
      sub: 'Tell us what you need and we will get back to you the same day.',
      primaryLabel: 'Get in touch',
      primaryHref: '/contact',
      secondaryLabel: '',
      secondaryHref: '',
      variant: 'solid',
    },
  },

  contact: {
    type: 'contact',
    label: 'Contact',
    icon: 'phone',
    description: 'Contact details, enquiry form, WhatsApp and map.',
    libraryGroup: 'Contact',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'heading', label: 'Heading', kind: 'text' },
      { key: 'sub', label: 'Supporting text', kind: 'textarea' },
      { key: 'phone', label: 'Phone', kind: 'text' },
      { key: 'whatsapp', label: 'WhatsApp number', kind: 'text' },
      { key: 'email', label: 'Email', kind: 'text' },
      { key: 'address', label: 'Address', kind: 'textarea' },
      { key: 'showForm', label: 'Show enquiry form', kind: 'toggle' },
      { key: 'formTitle', label: 'Form heading', kind: 'text' },
      { key: 'mapEmbed', label: 'Show Google Map', kind: 'toggle' },
      { key: 'mapQuery', label: 'Map search text', kind: 'text', help: 'e.g. your business name and area.' },
      { key: 'responseNote', label: 'Response note', kind: 'text' },
    ],
    defaults: {
      eyebrow: 'Contact',
      heading: 'Come say hello',
      sub: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      showForm: true,
      formTitle: 'Send an enquiry',
      mapEmbed: true,
      mapQuery: '',
      responseNote: 'We usually reply within a few hours.',
    },
  },

  footer: {
    type: 'footer',
    label: 'Footer',
    icon: 'panel-bottom',
    description: 'Bottom bar with links, social and copyright.',
    libraryGroup: 'Core',
    fields: [
      { key: 'brand', label: 'Brand', kind: 'text' },
      { key: 'tagline', label: 'Tagline', kind: 'textarea' },
      { key: 'phone', label: 'Phone', kind: 'text' },
      { key: 'email', label: 'Email', kind: 'text' },
      { key: 'address', label: 'Address', kind: 'text' },
      listOf(
        [
          { key: 'title', label: 'Column title', kind: 'text' },
          {
            key: 'links',
            label: 'Links',
            kind: 'list',
            itemFields: [
              { key: 'label', label: 'Label', kind: 'text' },
              { key: 'href', label: 'Link', kind: 'link' },
            ],
          },
        ],
        'Columns',
      ),
      { key: 'instagram', label: 'Instagram URL', kind: 'text' },
      { key: 'facebook', label: 'Facebook URL', kind: 'text' },
      { key: 'whatsappUrl', label: 'WhatsApp link', kind: 'text' },
      { key: 'copyright', label: 'Copyright line', kind: 'text' },
    ],
    defaults: {
      brand: 'Your Business',
      tagline: 'Serving customers with care.',
      phone: '',
      email: '',
      address: '',
      items: [],
      instagram: '',
      facebook: '',
      whatsappUrl: '',
      copyright: `© ${new Date().getFullYear()} Your Business`,
    },
  },
};

export const SECTION_LIST = Object.values(SECTION_DEFS);

export const DEFAULT_SPACING: Spacing = {
  paddingY: 'lg',
  paddingX: 'md',
  width: 1200,
  align: 'left',
};

export const PADDING_Y: Record<Spacing['paddingY'], string> = {
  sm: '4.5rem',
  md: 'auto',
  lg: 'auto',
  xl: 'auto',
};

export function sectionPaddingY(scale: Spacing['paddingY']) {
  return { sm: 0.7, md: 1, lg: 1.25, xl: 1.6 }[scale];
}

export function sectionPaddingX(scale: Spacing['paddingX']) {
  return { sm: 0.7, md: 1, lg: 1.4 }[scale];
}

export function sectionFields(type: SectionType): FieldDef[] {
  return SECTION_DEFS[type]?.fields ?? [];
}

export function sectionLabel(type: SectionType): string {
  return SECTION_DEFS[type]?.label ?? type;
}
