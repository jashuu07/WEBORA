'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Wand2, LayoutTemplate } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextInput, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { INDUSTRY_LABELS } from '@/lib/templates/catalog';
import type { IndustryId } from '@/types';

/**
 * "New website" entry points.
 *  - Create  → the guided wizard (recommended)
 *  - Sample  → runs the real generator on an example business
 *  - Blank   → an empty-but-structured site for manual building
 */
export function NewSiteButtons({
  variant = 'default',
  label,
}: {
  variant?: 'default' | 'outline';
  label?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [blankOpen, setBlankOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [blank, setBlank] = useState({ name: '', industry: 'general' as IndustryId });

  async function post(body: Record<string, unknown>, key: string, successMessage: string) {
    setBusy(key);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not create the website.');
      toast({ title: successMessage, description: `“${json.data.website.name}” has been created.`, tone: 'success' });
      router.push(`/editor/${json.data.website.id}`);
    } catch (error) {
      toast({ title: 'Something went wrong', description: (error as Error).message, tone: 'error' });
    } finally {
      setBusy(null);
    }
  }

  if (variant === 'outline') {
    return (
      <>
        <Button
          variant="outline"
          loading={busy === 'sample'}
          onClick={() => post({ mode: 'sample' }, 'sample', 'Sample website generated')}
          icon={<Wand2 className="h-4 w-4" />}
        >
          {label ?? 'Load a sample website'}
        </Button>
      </>
    );
  }

  return (
    <>
      <ButtonLink href="/create" icon={<Plus className="h-4 w-4" />}>
        New website
      </ButtonLink>
      <Button
        variant="outline"
        loading={busy === 'sample'}
        onClick={() => post({ mode: 'sample' }, 'sample', 'Sample website generated')}
        icon={<Wand2 className="h-4 w-4" />}
      >
        Try a sample
      </Button>
      <Button variant="ghost" onClick={() => setBlankOpen(true)} icon={<LayoutTemplate className="h-4 w-4" />}>
        Start blank
      </Button>

      <Modal
        open={blankOpen}
        onClose={() => setBlankOpen(false)}
        title="Start from a blank site"
        description="You get the full page structure (Home, About, Services, Gallery, Contact), ready for you to fill in yourself."
        footer={
          <>
            <Button variant="ghost" onClick={() => setBlankOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={busy === 'blank'}
              onClick={() => post({ mode: 'blank', ...blank }, 'blank', 'Blank website created')}
            >
              Create blank site
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Business name"
            required
            placeholder="My Business"
            value={blank.name}
            onChange={(e) => setBlank((b) => ({ ...b, name: e.target.value }))}
          />
          <Select
            label="Industry"
            hint="sets the starting content library"
            value={blank.industry}
            onChange={(e) => setBlank((b) => ({ ...b, industry: e.target.value as IndustryId }))}
          >
            {(Object.keys(INDUSTRY_LABELS) as IndustryId[]).map((id) => (
              <option key={id} value={id}>
                {INDUSTRY_LABELS[id]}
              </option>
            ))}
          </Select>
        </div>
      </Modal>
    </>
  );
}
