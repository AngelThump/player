import { useEffect, useState, useRef } from "react";
import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import CastConnectedOutlinedIcon from "@mui/icons-material/CastConnectedOutlined";
import { Tooltip, IconButton } from "@mui/material";
/* eslint-disable no-undef */

export default function Chromecast(props) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [playerState, setPlayerState] = useState(null);
  let remotePlayerController = useRef(null),
    remotePlayer = useRef(null);

  useEffect(() => {
    const initializeCastPlayer = () => {
      var options = {
        receiverApplicationId: "50E3A992",
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        androidReceiverCompatible: true,
      };

      cast.framework.CastContext.getInstance().setOptions(options);

      remotePlayer.current = new cast.framework.RemotePlayer();
      remotePlayerController.current = new cast.framework.RemotePlayerController(remotePlayer.current);

      remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, function (e) {
        setIsConnected(e.value);
      });

      remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.PLAYER_STATE_CHANGED, function (e) {
        setPlayerState(e.value);
      });
    };

    window["__onGCastApiAvailable"] = (isAvailable) => {
      if (isAvailable && cast) {
        initializeCastPlayer();
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
        console.info("Chromecast is not available..");
      }
    };
  }, []);

  const castSrc = () => {
    let mediaInfo = new chrome.cast.media.MediaInfo(1, "application/x-mpegURL");
    mediaInfo.contentUrl = props.src;
    mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
    mediaInfo.metadata = new chrome.cast.media.TvShowMediaMetadata();
    mediaInfo.metadata.title = props.title;

    let request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;
    const session = cast.framework.CastContext.getInstance().getCurrentSession();
    if (session) {
      session
        .loadMedia(request)
        .then(() => {
          setIsMediaLoaded(true);
          console.info(`Chromecast: Loaded Media`);
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      console.log("Chromecast: Session aborted");
    }
  };

  const stopSrc = () => {
    const session = cast.framework.CastContext.getInstance().getCurrentSession();
    if (session) {
      remotePlayerController.stop();
      setIsMediaLoaded(false);
    }
  };

  return (
    <>
      {!isMediaLoaded ? (
        isConnected ? (
          <Tooltip title="Cast">
            <IconButton onClick={castSrc}>
              <CastOutlinedIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <IconButton onClick={castSrc} disabled={!isAvailable}>
            <CastOutlinedIcon />
          </IconButton>
        )
      ) : (
        <Tooltip title="Exit Cast">
          <IconButton onClick={stopSrc}>
            <CastConnectedOutlinedIcon />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}
