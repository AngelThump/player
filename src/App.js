import { useEffect, useState } from "react";
import { createTheme, ThemeProvider, responsiveFontSizes } from "@mui/material/styles";
import { CssBaseline, styled } from "@mui/material";
import Player from "./Player";
import PasswordProtect from "./PasswordProtect";
import { CastProvider } from "react-cast-sender";

const search = window.location.search;
const params = new URLSearchParams(search);
const channel = params.get("channel");
const API_BASE = "https://api.angelthump.com/v3";
const RECEIVER_APP_ID = process.env.REACT_APP_CHROMECAST_RECEIVER;

export default function App() {
  const [streamData, setStreamData] = useState(undefined);
  const [userData, setUserData] = useState(undefined);

  let darkTheme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#0e0e10",
      },
    },
  });

  darkTheme = responsiveFontSizes(darkTheme);

  useEffect(() => {
    function fetchStream() {
      fetch(`${API_BASE}/streams?username=${channel}`)
        .then((response) => response.json())
        .then((response) => {
          setStreamData(response[0]);
        })
        .catch((e) => {
          setStreamData(null);
          console.error(e);
        });
    }
    if (channel === null) setStreamData(null);
    else fetchStream();

    function fetchUser() {
      fetch(`${API_BASE}/users?username=${channel}`)
        .then((response) => response.json())
        .then((response) => {
          setUserData(response[0]);
        })
        .catch((e) => {
          setUserData(null);
          console.error(e);
        });
    }

    if (channel === null) setUserData(null);
    else fetchUser();
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Parent>
        <CastProvider receiverApplicationId={RECEIVER_APP_ID}>
          {userData === undefined ? (
            <></>
          ) : userData && userData.password_protect ? (
            <PasswordProtect channel={channel} streamData={streamData} userData={userData} />
          ) : (
            <Player channel={channel} streamData={streamData} userData={userData} />
          )}
        </CastProvider>
      </Parent>
    </ThemeProvider>
  );
}

const Parent = styled((props) => <div {...props} />)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
`;
