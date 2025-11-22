import React, { useEffect, useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../providers/auth";
import { Link } from "react-router-dom";
import { PasswordInput } from "../widgets/PasswordInput";
import { useTitle } from "../utils";

export const Login = () => {
  useTitle("Login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, authState } = useAuth();
  const { state } = useLocation();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const [noerrorp, errorMsg] = await login({ username, password });
    if (noerrorp) {
      setError("");
      setSuccess("Login successful!");
    } else {
      setError(errorMsg);
    }
  };

  // if user is already authenticated, redirect to home
  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate(state?.path || "/");
    }
  }, [authState.isAuthenticated, state?.path, navigate]);

  return (
    <Stack spacing={2} alignItems="center">
      <form onSubmit={handleLogin}>
        <Stack spacing={2} alignItems="center">
          <h2>Login</h2>
          <TextField
            required
            type="text"
            value={username}
            variant="standard"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <PasswordInput
            required
            value={password}
            variant="standard"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          {error && <p style={{ color: "red" }}>Error: {error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
          <Button variant="contained" type="submit">
            Login
          </Button>
        </Stack>
      </form>
      <Button component={Link} to="/signup">
        Sign up instead
      </Button>
    </Stack>
  );
};
