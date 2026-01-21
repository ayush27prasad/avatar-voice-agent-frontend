'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      offset={16}
      gap={8}
      icons={{
        warning: <WarningIcon weight="bold" />,
      }}
      toastOptions={{
        closeButton: true,
        classNames: {
          toast: 'group toast group-[.toaster]:border-2 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-md',
          description: 'group-[.toast]:text-sm group-[.toast]:opacity-90',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          closeButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground hover:group-[.toast]:bg-muted/80',
          success: 'group-[.toaster]:border-green-500/50',
          error: 'group-[.toaster]:border-red-500/50',
          info: 'group-[.toaster]:border-blue-500/50',
          warning: 'group-[.toaster]:border-amber-500/50',
        },
        duration: 4000,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
