'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: ToastTone; duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(({ title, description, tone = 'info', duration = 4000 }) => {
    const id = `t_${Math.random().toString(36).slice(2, 9)}`;
    setItems((prev) => [...prev.slice(-3), { id, title, description, tone, duration }]);
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(92vw,380px)] flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(timer);
  }, [item.duration, onDismiss]);

  const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? AlertTriangle : Info;

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto animate-fade-up rounded-xl border bg-white p-3.5 shadow-[0_4px_8px_rgba(18,20,24,.05),0_32px_64px_-32px_rgba(18,20,24,.4)]',
        item.tone === 'error' ? 'border-red-200' : item.tone === 'success' ? 'border-emerald-200' : 'border-[var(--line)]',
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0',
            item.tone === 'success' ? 'text-emerald-600' : item.tone === 'error' ? 'text-red-600' : 'text-[var(--accent)]',
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.85rem] font-semibold text-[var(--text)]">{item.title}</p>
          {item.description ? (
            <p className="mt-0.5 text-[0.8rem] leading-relaxed text-[var(--text-muted)]">{item.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded-md p-1 text-[#a8a29a] transition hover:bg-[#f4f2ee] hover:text-[var(--text)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
