import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline/CssBaseline";

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

// Setup anti XSRF-TOKEN. See also
// https://github.com/haskell-servant/servant/tree/master/servant-auth
/* {
 *   // Get the XSRF token from cookies
 *   const token = (() => {
 *     const match = document.cookie.match(new RegExp("XSRF-TOKEN=([^;]+)"));
 *     return match ? match[1] : null;
 *   })();
 *
 *   // Add a request interceptor
 *   axios.interceptors.request.use(
 *     (config) => {
 *       if (token) {
 *         // Set the XSRF token header
 *         config.headers["X-XSRF-TOKEN"] = token;
 *       }
 *       return config;
 *     },
 *     (error) => {
 *       return Promise.reject(error);
 *     },
 *   );
 * } */
// https://reactrouter.com/en/main/start/tutorial
const router = createBrowserRouter([
  {
    path: "/",
    // element: (
    //   <Frame>
    //     <Outlet />
    //   </Frame>
    // ),
    // errorElement: (
    //   <Frame>
    //     <ErrorPage />
    //   </Frame>
    // ),
    children: [],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <CssBaseline enableColorScheme />
    <RouterProvider router={router} />
  </React.StrictMode>,
);
