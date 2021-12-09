import { useEffect, useState } from "react";
import { createTheme, ThemeProvider, responsiveFontSizes } from "@mui/material/styles";
import { CssBaseline, styled } from "@mui/material";
import Player from "./Player";
import PasswordProtect from "./PasswordProtect";
import CastProvider from "react-chromecast";

const search = window.location.search;
const params = new URLSearchParams(search);
const channel = params.get("channel");
const API_BASE = "https://api.angelthump.com/v2";

export default function App() {
  const [data, setData] = useState(undefined);

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
    function fetchApi() {
      fetch(`${API_BASE}/streams/${channel}`)
        .then((response) => response.json())
        .then((response) => {
          setData(response);
        })
        .catch((e) => {
          setData(null);
          console.error(e);
        });
    }
    if (channel === null) {
      setData(null);
    } else {
      fetchApi();
    }
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Parent>
        {data === undefined ? (
          <></>
        ) : data === null || !data.user ? (
          <CastProvider>
            <Player channel={channel} />
          </CastProvider>
        ) : data.user.password_protect ? (
          <PasswordProtect channel={channel} data={data} />
        ) : (
          <CastProvider>
            <Player channel={channel} data={data} />
          </CastProvider>
        )}
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
