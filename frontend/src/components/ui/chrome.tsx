import type { ReactNode } from 'react';
import { cn } from './utils';

/** Premium chrome tokens — visual only; no tldraw logic */
export const chrome = {
  panel:
    'rounded-2xl border border-white/[0.09] bg-zinc-950/65 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.05] transition-all duration-300 ease-out hover:border-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
  panelPadding: 'p-5',
  panelHeader:
    'text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 mb-4 font-ui',
  sectionLabel:
    'text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500 mb-2.5 block font-ui',
  floatingBar:
    'rounded-2xl border border-white/[0.1] bg-zinc-950/70 backdrop-blur-3xl shadow-[0_16px_48px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-inset ring-white/[0.06]',
  topChip:
    'rounded-xl border border-white/[0.09] bg-zinc-950/60 backdrop-blur-3xl shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-inset ring-white/[0.05] transition-all duration-300 hover:border-white/[0.14]',
  input:
    'w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-zinc-100 placeholder:text-zinc-600 outline-none font-ui transition-all duration-200 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/15 hover:border-white/[0.14] hover:bg-white/[0.04]',
  inputReadonly:
    'w-full px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-zinc-400 font-mono cursor-default',
  iconBtn:
    'p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all duration-200',
  ghostBtn:
    'px-3.5 py-2 rounded-xl text-sm font-medium font-ui text-zinc-300 hover:text-white hover:bg-white/[0.07] active:scale-[0.98] transition-all duration-200',
  primaryBtn:
    'px-4 py-2.5 rounded-xl text-sm font-medium font-ui text-blue-200 bg-blue-500/12 border border-blue-500/25 hover:bg-blue-500/22 hover:border-blue-400/35 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] active:scale-[0.98] transition-all duration-200',
  dropdown:
    'min-w-[228px] bg-zinc-950/90 backdrop-blur-3xl border border-white/[0.09] rounded-xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/[0.06]',
  dropdownItem:
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui text-zinc-300 hover:bg-white/[0.08] hover:text-white cursor-pointer outline-none transition-all duration-150 data-[highlighted]:bg-white/[0.08] data-[highlighted]:text-white',
  outlineItem:
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-ui text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-all duration-200 group',
} as const;

export function ChromePanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(chrome.panel, chrome.panelPadding, 'font-ui', className)}>
      {title ? <h3 className={chrome.panelHeader}>{title}</h3> : null}
      {children}
    </div>
  );
}
