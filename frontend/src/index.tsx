import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline/CssBaseline";
import Frame from "./routes/Frame";
import ErrorPage from "./error-page";
import { ProtectedRoute } from "./ProtectedRoute";
import { Signup } from "./routes/Signup";
import { Login } from "./routes/Login";
import HomeRoute from "./routes/HomeRoute";
import { FriendsRequestWidget } from "./widgets/FriendsRequestWidget";
import { FriendsWidget } from "./widgets/FriendsWidget";
import { AuthProvider } from "./providers/auth";

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
    <CssBaseline enableColorScheme />
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
