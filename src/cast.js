import React, { useCallback, useEffect } from "react";
import { useCast, useMedia } from "react-chromecast";
import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import CastConnectedOutlinedIcon from "@mui/icons-material/CastConnectedOutlined";
import { Tooltip, IconButton } from "@mui/material";

export default function CastButton(props) {
  const cast = useCast({
    initialize_media_player: "DEFAULT_MEDIA_RECEIVER_APP_ID",
    auto_initialize: true,
  });
  const media = useMedia();
  const handleClick = useCallback(async () => {
    if (!cast.castReceiver) return;
    await cast.handleConnection().catch((e) => console.error(e));
  }, [cast]);

  useEffect(() => {
    if (!cast.isConnect || media.isMedia) return;
    media.playMedia(props.src).catch((e) => console.error(e));
  }, [cast.isConnect, props.src, media]);

  return !cast.isConnect ? (
    <Tooltip title="Cast">
      <IconButton onClick={handleClick}>
        <CastOutlinedIcon />
      </IconButton>
    </Tooltip>
  ) : (
    <Tooltip title="Cast">
      <IconButton onClick={handleClick}>
        <CastConnectedOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}
