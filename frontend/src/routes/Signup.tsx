import React, { useState } from "react";
import { Button, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { Api } from "../api";
import { useSearchParams } from "react-router-dom";
import { handleApiErr, useTitle } from "../utils";
import { userNameMaxLength } from "../consts";
import { LinkWidget } from "../widgets/LinkWidget";

interface SignupData {
  name: string;
  password: string;
}

export const Signup = (): JSX.Element => {
  useTitle(`Signup`);
  const [signupData, setSignupData] = useState<SignupData>({
    name: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [succeeded, setSucceeded] = useState<boolean>(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const handleChangeSD = (e: React.ChangeEvent<HTMLInputElement>) => {
    // limit size of username to 20 characters
    if (e.target.name === "name" && e.target.value.length > userNameMaxLength) {
      return;
    }
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupData.name || !signupData.password || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }

    if (signupData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // FIXME: demand strong passwords: The password needs to start with …
    // https://react-hook-form.com/
    // https://www.npmjs.com/package/yup
    try {
      setInfo("Sending signup request....");
      setLoading(true);
      const response = await Api.signupPost({
        signupRequest: {
          username: signupData.name,
          password: signupData.password,
        },
      });
      // TODO: use response
      setError("");
      setSucceeded(true);
    } catch (e: any) {
      setError(handleApiErr(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2} alignItems="center">
        <h2>Sign Up</h2>
        <TextField
          type="text"
          name="name"
          variant="standard"
          value={signupData.name}
          onChange={handleChangeSD}
          placeholder="Name"
          required
        />
        <TextField
          type="password"
          name="password"
          variant="standard"
          value={signupData.password}
          onChange={handleChangeSD}
          placeholder="Password"
          required
        />
        <TextField
          type="password"
          name="confirmPassword"
          variant="standard"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          required
        />
        <Button type="submit" variant="contained" disabled={loading}>
          Sign up
        </Button>
        {
          succeeded && "Logging in" // TODO: reroute to login
        }
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {info && <p style={{ color: "green" }}>{info}</p>}
      </Stack>
    </form>
  );
};
