import { localStorageGetItem, localStorageSetItem } from "./storage";
import { styled, Grid } from "@mui/material";
import { useEffect, useRef, forwardRef } from "react";
import canAutoplay from "can-autoplay";
import Hls from "hls.js";
import Controls from "./Controls";
import { isDev } from "./utils/Dev";

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
const M3U8_BASE = isDev
  ? "https://nyc-haproxy.angelthump.com"
  : "https://vigor.angelthump.com";

export default function Player(props) {
  const videoRef = useRef(null);
  const { channel, data } = props;
  const source = isDev
    ? `${M3U8_BASE}/hls/${channel}/index.m3u8`
    : `${M3U8_BASE}/hls/${channel}.m3u8`;

  useEffect(() => {
    const player = videoRef.current,
      MSE = Hls.isSupported();
    let viewCountSocket,
      hls = new Hls(hlsjsOptions);

    const loadHLS = () => {
      hls.attachMedia(player);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.info("HLS attached to media");
        if (data) hls.loadSource(source);
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
          console.info(
            `Manifest Loaded.. ${data.levels.length} quality levels`
          );
          player.play();
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (viewCountSocket.readyState === 1) {
            viewCountSocket.send(
              JSON.stringify({ action: "leave", channel: channel })
            );
          }
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

    const UWS_CONNECT = () => {
      viewCountSocket = new WebSocket("wss://viewer-api.angelthump.com/uws/");
      viewCountSocket.onopen = () => {
        viewCountSocket.send(
          JSON.stringify({ action: "subscribe", channel: channel })
        );
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
        }
      };
    };

    if (data) UWS_CONNECT();

    canAutoplay.video().then(function (obj) {
      if (obj.result === true) {
        if (JSON.parse(localStorageGetItem("muted"))) {
          player.muted = true;
        } else {
          player.muted = false;
        }
      }
    });

    if (data && !data.live) player.poster = data.user.offline_banner_url;

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
      if (viewCountSocket.readyState === 1) {
        viewCountSocket.send(
          JSON.stringify({ action: "join", channel: channel })
        );
      }
    };

    player.onplaying = (event) => {
      console.log(event);
    };

    player.onpause = (event) => {
      console.log(event);
      //stop downloading ts files when paused.
      if (MSE) hls.stopLoad();
      if (viewCountSocket.readyState === 1) {
        viewCountSocket.send(
          JSON.stringify({ action: "leave", channel: channel })
        );
      }
    };

    if (
      !Hls.isSupported() &&
      player.canPlayType("application/vnd.apple.mpegurl")
    ) {
      console.info("HLS MODE: NATIVE");
      if (data) player.src = source;

      player.addEventListener("loadedmetadata", function () {
        player.play();
      });
    } else if (MSE) {
      console.info("HLS MODE: MSE");
      loadHLS();
    } else {
      console.info("Browser does not support Native HLS or MSE!");
    }
  }, [videoRef, channel, source, data]);

  return (
    <>
      <Video controls muted autoPlay playsInline ref={videoRef} />
      <Grid>
        <Controls player={videoRef.current} />
      </Grid>
    </>
  );
}

const Video = styled(
  forwardRef(({ ...props }, ref) => <video {...props} ref={ref} />)
)`
  height: 100%;
  width: 100%;
  outline: none;
  background: #000000;
`;
