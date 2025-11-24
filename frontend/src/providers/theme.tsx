import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
// font (already in dependencies)
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

type ThemeContextType = {
  mode: "light" | "dark";
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleMode: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("themeMode");
      if (stored === "dark" || stored === "light") return stored;
    } catch (e) {
      /* ignore */
    }
    // prefer dark if user agent prefers dark
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (e) {}
    return "light";
  });

  useEffect(() => {
    try {
      localStorage.setItem("themeMode", mode);
    } catch (e) {}
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  const theme = useMemo(() => {
    // subtle gradient choices per mode
    const primaryGradient =
      mode === "dark"
        ? "linear-gradient(135deg,#4f83cc 0%, #90caf9 100%)"
        : "linear-gradient(135deg,#0b66ff 0%, #7c4dff 100%)";

    const appBarGradient =
      mode === "dark"
        ? "linear-gradient(180deg, rgba(15,23,42,0.6), rgba(7,10,18,0.6))"
        : "linear-gradient(180deg, rgba(11,102,255,0.12), rgba(124,77,255,0.06))";

    const base = createTheme({
      palette: {
        mode,
        primary: {
          main: mode === "dark" ? "#4f83cc" : "#0b66ff",
          contrastText: "#fff",
        },
        secondary: { main: mode === "dark" ? "#9f7bff" : "#7c4dff" },
        background: {
          default: mode === "dark" ? "#05060a" : "#f6f8fb",
          paper: mode === "dark" ? "#0f1216" : "#ffffff",
        },
        text: {
          primary: mode === "dark" ? "#e6eef8" : "#0b1b2b",
          secondary: mode === "dark" ? "#9fb4c8" : "#425466",
        },
      },
      shape: { borderRadius: 12 },
      spacing: 8,
      typography: {
        fontFamily: ['Roboto', 'Inter', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'].join(","),
        h1: { fontWeight: 700, letterSpacing: '-0.02em' },
        h2: { fontWeight: 700, letterSpacing: '-0.01em' },
        h3: { fontWeight: 600 },
        body1: { fontWeight: 400 },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            // small global helpers for gradient accents
            '#root': {
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
            },
          },
        },
        MuiAppBar: {
          defaultProps: { elevation: 3 },
          styleOverrides: {
            root: {
              backdropFilter: 'blur(6px)',
              backgroundClip: 'padding-box',
              backgroundImage: appBarGradient,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: { textTransform: 'none', borderRadius: 10, padding: '6px 14px' },
            containedPrimary: {
              color: '#fff',
              backgroundImage: primaryGradient,
              boxShadow: '0 8px 24px rgba(11,102,255,0.12)',
              transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 14px 36px rgba(11,102,255,0.18)',
                filter: 'brightness(1.03)'
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              transition: 'transform 220ms ease, box-shadow 220ms ease',
              '&:hover': { transform: 'translateY(-6px)', boxShadow: mode === 'dark' ? '0 18px 60px rgba(2,6,23,0.6)' : '0 12px 36px rgba(18,30,80,0.08)' },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow: mode === 'dark' ? '0 6px 20px rgba(2,6,23,0.6)' : '0 6px 20px rgba(18,30,80,0.06)',
              transition: 'transform 220ms ease, box-shadow 220ms ease',
              '&:hover': { transform: 'translateY(-6px)', boxShadow: mode === 'dark' ? '0 22px 66px rgba(2,6,23,0.6)' : '0 14px 42px rgba(18,30,80,0.08)' },
            },
          },
        },
        MuiBottomNavigation: {
          styleOverrides: {
            root: {
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              boxShadow: mode === 'dark' ? '0 -6px 20px rgba(2,6,23,0.6)' : '0 -6px 20px rgba(18,30,80,0.04)'
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: { transition: 'transform 160ms ease', '&:active': { transform: 'scale(0.96)' } },
          },
        },
      },
    });

    return responsiveFontSizes(base);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default AppThemeProvider;
