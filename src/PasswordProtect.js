import Player from "./Player";
import { Alert, Stack, Input, Button, Box } from "@mui/material";
import { useState } from "react";
import logo from "./assets/logo.png";

const API_BASE = "https://api.angelthump.com/v2";

export default function PasswordProtect(props) {
  const [showPlayer, setShowPlayer] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [password, setPassword] = useState("");
  const { data, channel } = props;

  const checkPass = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/user/stream_password`, {
      method: "post",
      body: JSON.stringify({
        stream: channel,
        password: password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setShowPlayer(data.success);
        if (!data.success) setError(true);
      })
      .catch((e) => {
        console.error(e);
        setShowPlayer(false);
        if (!data.success) setError(true);
      });
  };

  const handlePasswordInput = (e) => {
    setPassword(e.target.value);
  };

  return showPlayer ? (
    <Player data={data} channel={channel} />
  ) : (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <Stack
        sx={{
          maxWidth: "20rem",
          width: "100%",
        }}
        spacing={4}
      >
        <img src={logo} alt="" />
        {error === true ? (
          <Alert severity="error">Wrong Password!</Alert>
        ) : (
          <></>
        )}
        <form>
          <Stack spacing={2}>
            <Input
              autoFocus={true}
              autoCapitalize="false"
              autoComplete="false"
              autoCorrect="false"
              type="password"
              onChange={handlePasswordInput}
              placeholder="Enter Stream Password"
            />
            <Button
              type="submit"
              onClick={checkPass}
              variant="contained"
              disabled={password.length === 0}
              color={error ? "error" : "primary"}
            >
              Submit
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
