import { localStorageGetItem, localStorageSetItem } from "./storage";
import { styled, Grid, Box, Typography, IconButton, CircularProgress, useMediaQuery, Link } from "@mui/material";
import { useCallback, forwardRef, useState, useEffect, useRef } from "react";
import canAutoplay from "can-autoplay";
import Hls from "hls.js";
import Controls from "./Controls";
import biblethump from "./assets/biblethump.png";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { debounce } from "lodash";
import Stats from "./Stats";
import patreonImg from "./assets/patreon.png";

const IDENTIFIER = "SwnpX0RnA99YdRj0SPqs";

const hlsjsOptions = {
  debug: false,
  enableWorker: true,
  startLevel: JSON.parse(localStorageGetItem("level")) || undefined,
  liveSyncDurationCount: 2,
  maxBufferSize: 10 * 1000 * 1000,
  backBufferLength: 60,
  startFragPrefetch: true,
  defaultAudioCodec: "mp4a.40.2",
  progressive: false,
};
const M3U8_BASE = "https://vigor.angelthump.com",
  MSE = Hls.isSupported(),
  WEBSOCKET_URI = "wss://uws.angelthump.com/ws";
let hls;

const getToken = async (channel, usePatreonServers) => {
  const token = await fetch(`https://vigor.angelthump.com/${channel}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Identifier: IDENTIFIER,
    },
    credentials: "include",
    body: JSON.stringify({
      patreon: usePatreonServers,
    }),
  })
    .then((response) => response.json())
    .then((response) => response.token)
    .catch((e) => {
      console.error(e);
      return null;
    });
  return token;
};

export default function Player(props) {
  const { channel, streamData, userData } = props;
  const [live, setLive] = useState(streamData && streamData.type === "live");
  const [player, setPlayer] = useState(null);
  const [videoContainer, setVideoContainer] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [usePatreonServers, setPatreonServers] = useState(JSON.parse(localStorageGetItem("patreon")) || false);
  const [showStats, setShowStats] = useState(false);
  const [playerAPI, setPlayerAPI] = useState({
    fullscreen: false,
    canUsePIP: document.pictureInPictureEnabled,
    pip: false,
    volume: JSON.parse(localStorageGetItem("volume")) || 1,
  });
  const ws = useRef(null);
  const isMobile = useMediaQuery("(max-width: 800px)");

  const videoRef = useCallback((node) => {
    setPlayer(node);
  }, []);

  const videoContainerRef = useCallback((node) => {
    if (node) node.focus();
    setVideoContainer(node);
  }, []);

  useEffect(() => {
    setLive(streamData && streamData.type === "live");
  }, [streamData]);

  useEffect(() => {
    if (!channel) return;
    const ws_connect = () => {
      ws.current = new WebSocket(WEBSOCKET_URI);
      ws.current.onopen = (evt) => evt.target.send(JSON.stringify({ action: "subscribe", channel: channel }));
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
            console.info("ws sent live: " + jsonObject.live);
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
      player.muted = obj.result === true ? JSON.parse(localStorageGetItem("muted")) || false : (player.muted = true);
    });

    player.onvolumechange = (event) => {
      localStorageSetItem(`volume`, player.volume);
      localStorageSetItem(`muted`, player.muted);
      setPlayerAPI((playerAPI) => ({ ...playerAPI, muted: player.muted, volume: player.volume }));
    };

    player.onplay = () => {
      setPlayerAPI((playerAPI) => ({ ...playerAPI, paused: false, buffering: false }));
    };

    player.onplaying = () => {
      setPlayerAPI((playerAPI) => ({ ...playerAPI, buffering: false }));
    };

    player.onpause = () => {
      setPlayerAPI((playerAPI) => ({ ...playerAPI, paused: true, buffering: false }));
    };

    const source = `${M3U8_BASE}/hls/${channel}.m3u8`;
    setPlayerAPI((playerAPI) => ({ ...playerAPI, source: source, volume: JSON.parse(localStorageGetItem("volume")) || 1, muted: player.muted }));

    const loadHLS = () => {
      hls = new Hls(hlsjsOptions);
      hls.attachMedia(player);
      hls.on(Hls.Events.MEDIA_ATTACHED, async () => {
        console.info("HLS attached to media");
        const token = await getToken(channel, usePatreonServers);
        if (!token) {
          if (usePatreonServers) {
            alert("Not a patron or not logged in!");
            localStorageSetItem("patreon", false);
            setPatreonServers(false);
          }
          return;
        }
        hls.loadSource(`${source}?token=${token}`);
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
          player.play();
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
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
          if (data.details === "bufferStalledError") setPlayerAPI((playerAPI) => ({ ...playerAPI, buffering: true }));
          console.error(data);
        }
      });
    };

    const loadNative = async () => {
      const token = await getToken(channel, usePatreonServers);
      if (!token) {
        if (usePatreonServers) {
          alert("Not a patron or not logged in!");
          setPatreonServers(false);
        }
        return;
      }
      player.src = `${source}?token=${token}`;

      player.addEventListener("loadedmetadata", function () {
        player.play();
      });
    };

    if (player.canPlayType("application/vnd.apple.mpegurl")) {
      console.info("HLS MODE: NATIVE");
      loadNative();
    } else if (MSE) {
      console.info("HLS MODE: MSE");
      loadHLS();
    } else {
      console.info("Browser does not support Native HLS or MSE!");
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [player, channel, usePatreonServers, live]);

  const disableOverlay = () => {
    if (!overlayVisible) return;
    setOverlayVisible(false);
  };

  const debouncedOverlayHandler = useCallback(debounce(disableOverlay, 6000), []); // eslint-disable-line react-hooks/exhaustive-deps

  const mouseMove = () => {
    debouncedOverlayHandler();
    if (overlayVisible) return;
    setOverlayVisible(true);
  };

  const handleFullscreen = async (e) => {
    if (!videoContainer) return;

    if (document.fullscreenElement === null) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if (videoContainer.mozRequestFullScreen) {
        videoContainer.mozRequestFullScreen();
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }

    if (isMobile) {
      const newOrientation = getOppositeOrientation();
      await window.screen.orientation.lock(newOrientation).catch((e) => console.error(e));
    }

    setPlayerAPI({ ...playerAPI, fullscreen: !playerAPI.fullscreen });
  };

  const handlePIP = () => {
    document.pictureInPictureElement ? document.exitPictureInPicture() : player.requestPictureInPicture();
    setPlayerAPI({ ...playerAPI, pip: !playerAPI.pip });
  };

  const onKey = (e) => {
    switch (e.keyCode) {
      case 32: {
        e.preventDefault();
        playerAPI.paused ? player.play() : player.pause();
        break;
      }
      case 77: {
        e.preventDefault();
        player.muted = !playerAPI.muted;
        break;
      }
      case 70: {
        e.preventDefault();
        handleFullscreen();
        break;
      }
      /*
      case 37: {
        e.preventDefault();
        const currentTime = player.currentTime;
        if (currentTime - 5 < 0) return (player.currentTime = 0);
        player.currentTime = currentTime - 5;
        break;
      }
      case 39: {
        e.preventDefault();
        const currentTime = player.currentTime;
        if (currentTime + 5 > player.duration) return (player.currentTime = player.duration);
        player.currentTime = currentTime + 5;
        break;
      }*/
      default: {
        break;
      }
    }
  };

  const getOppositeOrientation = () => {
    const { type } = window.screen.orientation;
    return type.startsWith("portrait") ? "landscape" : "portrait";
  };

  return (
    <>
      {channel ? (
        <VideoContainer>
          <div tabIndex="-1" onKeyDown={onKey} ref={videoContainerRef} onMouseMove={mouseMove} onMouseLeave={() => setOverlayVisible(false)}>
            <Video onContextMenu={(e) => e.preventDefault()} autoPlay playsInline ref={videoRef} volume={JSON.parse(localStorageGetItem("volume")) || 1} />
            <Box onDoubleClick={handleFullscreen} sx={{ position: "absolute", inset: "0px" }}>
              {!live && (
                <OfflineBanner
                  style={{
                    backgroundImage: `url('${userData && userData.offline_banner_url}')`,
                  }}
                />
              )}
              {playerAPI.buffering && (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <CircularProgress />
                </Box>
              )}
              {!usePatreonServers && (
                <Box sx={{ right: 0, position: "absolute", userSelect: "none" }}>
                  <Link href={`https://patreon.com/join/angelthump`} target="_blank" rel="noreferrer noopener">
                    <img alt="" src={patreonImg} />
                  </Link>
                </Box>
              )}
              {playerAPI.paused && (
                <PlayOverlay onClick={() => player.play()}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
                    <Box sx={{ position: "absolute" }}>
                      <IconButton onClick={() => player.play()}>
                        <PlayArrowIcon sx={{ fontSize: 80 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </PlayOverlay>
              )}
              {showStats && <Stats hls={hls} player={player} setShowStats={setShowStats} playerAPI={playerAPI} />}
              <Controls
                player={player}
                playerAPI={playerAPI}
                hls={hls}
                live={live}
                overlayVisible={live ? overlayVisible : true}
                handleFullscreen={handleFullscreen}
                handlePIP={handlePIP}
                patreon={usePatreonServers}
                setPatreonServers={setPatreonServers}
                showStats={showStats}
                setShowStats={setShowStats}
              />
            </Box>
          </div>
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
