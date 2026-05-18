import type { ReactNode } from 'react';
import { cn } from './utils';

export const glassCard =
  'bg-[#0A0A0A]/80 backdrop-blur-[20px] border border-white/10 rounded-2xl shadow-2xl overflow-hidden';

export const glassCardInset =
  'bg-[#0A0A0A]/80 backdrop-blur-[20px] border border-white/10 rounded-xl shadow-2xl';

export function FloatingCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(glassCard, className)}>{children}</div>;
}

export function PropertyCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(glassCardInset, 'p-4 w-full shrink-0', className)}>
      <h4 className="text-white/80 text-sm font-medium mb-3 font-ui tracking-tight">{title}</h4>
      {children}
    </div>
  );
}
