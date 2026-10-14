import { COLORS } from "../constants/theme";
import { useColorScheme } from "./useColorScheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof COLORS.light & keyof typeof COLORS.dark
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return COLORS[theme][colorName];
}
