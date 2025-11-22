import { Stack, Typography } from "@mui/material";
import { useMemo, useEffect, useState } from "react";
import { StandardCard } from "../widgets/StandardCard";
import { useAuthedState } from "../ProtectedRoute";
import Map from "../widgets/Map";
import MapTest from "../widgets/MapTest";

export const HomeRoute = () => {
  const { userName } = useAuthedState();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <Stack spacing={2} alignItems="center">
      <StandardCard>
        <Typography variant="h4" align="center" gutterBottom sx={{ p: 2 }}>
          {greeting}, {userName}!
        </Typography>
        <Typography variant="body1" sx={{ pb: 2, px: 3 }}>
          Welcome to <b>TrainFriends</b> — find friends that are riding the same train as you and connect for a nice chat. 
        </Typography>
      </StandardCard>
      <StandardCard>
        {/* Render Map only on client to avoid SSR/hydration issues that can
            surface as errors like "render2 is not a function" in some setups. */}
        <ClientMapWrapper />
      </StandardCard>
    </Stack>
  );
};

const ClientMapWrapper = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // First try a very small reproduction that only mounts MapContainer + TileLayer
  // (no hooks or other children). If this still throws, the problem is likely a
  // react / react-leaflet integration or duplicate-React issue.
  return <MapTest height={420} />;
};

export default HomeRoute;
