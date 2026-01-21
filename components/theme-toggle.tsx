'use client';

import { useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import type { ThemeMode } from '@/lib/types';
import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY, cn } from '@/lib/utils';

const THEME_SCRIPT = `
  const doc = document.documentElement;
  doc.classList.remove("light");
  doc.classList.add("dark");
  localStorage.setItem("${THEME_STORAGE_KEY}", "dark");
`
  .trim()
  .replace(/\n/g, '')
  .replace(/\s+/g, ' ');

function applyTheme(theme: ThemeMode) {
  const doc = document.documentElement;

  doc.classList.remove('dark', 'light');
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  if (theme === 'system') {
    if (window.matchMedia(THEME_MEDIA_QUERY).matches) {
      doc.classList.add('dark');
    } else {
      doc.classList.add('light');
    }
  } else {
    doc.classList.add(theme);
  }
}

interface ThemeToggleProps {
  className?: string;
}

export function ApplyThemeScript() {
  return <script id="theme-script">{THEME_SCRIPT}</script>;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  useEffect(() => {
    applyTheme('dark');
  }, []);

  return (
    <div className={cn('hidden', className)} aria-hidden="true">
      <span className="sr-only">Color scheme toggle</span>
      <button type="button" className="cursor-pointer p-1 pl-1.5">
        <MoonIcon size={16} weight="bold" />
      </button>
      <button type="button" className="cursor-pointer px-1.5 py-1">
        <SunIcon size={16} weight="bold" />
      </button>
      <button type="button" className="cursor-pointer p-1 pr-1.5">
        <MonitorIcon size={16} weight="bold" />
      </button>
    </div>
  );
}
