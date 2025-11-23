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
        <MapWidget locations={friendLocations} />
      </StandardCard>
    </Stack>
  );
};
