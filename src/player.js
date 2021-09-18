import { localStorageGetItem, localStorageSetItem } from "./storage";
import { styled } from "@mui/material";
import { useEffect, useRef, forwardRef } from "react";
import canAutoplay from "can-autoplay";
import Hls from "hls.js";
import Controls from "./Controls";

const hlsjsOptions = {
  debug: false,
  enableWorker: true,
  startLevel: localStorageGetItem("lastSourceID") || 0,
  liveSyncDurationCount: 2,
  maxBufferSize: 10 * 1000 * 1000,
  backBufferLength: Infinity,
  startFragPrefetch: true,
  defaultAudioCodec: "mp4a.40.2",
  //progressive: true,
};
//const M3U8_BASE = "https://vigor.angelthump.com";
const M3U8_BASE = "https://nyc-haproxy.angelthump.com";

export default function Player(props) {
  const videoRef = useRef(null);
  const { channel, data } = props;
  //const source = `${M3U8_BASE}/hls/${channel}.m3u8`;
  const source = `${M3U8_BASE}/hls/${channel}/index.m3u8`;

  useEffect(() => {
    const player = videoRef.current;
    let viewCountSocket;

    const loadHLS = () => {
      const hls = new Hls(hlsjsOptions);
      hls.loadSource(source);
      hls.attachMedia(player);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        player.play();
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          if (viewCountSocket.readyState === 1) {
            viewCountSocket.send(
              JSON.stringify({ action: "leave", channel: channel })
            );
          }
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error(`fatal network error encountered, try to recover`);
              console.error(data);

              if (data.details !== "manifestLoadError") {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error(`fatal media error encountered, try to recover`);
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

    canAutoplay.video().then(function (obj) {
      if (obj.result === true) {
        if (JSON.parse(localStorageGetItem("muted"))) {
          player.muted = true;
        } else {
          player.muted = false;
        }
      }
    });

    if (data.live) player.poster = data.user.offline_banner_url;

    player.volume = JSON.parse(localStorageGetItem("volume")) || 1;

    player.onvolumechange = (event) => {
      localStorageSetItem(`volume`, player.volume);
      localStorageSetItem(`muted`, player.muted);
    };

    player.onplay = (event) => {
      console.log(event);
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
      console.info("HLS MODE: Native");
      player.src = source;

      player.addEventListener("loadedmetadata", function () {
        player.play();
      });
    } else {
      console.info("HLS MODE: MSE");
      loadHLS();
    }
    UWS_CONNECT();
  }, [videoRef, channel, source, data]);

  return (
    <Parent>
      <Video muted autoPlay playsInline ref={videoRef} />
      <Controls player={videoRef.current} />
    </Parent>
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

const Video = styled(
  forwardRef(({ ...props }, ref) => <video {...props} ref={ref} />)
)`
  height: 100%;
  width: 100%;
  outline: none;
`;
