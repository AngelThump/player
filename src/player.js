import { localStorageGetItem, localStorageSetItem } from "./storage";
import { styled, Grid, Stack, Box, Typography } from "@mui/material";
import { useEffect, useRef, forwardRef, useState } from "react";
import canAutoplay from "can-autoplay";
import Hls from "hls.js";
import Controls from "./Controls";
import { isDev } from "./utils/Dev";
import biblethump from "./assets/biblethump.png";

const hlsjsOptions = {
  debug: false,
  enableWorker: true,
  startLevel: localStorageGetItem("lastSourceID") || 0,
  liveSyncDurationCount: 2,
  maxBufferSize: 10 * 1000 * 1000,
  backBufferLength: 0,
  startFragPrefetch: true,
  defaultAudioCodec: "mp4a.40.2",
  //progressive: true,
};
const M3U8_BASE = isDev ? "https://nyc-haproxy.angelthump.com" : "https://vigor.angelthump.com";

export default function Player(props) {
  const videoRef = useRef(null);
  const { channel, data } = props;
  const [live, setLive] = useState(data && data.type === "live");
  const source = isDev ? `${M3U8_BASE}/hls/${channel}/index.m3u8` : `${M3U8_BASE}/hls/${channel}.m3u8`;

  useEffect(() => {
    if (!channel) return;
    const player = videoRef.current,
      MSE = Hls.isSupported();
    let viewCountSocket,
      hls = new Hls(hlsjsOptions);

    const UWS_CONNECT = () => {
      viewCountSocket = new WebSocket("wss://viewer-api.angelthump.com/uws/");
      viewCountSocket.onopen = () => {
        viewCountSocket.send(JSON.stringify({ action: "subscribe", channel: channel }));
        setInterval(() => {
          viewCountSocket.send("{}");
        }, 10 * 1000);
      };

      viewCountSocket.onmessage = (message) => {
        const jsonObject = JSON.parse(message.data);
        const action = jsonObject.action;
        if (action === "reload") {
          window.location.reload();
        } else if (action === "redirect") {
          window.location.search = `?channel=${jsonObject.punt_username}`;
        } else if (action === "live") {
          console.log("socket sent live: " + jsonObject.live);
          setLive(jsonObject.live);
        }
      };
    };

    UWS_CONNECT();

    const loadHLS = () => {
      hls.attachMedia(player);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.info("HLS attached to media");
        if (live) hls.loadSource(source);
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
          console.info(`Manifest Loaded.. ${data.levels.length} quality levels`);
          player.play();
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (viewCountSocket.readyState === 1) viewCountSocket.send(JSON.stringify({ action: "leave", channel: channel }));

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error(data);
              if (data.details !== "manifestLoadError") hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error(data);
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        } else {
          console.error(data);
        }
      });
    };

    canAutoplay.video().then(function (obj) {
      if (obj.result === true) {
        if (JSON.parse(localStorageGetItem("muted"))) {
          player.muted = true;
        } else {
          player.muted = false;
        }
      }
    });

    player.volume = JSON.parse(localStorageGetItem("volume")) || 1;

    player.onvolumechange = (event) => {
      localStorageSetItem(`volume`, player.volume);
      localStorageSetItem(`muted`, player.muted);
    };

    player.onplay = (event) => {
      console.log(event);
      if (MSE) hls.startLoad();
      //Shift back to live
      player.currentTime = -1;
      if (viewCountSocket.readyState === 1) viewCountSocket.send(JSON.stringify({ action: "join", channel: channel }));
    };

    player.onplaying = (event) => {
      console.log(event);
    };

    player.onpause = (event) => {
      console.log(event);
      //stop downloading ts files when paused.
      if (MSE) hls.stopLoad();
      if (viewCountSocket.readyState === 1) viewCountSocket.send(JSON.stringify({ action: "leave", channel: channel }));
    };

    if (!Hls.isSupported() && player.canPlayType("application/vnd.apple.mpegurl")) {
      console.info("HLS MODE: NATIVE");
      if (live) player.src = source;

      player.addEventListener("loadedmetadata", function () {
        player.play();
      });
    } else if (MSE) {
      console.info("HLS MODE: MSE");
      if (live) loadHLS();
    } else {
      console.info("Browser does not support Native HLS or MSE!");
    }
  }, [videoRef, channel, source, live]);

  return (
    <VideoContainer>
      {channel ? (
        <>
          <Video playsInline ref={videoRef} />
          <Grid sx={{ position: "absolute", inset: "0px" }}>
            {!live ? (
              <OfflineBanner
                style={{
                  backgroundImage: `url('${data && data.user.offline_banner_url}')`,
                }}
              />
            ) : (
              <></>
            )}
            <Controls player={videoRef.current} />
          </Grid>
        </>
      ) : (
        <Box display="flex" alignItems="center" position="absolute" inset="0px" height="100%" width="100%" justifyContent="center">
          <Stack sx={{ maxWidth: "50%", width: "50%", alignItems: "center", position: "relative" }} spacing={1}>
            <img width="15%" src={biblethump} alt="" />
            <Typography sx={{fontWeight: 600}} variant="h5" component="div">Hm? Missing arguments.</Typography>
          </Stack>
        </Box>
      )}
    </VideoContainer>
  );
}

const VideoContainer = styled((props) => <div {...props} />)`
  background: #000;
  overflow: hidden !important;
  position: absolute !important;
  inset: 0px !important;
`;

const Video = styled(forwardRef(({ ...props }, ref) => <video {...props} ref={ref} />))`
  height: 100%;
  position: absolute;
  width: 100%;
`;

const OfflineBanner = styled((props) => <div {...props} />)`
  background-position: 50%;
  background-repeat: no-repeat;
  background-size: cover;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
  position: relative;
`;
