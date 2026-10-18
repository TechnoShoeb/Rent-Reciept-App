import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeId = 
  | 'cyber-emerald' 
  | 'midnight-sapphire' 
  | 'cyberpunk-amethyst' 
  | 'solar-gold' 
  | 'titanium-stealth' 
  | 'nordic-frost';

export interface AppTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  
  // Backgrounds
  background: string;
  cardBg: string;
  cardGradient: [string, string];
  inputBg: string;
  borderColor: string;
  cardBorder: string;

  // Accents & Branding
  primary: string;
  primaryLight: string;
  primaryGradient: [string, string];
  primaryBtnText: string;
  secondaryAccent: string;
  badgeBg: string;
  badgeText: string;
  
  // Feature colors
  electricityAccent: string;
  electricityBg: string;
  waterAccent: string;
  rentAccent: string;
  
  // Header, Floating bar, Modal
  headerBg: string;
  headerBorder: string;
  floatingBarBg: string;
  floatingBorder: string;
  modalBg: string;
  modalHeaderBg: string;
  modalHeaderBorder: string;

  // Text Colors
  text: string;
  textSecondary: string;
  textMuted: string;

  // Swatch colors for settings preview
  previewSwatches: [string, string, string];
}

export const THEMES: Record<ThemeId, AppTheme> = {
  'cyber-emerald': {
    id: 'cyber-emerald',
    name: 'Cyber Emerald',
    tagline: 'FinTech Neon (Default)',
    isDark: true,
    background: '#08080a',
    cardBg: '#16161a',
    cardGradient: ['#16161a', '#222228'],
    inputBg: '#121215',
    borderColor: '#2a2a32',
    cardBorder: '#282834',
    primary: '#00e676',
    primaryLight: '#00ab5b',
    primaryGradient: ['#00e676', '#00ab5b'],
    primaryBtnText: '#000000',
    secondaryAccent: '#0a84ff',
    badgeBg: 'rgba(0, 230, 118, 0.15)',
    badgeText: '#00e676',
    electricityAccent: '#ffd60a',
    electricityBg: 'rgba(255, 214, 10, 0.12)',
    waterAccent: '#0a84ff',
    rentAccent: '#00e676',
    headerBg: '#121216',
    headerBorder: '#1f1f24',
    floatingBarBg: 'rgba(8, 8, 10, 0.95)',
    floatingBorder: '#1c1c22',
    modalBg: '#08080a',
    modalHeaderBg: '#141418',
    modalHeaderBorder: '#24242c',
    text: '#ffffff',
    textSecondary: '#a0a0a8',
    textMuted: '#666672',
    previewSwatches: ['#08080a', '#16161a', '#00e676'],
  },

  'midnight-sapphire': {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    tagline: 'Stripe & Vercel Blue',
    isDark: true,
    background: '#070b14',
    cardBg: '#0e172a',
    cardGradient: ['#0e172a', '#172545'],
    inputBg: '#0b1220',
    borderColor: '#1e293b',
    cardBorder: '#1e293b',
    primary: '#38bdf8',
    primaryLight: '#0284c7',
    primaryGradient: ['#38bdf8', '#0284c7'],
    primaryBtnText: '#000000',
    secondaryAccent: '#60a5fa',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#38bdf8',
    electricityAccent: '#38bdf8',
    electricityBg: 'rgba(56, 189, 248, 0.12)',
    waterAccent: '#60a5fa',
    rentAccent: '#38bdf8',
    headerBg: '#0c1322',
    headerBorder: '#1e293b',
    floatingBarBg: 'rgba(7, 11, 20, 0.95)',
    floatingBorder: '#172545',
    modalBg: '#070b14',
    modalHeaderBg: '#0e172a',
    modalHeaderBorder: '#1e293b',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    previewSwatches: ['#070b14', '#0e172a', '#38bdf8'],
  },

  'cyberpunk-amethyst': {
    id: 'cyberpunk-amethyst',
    name: 'Cyberpunk Amethyst',
    tagline: 'Arc & Raycast Violet',
    isDark: true,
    background: '#090611',
    cardBg: '#150e26',
    cardGradient: ['#150e26', '#22163d'],
    inputBg: '#120b22',
    borderColor: '#2d1f47',
    cardBorder: '#2d1f47',
    primary: '#c084fc',
    primaryLight: '#9333ea',
    primaryGradient: ['#c084fc', '#9333ea'],
    primaryBtnText: '#ffffff',
    secondaryAccent: '#ec4899',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    badgeText: '#c084fc',
    electricityAccent: '#f43f5e',
    electricityBg: 'rgba(244, 63, 94, 0.12)',
    waterAccent: '#818cf8',
    rentAccent: '#c084fc',
    headerBg: '#110a20',
    headerBorder: '#241638',
    floatingBarBg: 'rgba(9, 6, 17, 0.95)',
    floatingBorder: '#22163d',
    modalBg: '#090611',
    modalHeaderBg: '#150e26',
    modalHeaderBorder: '#2d1f47',
    text: '#ffffff',
    textSecondary: '#cbd5e1',
    textMuted: '#7c6f93',
    previewSwatches: ['#090611', '#150e26', '#c084fc'],
  },

  'solar-gold': {
    id: 'solar-gold',
    name: 'Solar Amber',
    tagline: 'Revolut Metal & Gold',
    isDark: true,
    background: '#0d0b08',
    cardBg: '#1a150e',
    cardGradient: ['#1a150e', '#292116'],
    inputBg: '#14100a',
    borderColor: '#352a1a',
    cardBorder: '#3d301e',
    primary: '#fbbf24',
    primaryLight: '#d97706',
    primaryGradient: ['#fbbf24', '#d97706'],
    primaryBtnText: '#000000',
    secondaryAccent: '#10b981',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    badgeText: '#fbbf24',
    electricityAccent: '#f59e0b',
    electricityBg: 'rgba(245, 158, 11, 0.12)',
    waterAccent: '#38bdf8',
    rentAccent: '#fbbf24',
    headerBg: '#14100b',
    headerBorder: '#282014',
    floatingBarBg: 'rgba(13, 11, 8, 0.95)',
    floatingBorder: '#292116',
    modalBg: '#0d0b08',
    modalHeaderBg: '#1a150e',
    modalHeaderBorder: '#352a1a',
    text: '#ffffff',
    textSecondary: '#d6d3d1',
    textMuted: '#78716c',
    previewSwatches: ['#0d0b08', '#1a150e', '#fbbf24'],
  },

  'titanium-stealth': {
    id: 'titanium-stealth',
    name: 'Titanium Stealth',
    tagline: 'Nothing OS Monochromatic',
    isDark: true,
    background: '#000000',
    cardBg: '#121212',
    cardGradient: ['#121212', '#1f1f1f'],
    inputBg: '#141414',
    borderColor: '#282828',
    cardBorder: '#2e2e2e',
    primary: '#ffffff',
    primaryLight: '#e5e5ea',
    primaryGradient: ['#ffffff', '#cccccc'],
    primaryBtnText: '#000000',
    secondaryAccent: '#ff3b30',
    badgeBg: 'rgba(255, 255, 255, 0.15)',
    badgeText: '#ffffff',
    electricityAccent: '#ff453a',
    electricityBg: 'rgba(255, 69, 58, 0.14)',
    waterAccent: '#ffffff',
    rentAccent: '#ffffff',
    headerBg: '#0d0d0d',
    headerBorder: '#1f1f1f',
    floatingBarBg: 'rgba(0, 0, 0, 0.96)',
    floatingBorder: '#1f1f1f',
    modalBg: '#000000',
    modalHeaderBg: '#121212',
    modalHeaderBorder: '#282828',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    textMuted: '#52525b',
    previewSwatches: ['#000000', '#1f1f1f', '#ffffff'],
  },

  'nordic-frost': {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    tagline: 'Clean Scandinavian Light',
    isDark: false,
    background: '#f8fafc',
    cardBg: '#ffffff',
    cardGradient: ['#ffffff', '#f1f5f9'],
    inputBg: '#ffffff',
    borderColor: '#cbd5e1',
    cardBorder: '#e2e8f0',
    primary: '#059669',
    primaryLight: '#047857',
    primaryGradient: ['#10b981', '#059669'],
    primaryBtnText: '#ffffff',
    secondaryAccent: '#0284c7',
    badgeBg: 'rgba(5, 150, 105, 0.12)',
    badgeText: '#059669',
    electricityAccent: '#d97706',
    electricityBg: 'rgba(217, 119, 6, 0.1)',
    waterAccent: '#0284c7',
    rentAccent: '#059669',
    headerBg: '#ffffff',
    headerBorder: '#e2e8f0',
    floatingBarBg: 'rgba(248, 250, 252, 0.96)',
    floatingBorder: '#cbd5e1',
    modalBg: '#f8fafc',
    modalHeaderBg: '#ffffff',
    modalHeaderBorder: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    previewSwatches: ['#f8fafc', '#ffffff', '#059669'],
  },
};

interface ThemeContextType {
  theme: AppTheme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => Promise<void>;
  availableThemes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES['cyber-emerald'],
  themeId: 'cyber-emerald',
  setThemeId: async () => {},
  availableThemes: Object.values(THEMES),
});

const THEME_STORAGE_KEY = 'appTheme_v1';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setCurrentThemeId] = useState<ThemeId>('cyber-emerald');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved in THEMES)) {
          setCurrentThemeId(saved as ThemeId);
        }
      } catch (e) {
        console.log('Error loading theme', e);
      }
    };
    loadTheme();
  }, []);

  const setThemeId = async (id: ThemeId) => {
    if (THEMES[id]) {
      setCurrentThemeId(id);
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
      } catch (e) {
        console.log('Error saving theme', e);
      }
    }
  };

  const theme = THEMES[themeId] || THEMES['cyber-emerald'];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId,
        setThemeId,
        availableThemes: Object.values(THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
