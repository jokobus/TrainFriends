import {
  Box,
  Button,
  IconButton,
  Popover,
  Tooltip,
  useTheme,
  Typography,
} from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { useAuthState, useAuth } from "../providers/auth";
import { useLocation, useNavigate } from "react-router";
import { LinkWidget } from "./LinkWidget";

import HelpIcon from "@mui/icons-material/Help";
import QrCodeIcon from "@mui/icons-material/QrCode";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import logo from "../assets/logo.png";
import PopupState, { bindPopover, bindTrigger } from "material-ui-popup-state";
import { QRCodeSVG } from "qrcode.react";
import { useAppTheme } from "../providers/theme";

// see https://mui.com/material-ui/react-app-bar/
// see https://mui.com/material-ui/react-app-bar/#fixed-placement about placement

export const AppBarWidget = () => {
  const { isAuthenticated } = useAuthState();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleMode } = useAppTheme();

  const navToLogin = () => {
    navigate("/login", {
      state: { from: location.pathname },
      replace: true,
    });
  };

  const loginButton = (
    <Button
      color="inherit"
      onClick={() => {
        navToLogin();
      }}
    >
      Login
    </Button>
  );
  const { logout } = useAuth();
  const loggedinBarActions = (
    <Button
      color="inherit"
      onClick={async () => {
        try {
          await logout();
        } finally {
          // navigate to login or home after logout
          navigate("/login", { replace: true });
        }
      }}
      sx={{ textTransform: "none" }}
    >
      Logout
    </Button>
  );

  return (
    <AppBar color="primary" style={{ zIndex: 1000, position: "sticky" }}>
      <Toolbar>
        <LinkWidget to={"/"}>
          <img src={logo} alt="Logo" style={{ height: 40, marginRight: 16 }} />
        </LinkWidget>
        {
          undefined
          // Takes too much space
          /* <LinkWidget to={"/"}>
          <Typography variant="h6">TrainFriends</Typography>
        </LinkWidget> */
        }
        <Box sx={{ flexGrow: 1 }} />

        <PopupState variant="popover" popupId="qrcode-popover">
          {(popupState) => (
            <>
              <IconButton {...bindTrigger(popupState)} aria-label="qrcode">
                <QrCodeIcon />
              </IconButton>
              <Popover
                {...bindPopover(popupState)}
                onClick={() => popupState.close()}
              >
                <QRCodeSVG
                  value={window.location.href}
                  fgColor={theme.palette.primary.main}
                  style={{ display: "block" }}
                />
              </Popover>
            </>
          )}
        </PopupState>
  {isAuthenticated ? loggedinBarActions : loginButton}
        {/* Single icon toggle for dark mode (sun/moon) */}
        <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              onClick={() => toggleMode()}
              color="inherit"
              aria-label="toggle theme"
              sx={{ p: 0, width: 40, height: 40 }}
            >
              <Box sx={{ position: "relative", width: 24, height: 24 }}>
                {/* moon icon (dark mode) */}
                <Brightness4Icon
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transition: "all 240ms cubic-bezier(.2,.8,.2,1)",
                    opacity: mode === "dark" ? 0 : 1,
                    transform:
                      mode === "dark"
                        ? "translateY(-6px) scale(0.8) rotate(-18deg)"
                        : "translateY(0) scale(1) rotate(0)",
                    fontSize: 20,
                  }}
                />
                {/* sun icon (light mode) */}
                <Brightness7Icon
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transition: "all 240ms cubic-bezier(.2,.8,.2,1)",
                    opacity: mode === "dark" ? 1 : 0,
                    transform:
                      mode === "dark"
                        ? "translateY(0) scale(1) rotate(0)"
                        : "translateY(6px) scale(0.8) rotate(18deg)",
                    fontSize: 20,
                  }}
                />
              </Box>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
