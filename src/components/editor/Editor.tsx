'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DesignTokens, Page, Section, SectionType, StyleId, Website } from '@/types';
import { SiteRenderer } from '@/components/site/SiteRenderer';
import type { SectionAction } from '@/components/site/SectionContext';
import { EditorTopbar } from './EditorTopbar';
import { LeftRail, type RailTab } from './LeftRail';
import { Inspector } from './Inspector';
import { PreviewFrame, type Device } from './PreviewFrame';
import { PublishDialog } from './PublishDialog';
import { cloneSection, moveItem, removeItem, setPath, updatePage, updateSection } from './editor-utils';
import { SECTION_DEFS } from '@/lib/sections/schemas';
import { getStyle } from '@/lib/design/styles';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { StockLibraryContext } from './image-library';
import type { StockImage } from '@/lib/media/stock';

type SaveState = 'saved' | 'saving' | 'dirty' | 'error';

export function Editor({
  initialWebsite,
  libraryImages,
}: {
  initialWebsite: Website;
  /** Stock images verified to exist on disk (resolved on the server). */
  libraryImages: StockImage[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [website, setWebsite] = useState<Website>(initialWebsite);
  const [pageId, setPageId] = useState<string>(initialWebsite.pages[0].id);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialWebsite.pages[0].sections.find((s) => s.type === 'hero')?.id ?? null,
  );
  const [selectedField, setSelectedField] = useState<{ sectionId: string; key: string } | null>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [railTab, setRailTab] = useState<RailTab>('sections');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string>(initialWebsite.updatedAt);
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  const history = useRef<Page[][]>([initialWebsite.pages]);
  const historyIndex = useRef(0);
  const [, forceRender] = useState(0);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const page = useMemo(
    () => website.pages.find((p) => p.id === pageId) ?? website.pages[0],
    [website.pages, pageId],
  );
  const selectedSection = useMemo(
    () => page?.sections.find((s) => s.id === selectedSectionId) ?? null,
    [page, selectedSectionId],
  );

  /* ---------------------------------------------------------------------- */
  /*  Change tracking + history                                             */
  /* ---------------------------------------------------------------------- */

  const apply = useCallback(
    (next: Website, options: { history?: boolean } = { history: true }) => {
      setWebsite(next);
      dirtyRef.current = true;
      setSaveState('dirty');

      if (options.history !== false) {
        const snapshot = next.pages;
        history.current = [...history.current.slice(0, historyIndex.current + 1), snapshot].slice(-40);
        historyIndex.current = history.current.length - 1;
        forceRender((n) => n + 1);
      }
    },
    [],
  );

  const undo = useCallback(() => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    const pages = history.current[historyIndex.current];
    setWebsite((prev) => ({ ...prev, pages }));
    dirtyRef.current = true;
    setSaveState('dirty');
    forceRender((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    const pages = history.current[historyIndex.current];
    setWebsite((prev) => ({ ...prev, pages }));
    dirtyRef.current = true;
    setSaveState('dirty');
    forceRender((n) => n + 1);
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Autosave                                                              */
  /* ---------------------------------------------------------------------- */

  const save = useCallback(
    async (payload?: Partial<Website>) => {
      setSaveState('saving');
      try {
        const body = {
          pages: (payload?.pages ?? website.pages) as unknown,
          name: payload?.name ?? website.name,
          slug: payload?.slug ?? website.slug,
          styleId: payload?.styleId ?? website.styleId,
          tokens: payload?.tokens ?? website.tokens,
          settings: payload?.settings ?? website.settings,
          business: payload?.business ?? website.business,
          seo: payload?.seo ?? website.seo,
        };
        const res = await fetch(`/api/sites/${website.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'Save failed.');
        setWebsite((prev) => ({ ...json.data.website, ...prev, slug: json.data.website.slug, updatedAt: json.data.website.updatedAt }));
        setLastSavedAt(json.data.savedAt ?? new Date().toISOString());
        dirtyRef.current = false;
        setSaveState('saved');
      } catch (error) {
        setSaveState('error');
        toast({ title: 'We could not save', description: (error as Error).message, tone: 'error' });
      }
    },
    [website, toast],
  );

  useEffect(() => {
    if (!dirtyRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [website, save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Keyboard shortcuts                                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) {
        if (event.key === 'Escape') {
          setSelectedSectionId(null);
          setSelectedField(null);
        }
        return;
      }
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.key.toLowerCase() === 'z' && event.shiftKey) || event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save();
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setPublishOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, save]);

  /* ---------------------------------------------------------------------- */
  /*  Section helpers                                                       */
  /* ---------------------------------------------------------------------- */

  const scrollToSection = useCallback((sectionId: string) => {
    const frames = Array.from(document.querySelectorAll('iframe'));
    for (const frame of frames) {
      const node = frame.contentDocument?.getElementById(`sec-${sectionId}`);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  }, []);

  const selectSection = useCallback(
    (sectionId: string | null) => {
      if (!sectionId) {
        setSelectedSectionId(null);
        setSelectedField(null);
        setRightOpen(false);
        return;
      }
      setSelectedSectionId(sectionId);
      setRailTab('sections');
      setRightOpen(true);
      scrollToSection(sectionId);
    },
    [scrollToSection],
  );

  const handleText = useCallback(
    (sectionId: string, path: string, value: string) => {
      apply(
        updateSection(website, page.id, sectionId, (section) => ({
          ...section,
          props: setPath(section.props, path, value) as Record<string, unknown>,
        })),
      );
    },
    [apply, website, page?.id],
  );

  const setProps = useCallback(
    (path: string, value: unknown) => {
      if (!selectedSection) return;
      apply(
        updateSection(website, page.id, selectedSection.id, (section) => ({
          ...section,
          props: setPath(section.props, path, value) as Record<string, unknown>,
        })),
      );
    },
    [apply, website, page?.id, selectedSection],
  );

  const mutateSection = useCallback(
    (mutate: (section: Section) => Section) => {
      if (!selectedSection) return;
      apply(updateSection(website, page.id, selectedSection.id, mutate));
    },
    [apply, website, page?.id, selectedSection],
  );

  const moveSection = useCallback(
    (sectionId: string, direction: -1 | 1) => {
      const index = page.sections.findIndex((s) => s.id === sectionId);
      const target = index + direction;
      if (index <= 0 || target <= 0 || target >= page.sections.length - 1) return;
      apply(
        updatePage(website, page.id, (current) => ({
          ...current,
          sections: moveItem(current.sections, index, target),
        })),
      );
    },
    [apply, website, page],
  );

  /** Visibility toggle — the alternative to deleting structural sections. */
  const hideSection = useCallback(
    (sectionId: string) => {
      const target = page.sections.find((s) => s.id === sectionId);
      if (!target) return;
      apply(
        updateSection(website, page.id, sectionId, (section) => ({ ...section, visible: !section.visible })),
      );
      toast({
        title: target.visible ? `${target.label || target.type} hidden` : `${target.label || target.type} shown`,
        description: target.visible
          ? 'It stays in your draft — bring it back any time from the Pages & sections rail.'
          : undefined,
        tone: 'info',
      });
    },
    [apply, website, page, toast],
  );


  const duplicateSection = useCallback(
    (sectionId: string) => {
      const index = page.sections.findIndex((s) => s.id === sectionId);
      if (index < 0) return;
      const copy = cloneSection(page.sections[index]);
      apply(
        updatePage(website, page.id, (current) => {
          const sections = [...current.sections];
          sections.splice(index + 1, 0, copy);
          return { ...current, sections };
        }),
      );
      setSelectedSectionId(copy.id);
    },
    [apply, website, page],
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      const target = page.sections.find((s) => s.id === sectionId);
      if (!target || target.type === 'nav' || target.type === 'footer') {
        toast({ title: 'Navigation and footer are structural', description: 'Hide them instead of deleting.', tone: 'info' });
        return;
      }
      apply(
        updatePage(website, page.id, (current) => ({
          ...current,
          sections: removeItem(current.sections, current.sections.findIndex((s) => s.id === sectionId)),
        })),
      );
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
        setSelectedField(null);
      }
    },
    [apply, website, page, selectedSectionId, toast],
  );

  /**
   * Contextual toolbar actions from the canvas. Every one of them routes into an
   * existing, undoable mutation — the toolbar is a shortcut, not a second
   * implementation of the editor.
   */
  const sectionAction = useCallback(
    (action: SectionAction, sectionId: string) => {
      switch (action) {
        case 'up':
          moveSection(sectionId, -1);
          break;
        case 'down':
          moveSection(sectionId, 1);
          break;
        case 'duplicate':
          duplicateSection(sectionId);
          break;
        case 'hide':
          hideSection(sectionId);
          break;
        case 'delete':
          deleteSection(sectionId);
          break;
        case 'settings':
          setSelectedSectionId(sectionId);
          setRailTab('sections');
          setRightOpen(true);
          break;
      }
    },
    [moveSection, duplicateSection, hideSection, deleteSection],
  );

  const addSection = useCallback(
    (type: SectionType) => {
      const definition = SECTION_DEFS[type];
      if (!definition) return;
      const created: Section = {
        id: `${type}_${Math.random().toString(36).slice(2, 10)}`,
        type,
        variant: undefined,
        visible: true,
        label: definition.label,
        spacing: { paddingY: 'lg', paddingX: 'md', width: 1200, align: 'left' },
        props: structuredClone(definition.defaults),
      };

      // Give the new section real content from the same page when possible.
      const donor = page.sections.find((s) => s.type === type);
      if (donor) created.props = structuredClone(donor.props);

      apply(
        updatePage(website, page.id, (current) => {
          const footerIndex = current.sections.findIndex((s) => s.type === 'footer');
          const sections = [...current.sections];
          sections.splice(footerIndex >= 0 ? footerIndex : sections.length, 0, created);
          return { ...current, sections };
        }),
      );
      setSelectedSectionId(created.id);
      setRailTab('sections');
      toast({ title: `${definition.label} added`, tone: 'success' });
    },
    [apply, website, page, toast],
  );

  /* ---------------------------------------------------------------------- */
  /*  Pages                                                                 */
  /* ---------------------------------------------------------------------- */

  const addPage = useCallback(
    async (input: { title: string; slug: string; inNav: boolean; preset: 'blank' | 'about' | 'services' | 'gallery' | 'contact' }) => {
      try {
        const res = await fetch(`/api/sites/${website.id}/pages`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not add the page.');
        setWebsite(json.data.website);
        history.current = [json.data.website.pages];
        historyIndex.current = 0;
        setPageId(json.data.page.id);
        setSelectedSectionId(null);
        setSaveState('saved');
        toast({ title: 'Page added', description: `“${input.title}” is ready to edit.`, tone: 'success' });
      } catch (error) {
        toast({ title: 'Could not add the page', description: (error as Error).message, tone: 'error' });
        throw error;
      }
    },
    [website.id, toast],
  );

  const deletePage = useCallback(
    async (targetId: string) => {
      try {
        const res = await fetch(`/api/sites/${website.id}/pages?pageId=${targetId}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not delete the page.');
        setWebsite(json.data.website);
        history.current = [json.data.website.pages];
        historyIndex.current = 0;
        setPageId(json.data.website.pages[0].id);
        setSelectedSectionId(null);
        toast({ title: 'Page deleted', tone: 'info' });
      } catch (error) {
        toast({ title: 'Could not delete the page', description: (error as Error).message, tone: 'error' });
      }
    },
    [website.id, toast],
  );

  /* ---------------------------------------------------------------------- */
  /*  Theme & settings                                                      */
  /* ---------------------------------------------------------------------- */

  const applyTokens = useCallback(
    (patch: Partial<DesignTokens>) => {
      const tokens = { ...website.tokens, ...patch };
      apply(
        {
          ...website,
          tokens,
          settings: {
            ...website.settings,
            primaryColor: tokens.accent,
            accentColor: tokens.accent,
            fontPair: tokens.headingFont,
          },
        },
        { history: false },
      );
    },
    [apply, website],
  );

  const applyStyle = useCallback(
    (styleId: StyleId) => {
      const preset = getStyle(styleId);
      apply(
        {
          ...website,
          styleId,
          tokens: preset.tokens,
          settings: { ...website.settings, primaryColor: preset.tokens.accent, accentColor: preset.tokens.accent },
        },
        { history: false },
      );
      toast({ title: `${preset.name} applied`, description: 'Every section updated to the new preset.', tone: 'success' });
    },
    [apply, website, toast],
  );

  const updateSettings = useCallback(
    (patch: Record<string, unknown>) => {
      apply({ ...website, settings: { ...website.settings, ...patch } }, { history: false });
    },
    [apply, website],
  );

  const updateWebsiteMeta = useCallback(
    (patch: Partial<Website>) => {
      apply({ ...website, ...patch }, { history: false });
    },
    [apply, website],
  );

  const updatePageMutate = useCallback(
    (mutate: (page: Page) => Page) => {
      apply(updatePage(website, page.id, mutate), { history: false });
    },
    [apply, website, page?.id],
  );

  /* ---------------------------------------------------------------------- */
  /*  AI rewrite                                                            */
  /* ---------------------------------------------------------------------- */

  const aiRewrite = useCallback(
    async (instruction: string) => {
      if (!selectedSection) return;
      setAiBusy(true);
      try {
        // Save first so the AI rewrite operates on the current content.
        await save();
        const res = await fetch('/api/ai/section', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            siteId: website.id,
            pageId: page.id,
            sectionId: selectedSection.id,
            instruction,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error ?? 'Rewrite failed.');
        setWebsite(json.data.website);
        history.current = [...history.current, json.data.website.pages];
        historyIndex.current = history.current.length - 1;
        setSaveState('saved');
        toast({ title: 'Section rewritten', description: json.data.engineLabel, tone: 'success' });
      } catch (error) {
        toast({ title: 'Rewrite failed', description: (error as Error).message, tone: 'error' });
      } finally {
        setAiBusy(false);
      }
    },
    [selectedSection, website.id, page?.id, save, toast],
  );

  /* ---------------------------------------------------------------------- */
  /*  Publish / delete                                                      */
  /* ---------------------------------------------------------------------- */

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      if (dirtyRef.current) await save();
      const res = await fetch(`/api/sites/${website.id}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Publishing failed.');
      setWebsite((prev) => ({ ...prev, status: 'published', publishedAt: json.data.website.publishedAt, slug: json.data.website.slug }));
      toast({ title: 'Website published', description: `Live at ${json.data.url}`, tone: 'success' });
      router.refresh();
      return { url: json.data.url as string };
    } catch (error) {
      toast({ title: 'Publishing failed', description: (error as Error).message, tone: 'error' });
      return undefined;
    } finally {
      setPublishing(false);
    }
  }, [save, website.id, toast, router]);

  const deleteWebsite = useCallback(async () => {
    const res = await fetch(`/api/sites/${website.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error ?? 'Delete failed.');
    router.push('/dashboard');
    router.refresh();
  }, [website.id, router]);

  return (
    <StockLibraryContext.Provider value={libraryImages}>
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--surface-sunken)]">
      <EditorTopbar
        website={website}
        device={device}
        onDevice={setDevice}
        saveState={saveState}
        lastSavedAt={lastSavedAt}
        canUndo={historyIndex.current > 0}
        canRedo={historyIndex.current < history.current.length - 1}
        onUndo={undo}
        onRedo={redo}
        onPublish={() => setPublishOpen(true)}
        publishing={publishing}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={() => setLeftOpen((v) => !v)}
        onToggleRight={() => setRightOpen((v) => !v)}
      />

      <div className="flex min-h-0 flex-1">
        {/* Left rail */}
        <aside
          className={cn(
            'z-30 w-[290px] shrink-0 border-r border-[var(--line)] bg-white',
            'absolute inset-y-14 left-0 top-14 shadow-[var(--shadow-lg)] xl:static xl:inset-auto xl:shadow-none',
            leftOpen ? 'block' : 'hidden xl:block',
          )}
        >
          <LeftRail
            website={website}
            page={page}
            selectedSectionId={selectedSectionId}
            tab={railTab}
            onTab={setRailTab}
            onSelectPage={(id) => {
              setPageId(id);
              setSelectedSectionId(null);
              setLeftOpen(false);
            }}
            onSelectSection={(id) => selectSection(id)}
            onAddSection={addSection}
            onAddPage={addPage}
            onDeletePage={deletePage}
            onPageChange={updatePageMutate}
            onSectionChange={(sectionId, mutate) => apply(updateSection(website, page.id, sectionId, mutate))}
            onMoveSection={moveSection}
            onDuplicateSection={duplicateSection}
            onDeleteSection={deleteSection}
            onTokens={applyTokens}
            onStyle={applyStyle}
            onSettings={updateSettings}
            onWebsite={updateWebsiteMeta}
            onDeleteWebsite={deleteWebsite}
          />
        </aside>

        {/* Canvas */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[var(--surface-sunken)] p-3 sm:p-4">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(rgba(16,17,20,.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="relative h-full">
            <PreviewFrame
              device={device}
              onBackgroundClick={() => {
                setSelectedSectionId(null);
                setSelectedField(null);
              }}
            >
              <SiteRenderer
                website={website}
                page={page}
                editable
                selectedSectionId={selectedSectionId}
                hoveredSectionId={hoveredSectionId}
                onSelectSection={(id) => {
                  if (!id) {
                    setSelectedSectionId(null);
                    setSelectedField(null);
                    return;
                  }
                  setSelectedSectionId(id);
                  setRailTab('sections');
                }}
                onHoverSection={setHoveredSectionId}
                onSelectField={(sectionId, key) => setSelectedField({ sectionId, key })}
                onText={handleText}
                onSectionAction={sectionAction}
              />
            </PreviewFrame>
          </div>

          <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
            <span className="glass rounded-full px-3.5 py-1.5 text-[0.74rem] font-medium text-[var(--text-muted)]">
              Click any text to edit · {page.title} · {device}
            </span>
          </div>
        </div>

        {/* Inspector */}
        <aside
          className={cn(
            'z-30 w-[320px] shrink-0 border-l border-[var(--line)] bg-white',
            'absolute inset-y-14 right-0 top-14 shadow-[var(--shadow-lg)] 2xl:static 2xl:inset-auto 2xl:shadow-none',
            rightOpen ? 'block' : 'hidden 2xl:block',
          )}
        >
          <Inspector
            website={website}
            page={page}
            section={selectedSection}
            selectedField={selectedField}
            onField={(key) => selectedSection && setSelectedField({ sectionId: selectedSection.id, key })}
            onProps={setProps}
            onSection={mutateSection}
            onDelete={() => selectedSection && deleteSection(selectedSection.id)}
            onDuplicate={() => selectedSection && duplicateSection(selectedSection.id)}
            onMove={(direction) => selectedSection && moveSection(selectedSection.id, direction)}
            onAiRewrite={aiRewrite}
            aiBusy={aiBusy}
            onPageChange={updatePageMutate}
            onAddSection={() => setRailTab('add')}
          />
        </aside>
      </div>

      <PublishDialog
        website={website}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublish={publish}
        publishing={publishing}
      />
      </div>
    </StockLibraryContext.Provider>
  );
}
