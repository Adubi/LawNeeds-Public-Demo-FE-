export const COLORS = {
  light: {
    primary: "#033126",
    secondary: "#dd8550",
    background: "#ffffff",
    card: "#ffffff",
    text: "#000000",
    subtext: "#666666",
    border: "#bcbcbc",
    inputBackground: "#fdeae2",
    messageBackground: "#f0f0f0",
    success: "#52C41A",
    error: "#FF4D4F",
    white: "#ffffff",
    pink: "#FFE1E1",
    green: "#E7F7E7",
    gray: {
      50: "#F7F7F7",
      100: "#E5E5E5",
      200: "#D4D4D4",
      300: "#A3A3A3",
      400: "#737373",
      500: "#525252",
    },
  },
  dark: {
    primary: "#033126",
    secondary: "#dd8550",
    background: "#1A1A1A",
    card: "#2D2D2D",
    pink: "#4A2828",
    text: "#FFFFFF",
    subtext: "#A0A0A0",
    green: "#1C3F1C",
    border: "#404040",
    inputBackground: "#333333",
    messageBackground: "#404040",
    success: "#52C41A",
    error: "#FF4D4F",
    white: "#ffffff",
    gray: {
      50: "#292929",
      100: "#333333",
      200: "#404040",
      300: "#737373",
      400: "#A3A3A3",
      500: "#D4D4D4",
    },
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
} as const;

export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;
