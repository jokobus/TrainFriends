import React, { useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { Api } from "../api";
import { DApi, useApi } from "../utils";

export const CreateFriendRequestWidget = ({
  refetch,
}: {
  refetch: () => void;
}) => {
  const [username, setUsername] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [errorFRC, createRequest] = useApi(DApi.friendRequestCreatePost, {
    onSuccess: () => {
      refetch();
      setSuccess("Send friend request successfully!");
      setUsername("");
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    createRequest({
      friendRequestCreate: { friendUsername: username },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} alignItems="center">
        <TextField  sx={{ width: 320, maxWidth: "100%", "@media (max-width:480px)": {width: "90vw", maxWidth: 320 }}} 
          required
          type="text"
          value={username}
          variant="standard"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Friend"
        />
        {errorFRC && <p style={{ color: "red" }}>Error: {errorFRC}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <Button variant="contained" type="submit">
          Send
        </Button>
      </Stack>
    </form>
  );
};
