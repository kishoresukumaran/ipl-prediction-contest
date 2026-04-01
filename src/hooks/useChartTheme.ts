'use client';

import { useTheme } from 'next-themes';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    axis: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
    label: isDark ? '#94a3b8' : '#475569',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    tooltipText: isDark ? '#ffffff' : '#1e293b',
    // "wrong/missed" segment fill for stacked bars — visible on both themes
    barWrong: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
    isDark,
  };
}
