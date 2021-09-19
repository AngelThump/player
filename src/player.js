import { localStorageGetItem, localStorageSetItem } from "./storage";
import { styled, Grid, Box, Typography, IconButton } from "@mui/material";
import { useCallback, forwardRef, useState, useEffect, useRef } from "react";
import canAutoplay from "can-autoplay";
import Hls from "hls.js";
import Controls from "./Controls";
import { isDev } from "./utils/Dev";
import biblethump from "./assets/biblethump.png";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const hlsjsOptions = {
  debug: false,
  enableWorker: true,
  startLevel: JSON.parse(localStorageGetItem("lastSourceID")) || 0,
  liveSyncDurationCount: 2,
  maxBufferSize: 10 * 1000 * 1000,
  backBufferLength: 0,
  startFragPrefetch: true,
  defaultAudioCodec: "mp4a.40.2",
  //progressive: true,
};
const M3U8_BASE = isDev ? "https://nyc-haproxy.angelthump.com" : "https://vigor.angelthump.com",
  MSE = Hls.isSupported(),
  WEBSOCKET_URI = "wss://viewer-api.angelthump.com:8888/uws";
let hls;

export default function Player(props) {
  const { channel, data } = props;
  const [live, setLive] = useState(data && data.type === "live");
  const [player, setPlayer] = useState(null);
  const [videoContainer, setVideoContainer] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [playerAPI, setPlayerAPI] = useState({
    version: process.env.REACT_APP_VERSION,
    hlsJsVersion: Hls.version,
    fullscreen: false,
    canUsePIP: document.pictureInPictureEnabled,
    pip: false,
  });
  const ws = useRef(null);

  const videoRef = useCallback((node) => {
    setPlayer(node);
  }, []);

  const videoContainerRef = useCallback((node) => {
    setVideoContainer(node);
  }, []);

  useEffect(() => {
    if (!channel) return;
    const ws_connect = () => {
      ws.current = new WebSocket(WEBSOCKET_URI);
      ws.current.onopen = () => ws.current.send(JSON.stringify({ action: "subscribe", channel: channel }));
      ws.current.onclose = () => setTimeout(ws_connect, 5000);

      ws.current.onmessage = (message) => {
        const jsonObject = JSON.parse(message.data);
        switch (jsonObject.action) {
          case "reload":
            window.location.reload();
            break;
          case "redirect":
            window.location.search = `?channel=${jsonObject.punt_username}`;
            break;
          case "live":
            console.log("ws sent live: " + jsonObject.live);
            setLive(jsonObject.live);
            break;
          default:
            break;
        }
      };
    };
    ws_connect();
    return (ws.current = null);
  }, [channel]);

  useEffect(() => {
    if (!player || !channel) return;
    canAutoplay.video().then(function (obj) {
      if (obj.result === true) {
        player.muted = JSON.parse(localStorageGetItem("muted")) || false;
      } else {
        player.muted = true;
      }
    });

    player.volume = JSON.parse(localStorageGetItem("volume")) || 1;

    player.onvolumechange = (event) => {
      localStorageSetItem(`volume`, player.volume);
      localStorageSetItem(`muted`, player.muted);
      setPlayerAPI((playerAPI) => ({ ...playerAPI, muted: player.muted, volume: player.volume }));
    };

    player.onplay = (event) => {
      setPlayerAPI((playerAPI) => ({ ...playerAPI, paused: false }));
      if (MSE) hls.startLoad();
      //Shift back to live
      player.currentTime = -1;
      if (ws.current && ws.current.readyState === 1) ws.current.send(JSON.stringify({ action: "join", channel: channel }));
    };

    player.onplaying = (event) => {
      setPlayerAPI((playerAPI) => ({ ...playerAPI, buffering: false }));
    };

    player.onpause = (event) => {
      setPlayerAPI((playerAPI) => ({ ...playerAPI, paused: true }));
      //stop downloading ts files when paused.
      if (MSE) hls.stopLoad();
      if (ws.current && ws.current.readyState === 1) ws.current.send(JSON.stringify({ action: "leave", channel: channel }));
    };

    const source = isDev ? `${M3U8_BASE}/hls/${channel}/index.m3u8` : `${M3U8_BASE}/hls/${channel}.m3u8`;
    setPlayerAPI((playerAPI) => ({ ...playerAPI, source: source, volume: player.volume, muted: player.muted }));

    const loadHLS = () => {
      hls = new Hls(hlsjsOptions);
      hls.attachMedia(player);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.info("HLS attached to media");
        hls.loadSource(source);
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
          player.play();
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.type === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          console.log(data);
          setPlayerAPI((playerAPI) => ({ ...playerAPI, buffering: true }));
        }
        if (data.fatal) {
          if (ws.current && ws.current.readyState === 1) ws.current.send(JSON.stringify({ action: "leave", channel: channel }));

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

    if (!Hls.isSupported() && player.canPlayType("application/vnd.apple.mpegurl")) {
      console.info("HLS MODE: NATIVE");
      player.src = source;

      player.addEventListener("loadedmetadata", function () {
        player.play();
      });
    } else if (MSE) {
      console.info("HLS MODE: MSE");
      loadHLS();
    } else {
      console.info("Browser does not support Native HLS or MSE!");
    }
  }, [player, channel]);

  useEffect(() => {
    if (overlayVisible)
      setTimeout(() => {
        setOverlayVisible(false);
      }, 6000);
  }, [overlayVisible]);

  const mouseMove = () => {
    if (overlayVisible) return;
    setOverlayVisible(true);
  };

  const handleFullscreen = (e) => {
    if (!videoContainer) return;

    if (document.fullscreenElement === null) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if (videoContainer.mozRequestFullScreen) {
        videoContainer.mozRequestFullScreen();
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
      }
      setPlayerAPI({ ...playerAPI, fullscreen: true });
    } else {
      document.exitFullscreen();
      setPlayerAPI({ ...playerAPI, fullscreen: false });
    }
  };

  const handlePIP = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
      setPlayerAPI({ ...playerAPI, pip: false });
    } else {
      player.requestPictureInPicture();
      setPlayerAPI({ ...playerAPI, pip: true });
    }
  };

  return (
    <>
      {channel ? (
        <VideoContainer>
          {live ? (
            <div ref={videoContainerRef} onMouseMove={mouseMove} onMouseLeave={() => setOverlayVisible(false)}>
              <Video onContextMenu={(e) => e.preventDefault()} autoPlay playsInline ref={videoRef} />
              <Box onDoubleClick={handleFullscreen} sx={{ position: "absolute", inset: "0px" }}>
                {playerAPI.paused ? (
                  <PlayOverlay onClick={() => player.play()}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
                      <Box sx={{ position: "absolute" }}>
                        <IconButton onClick={() => player.play()}>
                          <PlayArrowIcon sx={{ fontSize: 80 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </PlayOverlay>
                ) : (
                  <></>
                )}
                <Controls
                  player={player}
                  playerAPI={playerAPI}
                  hls={hls}
                  data={data}
                  live={live}
                  overlayVisible={overlayVisible}
                  handleFullscreen={handleFullscreen}
                  handlePIP={handlePIP}
                  channel={channel}
                />
              </Box>
            </div>
          ) : (
            <Box sx={{ position: "absolute", inset: "0px" }}>
              <OfflineBanner
                style={{
                  backgroundImage: `url('${data && data.user.offline_banner_url}')`,
                }}
              />
              <Controls
                player={player}
                playerAPI={playerAPI}
                hls={hls}
                data={data}
                live={live}
                overlayVisible={overlayVisible}
                handleFullscreen={handleFullscreen}
                handlePIP={handlePIP}
                channel={channel}
              />
            </Box>
          )}
        </VideoContainer>
      ) : (
        <Box sx={{ flexGrow: 1 }}>
          <Grid container justifyContent="center" alignItems="center" direction="column" style={{ minHeight: "100vh" }}>
            <Grid item xs={12}>
              <Box sx={{ height: "100px", width: "100px" }}>
                <Image src={biblethump} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: 600 }} variant="h6">
                Hm? Missing arguments.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </>
  );
}

const VideoContainer = styled(forwardRef(({ ...props }, ref) => <div {...props} ref={ref} />))`
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

const Image = styled((props) => <img {...props} alt="" />)`
  margin: auto;
  display: block;
  max-width: 100%;
  max-height: 100%;
`;

const PlayOverlay = styled((props) => <div {...props} />)`
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  flex-direction: column;
  inset: 0px;
  position: absolute;
  cursor: pointer;
`;
