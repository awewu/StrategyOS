/**
 * Ruud Brand Toolkit R3b (Jan 2025) → StratOS semantic mapping.
 * Source: RHM5839A-ENT-2024-Ruud-Brand-Toolkit-R3b-Digital.pdf
 */

/** Official Ruud palette (hex from toolkit). */
export const ruudToolkit = {
  primary: {
    red: "#E4002B",
    pms: "185 C",
  },
  secondary: {
    tealBlue: "#007681",
    pms: "7474 C",
  },
  tertiary: {
    cyan: "#00AEEF",
    steelBlue: "#3F585A",
    darkRed: "#76232F",
    lightGray: "#B1B3B3",
    black: "#000000",
  },
  typography: {
    body: "Roboto, Aptos, system-ui, sans-serif",
    headline: '"A Love of Thunder", Roboto, sans-serif',
  },
} as const;

/**
 * StratOS usage — executive shell (not consumer marketing layouts).
 */
export const ruudStratosMap = {
  /** Logo lockup, nav active bar, primary CTA, brand emphasis */
  brandPrimary: ruudToolkit.primary.red,
  /** Links, tabs, focus rings, secondary actions */
  interactive: ruudToolkit.secondary.tealBlue,
  /** Optional highlights (sparingly) */
  accentCyan: ruudToolkit.tertiary.cyan,
  /** Body text, nav labels */
  textSteel: ruudToolkit.tertiary.steelBlue,
  /** Risk, veto, critical alerts */
  signalRisk: ruudToolkit.tertiary.darkRed,
  /** Page canvas */
  canvasGray: "#F5F5F5",
  /** Cards */
  surfaceWhite: "#FFFFFF",
} as const;
