import React, { useCallback } from "react";
import { useCast } from "react-chromecast";
import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import CastConnectedOutlinedIcon from "@mui/icons-material/CastConnectedOutlined";
import { Tooltip, IconButton } from "@mui/material";

export default function CastButton() {
  const cast = useCast({
    initialize_media_player: "50E3A992",
    auto_initialize: true,
  });
  const handleClick = useCallback(async () => {
    if (cast.castReceiver) {
      await cast.handleConnection().catch(e => console.error(e));
    }
  }, [cast]);

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
