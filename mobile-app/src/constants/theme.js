// Stitch Design System Tokens (Single Source of Truth: stitch_kabadiwala_connect_ui_design/kabadiwala_connect/DESIGN.md)

export const THEME = {
  colors: {
    // Stitch Palette
    primary: '#003b1b', // Brand Primary (Stitch Primary)
    primaryContainer: '#14532d', // Deep Forest Green
    onPrimary: '#ffffff',
    onPrimaryContainer: '#87c695',
    primaryLight: '#16a34a', // Emerald
    primaryBg: '#f0fdf4',
    
    secondary: '#006e2d', // Stitch Secondary
    secondaryContainer: '#7cf994',
    onSecondary: '#ffffff',
    secondaryBg: '#fffbeb',
    
    tertiary: '#203800',
    tertiaryContainer: '#315100',
    accentLime: '#84cc16', // Fresh Lime Accent

    surface: '#f9faf5', // Stitch Warm Off-White
    surfaceContainerLowest: '#ffffff', // Clean White Card
    surfaceContainerLow: '#f3f4ef',
    surfaceContainer: '#edeee9',
    surfaceContainerHigh: '#e7e9e4',
    surfaceContainerHighest: '#e2e3de',
    
    background: '#f9faf5',
    card: '#ffffff',
    
    onSurface: '#1a1c19', // High Contrast Text
    onSurfaceVariant: '#404941', // Secondary Text
    outline: '#717970',
    outlineVariant: '#c0c9be',
    border: '#e2e8e3',
    borderStrong: '#c0c9be',
    
    text: '#1a1c19',
    textSecondary: '#404941',
    textMuted: '#717970',
    
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
    
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    info: '#2563eb',
    infoBg: '#eff6ff'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 20,
    full: 9999
  },
  typography: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    numericLg: 32,
    numericXl: 44
  }
};

// Backend enum values (utils/constants.js MATERIAL_CATEGORIES) mapped 1:1 to the
// display labels / icons / order used by the Stitch "कबाड़ चुनें" (Screen 05) grid.
// `id` MUST stay identical to the backend enum — never rename it.
export const MATERIAL_CATEGORIES = [
  {
    id: 'CRT',
    labelKey: 'cat_crt',
    titleKey: 'mat_crt_title',
    subKey: 'mat_crt_sub',
    emoji: '📺',
    icon: 'tv',
    color: '#64748b',
    benchmark: '₹15/KG',
    order: 1
  },
  {
    id: 'LCD',
    labelKey: 'cat_lcd',
    titleKey: 'mat_lcd_title',
    subKey: 'mat_lcd_sub',
    emoji: '🖥️',
    icon: 'desktop_windows',
    color: '#3b82f6',
    benchmark: '₹45/KG',
    order: 2
  },
  {
    id: 'PCB',
    labelKey: 'cat_pcb',
    titleKey: 'mat_pcb_title',
    subKey: 'mat_pcb_sub',
    emoji: '📟',
    icon: 'memory',
    color: '#10b981',
    benchmark: '₹280/KG',
    order: 3
  },
  {
    id: 'CABLE',
    labelKey: 'cat_cable',
    titleKey: 'mat_cable_title',
    subKey: 'mat_cable_sub',
    emoji: '🔌',
    icon: 'cable',
    color: '#f59e0b',
    benchmark: '₹160/KG',
    order: 4
  },
  {
    id: 'BATTERY',
    labelKey: 'cat_battery',
    titleKey: 'mat_battery_title',
    subKey: 'mat_battery_sub',
    emoji: '🔋',
    icon: 'battery_charging_full',
    color: '#ef4444',
    benchmark: '₹95/KG',
    order: 5
  },
  {
    id: 'MOTOR',
    labelKey: 'cat_motor',
    titleKey: 'mat_motor_title',
    subKey: 'mat_motor_sub',
    emoji: '⚙️',
    icon: 'settings',
    color: '#8b5cf6',
    benchmark: '₹110/KG',
    order: 6
  },
  {
    id: 'MAGNET',
    labelKey: 'cat_magnet',
    titleKey: 'mat_magnet_title',
    subKey: 'mat_magnet_sub',
    emoji: '🧲',
    icon: 'attractions',
    color: '#ec4899',
    benchmark: '₹75/KG',
    order: 7
  },
  {
    id: 'MIXED_PLASTIC',
    labelKey: 'cat_plastic',
    titleKey: 'mat_plastic_title',
    subKey: 'mat_plastic_sub',
    emoji: '♻️',
    icon: 'recycling',
    color: '#06b6d4',
    benchmark: '₹18/KG',
    order: 8
  },
  {
    id: 'OTHER',
    labelKey: 'cat_other',
    titleKey: 'mat_other_title',
    subKey: 'mat_other_sub',
    emoji: '📦',
    icon: 'inventory_2',
    color: '#94a3b8',
    benchmark: '₹20/KG',
    order: 9
  }
];

// Screen 05 grid order, exactly as authored in the Stitch mock.
export const MATERIAL_GRID_ORDER = [...MATERIAL_CATEGORIES]
  .sort((a, b) => a.order - b.order)
  .map((category) => category.id);

export const CONDITIONS = [
  { id: 'GOOD', labelKey: 'cond_good', multiplier: 1.05 },
  { id: 'USED', labelKey: 'cond_used', multiplier: 1.0 },
  { id: 'DAMAGED', labelKey: 'cond_damaged', multiplier: 0.9 },
  { id: 'MIXED', labelKey: 'cond_mixed', multiplier: 0.95 }
];

export const SOURCE_TYPES = [
  { id: 'HOUSEHOLD', labelKey: 'src_household' },
  { id: 'SHOP', labelKey: 'src_shop' },
  { id: 'OFFICE', labelKey: 'src_office' },
  { id: 'SCRAP_COLLECTION', labelKey: 'src_scrap' },
  { id: 'OTHER', labelKey: 'src_other' }
];

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';