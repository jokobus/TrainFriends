import { Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { StandardCard } from "../widgets/StandardCard";
import { useAuthedState } from "../ProtectedRoute";

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
    </Stack>
  );
};

export default HomeRoute;
