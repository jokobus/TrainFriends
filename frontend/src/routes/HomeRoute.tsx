import { Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { StandardCard } from "../widgets/StandardCard";
import { useAuthedState } from "../ProtectedRoute";
import MapWidget, { LocationTuple } from "../widgets/MapWidget";

export const HomeRoute = () => {
  const { userName } = useAuthedState();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Example locations: [username, [lng, lat], ISO-timestamp]
  // timestamps are generated relative to now (within the last 15 minutes)
  const _now = Date.now();
  const isoAgo = (minutes: number, seconds = 0) =>
    new Date(_now - minutes * 60 * 1000 - seconds * 1000).toISOString();
  
  // remove example
  const exampleLocations: LocationTuple[] = [
    ["alice", [11.5855, 48.1384], isoAgo(1, 12)],
    ["bob", [11.5751, 48.2374], isoAgo(3, 5)],
    ["charlie", [11.5755, 48.1374], isoAgo(2, 30)],
    ["alice", [11.5850, 48.1383], isoAgo(5, 0)],
    ["bob", [11.5752, 48.2374], isoAgo(7, 18)],
    ["charlie", [11.5755, 48.1373], isoAgo(6, 45)],
    ["alice", [11.5848, 48.1385], isoAgo(9, 10)],
    ["bob", [11.5752, 48.2375], isoAgo(11, 0)],
    ["charlie", [11.5754, 48.1373], isoAgo(13, 20)],
    ["charlie", [11.5754, 48.1372], isoAgo(14, 55)],
  ];

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

      <StandardCard sx={{ width: 1000, maxWidth: "100%", "@media (max-width:1200px)": {width: "90vw", maxWidth: 1000 }}} >
        <Typography variant="h6" align="center" sx={{ p: 1 }} gutterBottom>
          Nearby friends
        </Typography>
        <MapWidget locations={exampleLocations} // change location here
        /> 
      </StandardCard>
    </Stack>
  );
};

export default HomeRoute;
