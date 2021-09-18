import { useEffect, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline, styled } from "@mui/material";
import { blue, grey } from "@mui/material/colors";
import Player from "./Player";
import PasswordProtect from "./PasswordProtect";

const search = window.location.search;
const params = new URLSearchParams(search);
const channel = params.get("channel");
const API_BASE = "https://api.angelthump.com/v2";

export default function App() {
  const [data, setData] = useState(undefined);

  const darkTheme = createTheme({
    palette: {
      background: {
        default: "#0e0e10",
        secondary: "#1d1d1d",
      },
      text: {
        primary: "#efeff1",
        secondary: "rgba(255,255,255,0.7)",
      },
      button: {
        primary: blue[500],
        secondary: grey[500],
      },
      input: {
        borderColor: "rgba(255, 255, 255, 0.2)",
        color: "#efeff1",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderColorPrimary: blue[500],
        backgroundColorPrimary: "#000000",
        borderColorSecondary: "rgba(255, 255, 255, 0.3)",
      },
      border: {
        color: "rgba(255, 255, 255, 0.2)",
      },
    },
  });

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
          <Player channel={channel} />
        ) : data.user.password_protect ? (
          <PasswordProtect channel={channel} data={data} />
        ) : (
          <Player channel={channel} data={data} />
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
