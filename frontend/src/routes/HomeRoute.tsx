import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { StandardCard } from "../widgets/StandardCard";
import { useAuthedState } from "../ProtectedRoute";
import { MapWidget } from "../widgets/MapWidget";
import { useLocation } from "../providers/location";


export const HomeRoute = () => {
  const { userName } = useAuthedState();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const {
    locationState: { userLocation, friendLocations },
  } = useLocation();

  const combined_locations = useMemo(() => {
    // friendLocations is typed as LocationUser[]; produce the same shape for the current user
    const entries = Array.isArray(friendLocations) ? [...friendLocations] : [];

    if (userLocation && typeof userLocation.latitude === "number") {
      const timestamp = new Date().toISOString();
      const hasMe = entries.some((e) => e && (e as any).username === "me");
      if (!hasMe) {
        const me = {
          username: "me",
          location: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          ts: timestamp,
        } as any;
        entries.unshift(me);
      }
    }

    return entries;
  }, [friendLocations, userLocation]);

  ///////////////////
  // Expose for quick debugging: attach to window and also log when it changes.
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__combined_locations = combined_locations;
      // also expose friend/user locations for quick inspection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__friendLocations = friendLocations;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__userLocation = userLocation;
    } catch (e) {
      /* ignore if window isn't writable in some test envs */
    }
    // Also log to browser console so you can see updates in devtools
    // (These logs appear in the browser console, not the terminal running the dev server.)
    // If you need terminal output, see suggestions below.
    // eslint-disable-next-line no-console
    console.log("combined_locations:", combined_locations);
    // eslint-disable-next-line no-console
    console.log("friendLocations:", friendLocations);
    // eslint-disable-next-line no-console
    console.log("userLocation:", userLocation);
  }, [combined_locations, friendLocations, userLocation]);
  /////////////////////

  return (
    <Stack spacing={2} alignItems="center">
      <StandardCard>
        <Typography variant="h4" align="center" gutterBottom sx={{ p: 2 }}>
          {greeting}, {userName}!
        </Typography>
        <Typography variant="body1" sx={{ pb: 2, px: 3 }}>
          Welcome to <b>TrainFriends</b> — find friends that are riding the same
          train as you and connect for a nice chat.
        </Typography>
      </StandardCard>

      <StandardCard
        sx={{
          width: 1000,
          maxWidth: "100%",
          "@media (max-width:1200px)": { width: "90vw", maxWidth: 1000 },
        }}
      >
        <Typography variant="h6" align="center" sx={{ p: 1 }} gutterBottom>
          Nearby friends
        </Typography>
        <MapWidget locations={combined_locations} />
      </StandardCard>
    </Stack>
  );
};
