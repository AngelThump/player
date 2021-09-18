import Player from "./Player";
import { Alert, Stack, Input, Button, FormControl } from "@mui/material";
import { useState } from "react";

const API_BASE = "https://api.angelthump.com/v2";

export default function PasswordProtect(props) {
  const [showPlayer, setShowPlayer] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [password, setPassword] = useState("");
  const { data, channel } = props;

  const checkPass = () => {
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
    <Stack sx={{ width: "100%" }}>
      {error === true ? <Alert severity="error">Wrong Password!</Alert> : <></>}
      <FormControl>
        <Input
          onChange={handlePasswordInput}
          placeholder="Enter Stream Password"
        />
        <Button
          onClick={checkPass}
          variant="contained"
          disabled={password.length === 0}
        >
          Submit
        </Button>
      </FormControl>
    </Stack>
  );
}
