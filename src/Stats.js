import { Paper, MenuList, MenuItem, ListItemText, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import Hls from "hls.js";

let currentFrameCount = 0;

export default function Stats(props) {
  const { player, hls, setShowStats } = props;
  const [stats, setStats] = useState({});

  const closeStats = (e) => {
    setShowStats(false);
  };

  useEffect(() => {
    const getStats = () => {
      const videoPlaybackQuality = player ? player.getVideoPlaybackQuality() : null;
      setStats({
        playerHeight: player ? player.clientHeight : 0,
        playerWidth: player ? player.clientWidth : 0,
        videoHeight: player ? player.videoHeight : 0,
        videoWidth: player ? player.videoWidth : 0,
        fps: player ? player.webkitDecodedFrameCount - currentFrameCount : 0,
        droppedFrames: videoPlaybackQuality ? `${videoPlaybackQuality.droppedVideoFrames}/${videoPlaybackQuality.totalVideoFrames}` : `0/0`,
        bufferSize: player && player.buffered.length > 0 ? `${Math.round((player.buffered.end(0) - player.buffered.start(0) + Number.EPSILON) * 100) / 100} secs` : `0 secs`,
        latency: hls ? `${Math.round(hls.latency * 10) / 10} secs` : `0 secs`,
        connectionSpeed: hls ? `${Math.round(hls.bandwidthEstimate / 1000)} kbps` : `0 kbps`,
        hlsJsVersion: hls ? Hls.version : null,
        playerVersion: `${process.env.REACT_APP_VERSION}-${process.env.REACT_APP_GIT_COMMIT}`,
      });
      currentFrameCount = player ? player.webkitDecodedFrameCount : 0;
    };
    getStats();
    const interval = setInterval(getStats, 1000);

    return () => clearInterval(interval);
  }, [player, hls]);

  return (
    <Box sx={{ position: "absolute" }}>
      <Paper sx={{ minWidth: 250, display: "inline-block", background: "#050404" }}>
        <MenuList>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <MenuItem component={IconButton} onClick={closeStats}>
              <CloseIcon fontSize="12px" />
            </MenuItem>
          </Box>
          <MenuItem divider>
            <ListItemText disableTypography>
              <Typography variant="caption">{`Video Resolution`}</Typography>
            </ListItemText>
            <Typography variant="caption">{`${stats.videoWidth}x${stats.videoHeight}`}</Typography>
          </MenuItem>
          <MenuItem divider>
            <ListItemText disableTypography>
              <Typography variant="caption">{`Display Resolution`}</Typography>
            </ListItemText>
            <Typography variant="caption">{`${stats.playerWidth}x${stats.playerHeight}`}</Typography>
          </MenuItem>
          <MenuItem divider>
            <ListItemText disableTypography>
              <Typography variant="caption">{`FPS`}</Typography>
            </ListItemText>
            <Typography variant="caption">{stats.fps}</Typography>
          </MenuItem>
          <MenuItem divider>
            <ListItemText disableTypography>
              <Typography variant="caption">{`Dropped Frames`}</Typography>
            </ListItemText>
            <Typography variant="caption">{`${stats.droppedFrames}`}</Typography>
          </MenuItem>
          <MenuItem divider>
            <ListItemText disableTypography>
              <Typography variant="caption">{`Buffer Size`}</Typography>
            </ListItemText>
            <Typography variant="caption">{`${stats.bufferSize}`}</Typography>
          </MenuItem>
          {hls && (
            <MenuItem divider>
              <ListItemText disableTypography>
                <Typography variant="caption">{`Latency`}</Typography>
              </ListItemText>
              <Typography variant="caption">{`${stats.latency}`}</Typography>
            </MenuItem>
          )}
          {hls && !hls.userConfig.progressive && (
            <MenuItem divider>
              <ListItemText disableTypography>
                <Typography variant="caption">{`Connection Speed`}</Typography>
              </ListItemText>
              <Typography variant="caption">{`${stats.connectionSpeed}`}</Typography>
            </MenuItem>
          )}
          {hls && (
            <MenuItem divider>
              <ListItemText disableTypography>
                <Typography variant="caption">{`hls.js Version`}</Typography>
              </ListItemText>
              <Typography variant="caption">{`${stats.hlsJsVersion}`}</Typography>
            </MenuItem>
          )}
          <MenuItem divider>
            <ListItemText disableTypography>
              <Typography variant="caption">{`Player Version`}</Typography>
            </ListItemText>
            <Typography variant="caption">{`${stats.playerVersion}`}</Typography>
          </MenuItem>
        </MenuList>
      </Paper>
    </Box>
  );
}
