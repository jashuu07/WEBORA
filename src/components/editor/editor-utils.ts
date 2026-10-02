import type { Page, Section, Website } from '@/types';

/** Immutable path get/set used by inline editing and the inspector. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export function setPath<T>(source: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const clone: unknown = Array.isArray(source) ? [...(source as unknown[])] : { ...(source as object) };
  let cursor = clone as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const current = cursor[key];
    cursor[key] = Array.isArray(current) ? [...current] : { ...(current as object) };
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return clone as T;
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function removeItem<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function updatePage(website: Website, pageId: string, mutate: (page: Page) => Page): Website {
  return {
    ...website,
    pages: website.pages.map((page) => (page.id === pageId ? mutate(page) : page)),
    updatedAt: new Date().toISOString(),
  };
}

export function updateSection(
  website: Website,
  pageId: string,
  sectionId: string,
  mutate: (section: Section) => Section,
): Website {
  return updatePage(website, pageId, (page) => ({
    ...page,
    sections: page.sections.map((section) => (section.id === sectionId ? mutate(section) : section)),
    updatedAt: new Date().toISOString(),
  }));
}

export function cloneSection(section: Section): Section {
  return {
    ...structuredClone(section),
    id: `${section.type}_${Math.random().toString(36).slice(2, 10)}`,
    label: section.label,
  };
}

export function countWords(website: Website): number {
  const text = JSON.stringify(website.pages.map((p) => p.sections.map((s) => s.props)));
  return text.split(/\s+/).length;
}

export function deviceLabel(device: 'desktop' | 'tablet' | 'mobile') {
  return device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Mobile';
}
