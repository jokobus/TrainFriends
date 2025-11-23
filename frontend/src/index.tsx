import React from "react";
import "leaflet/dist/leaflet.css";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline/CssBaseline";
import Frame from "./routes/Frame";
import ErrorPage from "./error-page";
import { ProtectedRoute } from "./ProtectedRoute";
import { Signup } from "./routes/Signup";
import { Login } from "./routes/Login";
import { HomeRoute } from "./routes/HomeRoute";
import { FriendsRequestWidget } from "./widgets/FriendsRequestWidget";
import { FriendsWidget } from "./widgets/FriendsWidget";
import { AuthProvider } from "./providers/auth";
import { AppThemeProvider } from "./providers/theme";
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { registerPlugin } from "@capacitor/core";
import { LocationProvider } from "./providers/location";

// // Rickroll banner
const banner = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣶⣿⣿⣿⣿⣿⣿⣿⣷⣶⣆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀
⠀⣤⣄⠀⢠⣤⢤⣤⣤⣤⣄⣤⣤⡄⢠⣤⣤⣤⣤⣤⣄⣤⣤⣤⣄⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣿⣶⣷⠀⠀⠀
⠀⣿⣿⣧⣈⡿⢹⣿⠏⡝⠟⢿⣿⡅⣼⠏⢸⣿⢉⡙⠇⣿⡟⣽⣿⠀⠀⣿⣿⣿⠟⠉⠀⠀⠀⠉⠁⠀⠀⠀⠙⢿⣿⣿⠀⠀⠀
⠀⣿⢿⡿⣿⡇⢸⣿⢾⡇⠀⢸⣿⣷⡟⠀⣼⣿⢾⠃⢠⣿⡷⣿⣏⠀⠀⣿⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⡄⠀⠀
⣰⣿⡀⠻⣶⢇⣾⣿⣈⣴⠇⠘⣶⡞⠀⢀⣷⣇⣈⣼⣻⣿⡁⣿⣿⡀⠀⣿⣿⣇⣤⠶⠶⣶⣆⠀⢠⣴⣤⣤⡀⠀⠿⣻⠃⠀⠀
⠙⠛⠁⠀⠙⠈⠉⠉⠉⠛⠀⠀⠙⠀⠀⠈⠉⠉⠉⠋⠙⠛⠁⠙⠛⠁⠀⢻⣿⠈⠁⠞⠛⠛⠀⠀⠻⡛⠻⠿⠧⠀⢀⠇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠟⡻⡄⠀⠀⠀⠀⢀⣀⣀⠁⠀⠀⠀⠀⣰⣵⠀⠀⠀
⠀⢀⣤⣤⣤⠀⢀⣤⣤⡀⢠⣤⡀⠀⣤⣤⣤⣄⠀⢠⣤⡄⠀⣠⡄⠀⠈⢆⠁⢿⠀⠀⠀⠀⠉⠛⠛⠛⠀⠀⠀⠀⡿⡝⠀⠀⠀
⣰⣿⠋⠹⣿⢠⣿⠋⢿⣿⡌⣿⣿⣆⢹⡏⢻⣿⣷⡈⣿⠁⢀⣿⣿⡄⠀⠈⠣⣼⡄⠀⠀⢴⣶⣿⣻⣷⠤⠀⠀⣸⠜⠀⠀⠀⠀
⣿⣿⢠⣴⣶⣿⣿⡀⢸⣿⡇⣿⢿⣿⣿⡇⣿⡿⣿⣿⣿⠀⣼⣉⣿⣇⠀⠀⠀⠘⣿⡆⠀⠀⠳⠭⠽⠵⠀⠀⢠⠋⠀⠀⠀⠀⠀
⠻⣿⣦⣿⡟⢸⣿⣧⣼⡿⣸⣿⡀⢻⣿⢇⣿⣇⠙⣿⡇⣰⣟⠛⣿⣿⡄⠀⠀⣸⡇⠻⣦⣄⣀⣀⣠⡀⠀⠀⣸⠀⠀⠀⠀⠀⠀
⠀⠙⠛⠋⠀⠀⠙⠛⠋⠀⠙⠛⠁⠀⠙⠈⠛⠁⠀⠈⠋⠛⠋⠈⠛⠛⠁⠀⠀⣿⣷⡄⠈⢻⣿⣿⣿⣷⣾⣿⣿⡄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⣦⠼⠿⠿⠿⠿⠿⣿⣿⡷⠀⠀⠀⠀⠀
⠀⠀⣀⣠⣀⡀⣀⣀⣀⣀⣀⡀⣀⣀⣀⣀⣀⣠⠀⠀⣀⣀⣀⣀⣀⡀⢀⣀⣀⡀⣀⣀⣀⣀⣀⡀⠀⣀⣀⣀⢀⣀⣀⣀⣀⣀⡀
⢀⣾⣿⠋⢿⠇⢹⣿⡏⢹⣿⡇⣽⠏⢹⣿⢫⡽⠃⠀⠙⢿⣯⣾⠋⣴⣿⠋⣿⣷⢹⣿⠏⠘⣿⠁⠀⢹⣿⡏⠈⣿⠉⣿⡏⣿⣿
⢸⣿⣇⢶⣶⣶⣸⣿⠃⠈⣿⣷⡟⠀⣼⣿⢻⢧⡀⠀⠀⢸⣿⡇⢰⣿⣿⢀⣿⡿⣾⣿⠀⢸⡿⠀⠀⣼⣿⠀⢰⡿⢰⣿⡿⠟⠃
⠀⠻⠿⠿⠛⠱⠿⠿⠆⠀⠹⠟⠀⠰⠿⠿⠶⠿⠃⠀⠀⠿⠿⠗⠀⠻⠿⠾⠟⠁⠙⠿⠿⠿⠃⠀⠀⠙⠿⠿⠿⠁⠿⠿⠷⠀⠀
`;
console.log(
  `%c${banner}`,
  "color: #007bff; font-family: monospace; font-size: 1.5em",
);
console.log(
  "%cWelcome to the console! If you're here, you probably know what you're doing. If you don't, be careful!",
  "color: #007bff; font-family: monospace; font-size: 1em",
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Frame>
        <Outlet />
      </Frame>
    ),
    errorElement: (
      <Frame>
        <ErrorPage />
      </Frame>
    ),
    children: [
      ProtectedRoute({
        path: "/",
        element: <Outlet />,
        children: [
          { index: true, element: <HomeRoute /> },
          { path: "friends", element: <FriendsWidget /> },
          { path: "friendReqs", element: <FriendsRequestWidget /> },
        ],
      }),
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <AppThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <RouterProvider router={router} />
        </LocationProvider>
      </AuthProvider>
    </AppThemeProvider>
  </React.StrictMode>,
);

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);

function guess_location(callback: (x: any) => void, timeout: number) {
  let last_location: any;
  BackgroundGeolocation.addWatcher(
    {
      backgroundMessage: "Cancel to prevent battery drain.",
      backgroundTitle: "Tracking location.",
      requestPermissions: true,
      stale: false,
    },
    function (location) {
      last_location = location || undefined;
    },
  ).then(function (id) {
    setTimeout(function () {
      callback(last_location);
    }, timeout);
  });
}

guess_location((location) => console.log(location), 1000);
