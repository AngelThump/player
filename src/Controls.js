import { styled, Box, Tooltip, IconButton, Fade, Slider, Paper, MenuList, MenuItem, ListItemText, Typography, Divider, ClickAwayListener } from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { forwardRef, useState } from "react";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import PictureInPictureIcon from "@mui/icons-material/PictureInPicture";
import PictureInPictureOutlinedIcon from "@mui/icons-material/PictureInPictureOutlined";
import Chromecast from "./Chromecast";
import SettingsIcon from "@mui/icons-material/Settings";
import { localStorageGetItem } from "./storage";

export default function Controls(props) {
  const [showSettings, setShowSettings] = useState(false);
  const { player, playerAPI, hls, data, live, overlayVisible, handleFullscreen, handlePIP, channel } = props;

  let videoPlaybackQuality;
  if (player) {
    videoPlaybackQuality = player.getVideoPlaybackQuality();
  }

  const onPlay = () => {
    if (!playerAPI.paused) return;
    player.play();
  };

  const onPause = () => {
    if (playerAPI.paused) return;
    player.pause();
  };

  const unmuteHandler = () => {
    player.muted = false;
  };

  const muteHandler = () => {
    player.muted = true;
  };

  const handleVolumeChange = (e, newValue) => {
    player.muted = false;
    player.volume = newValue / 100;
  };

  const toggleSettings = () => {
    console.log(showSettings);
    setShowSettings(!showSettings);
  };

  const handleClickAway = () => {
    setShowSettings(false);
  };

  return (
    <Fade in={overlayVisible}>
      <Parent>
        <Box sx={{ display: "flex", mb: 1, mt: 1, ml: 1, mr: 1 }}>
          <ControlGroup style={{ justifyContent: "flex-start" }}>
            {live ? (
              <>
                {playerAPI.paused ? (
                  <Tooltip title="Play (space)">
                    <IconButton onClick={onPlay}>
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Pause (space)">
                    <IconButton onClick={onPause}>
                      <PauseIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {playerAPI.muted ? (
                  <Tooltip title="Unmute (m)">
                    <IconButton onClick={unmuteHandler}>
                      <VolumeOffIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Mute (m)">
                    <IconButton onClick={muteHandler}>
                      <VolumeUpIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Box sx={{ height: "100%", width: "7rem", display: "flex", alignItems: "center", ml: 1 }}>
                  {playerAPI.muted === undefined ? <></> : <Slider value={playerAPI.muted ? 0 : playerAPI.volume * 100} onChange={handleVolumeChange} />}
                </Box>
              </>
            ) : (
              <></>
            )}
          </ControlGroup>
          <ControlGroup style={{ justifyContent: "flex-end" }}>
            {live ? (
              <ClickAwayListener onClickAway={handleClickAway}>
                <div>
                  {showSettings ? (
                    <Box sx={{ position: "absolute", inset: "auto 0px 100% auto", mr: 5 }}>
                      <Paper sx={{ width: 220, maxWidth: "90%", minWidth: 110, display: "inline-block", background: "#050404" }}>
                        <MenuList>
                          <MenuItem>
                            <ListItemText>Quality</ListItemText>
                            <Typography variant="body2">{`${player.videoHeight}p >`}</Typography>
                          </MenuItem>
                          <Divider />
                          <MenuItem>
                            <ListItemText>Patreon</ListItemText>
                            <Typography variant="body2">{`>`}</Typography>
                          </MenuItem>
                          <MenuItem>
                            <ListItemText>Advanced</ListItemText>
                            <Typography variant="body2">{`>`}</Typography>
                          </MenuItem>
                        </MenuList>
                      </Paper>
                    </Box>
                  ) : (
                    <></>
                  )}
                  <Tooltip title="Settings">
                    <IconButton onClick={toggleSettings}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                </div>
              </ClickAwayListener>
            ) : (
              <></>
            )}
            <Chromecast src={playerAPI.source} title={`${channel}'s stream'`} />
            {playerAPI.pip ? (
              <Tooltip title="Exit Picture-in-Picture">
                <IconButton onClick={handlePIP}>
                  <PictureInPictureIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                {!playerAPI.canUsePIP ? (
                  <Tooltip title="Picture-in-Picture">
                    <IconButton onClick={handlePIP} disabled={!playerAPI.canUsePIP}>
                      <PictureInPictureOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <IconButton onClick={handlePIP} disabled={!playerAPI.canUsePIP}>
                    <PictureInPictureOutlinedIcon />
                  </IconButton>
                )}
              </>
            )}
            {playerAPI.fullscreen ? (
              <Tooltip title="Exit Fullscreen (f)">
                <IconButton onClick={handleFullscreen}>
                  <FullscreenExitIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Fullscreen (f)">
                <IconButton onClick={handleFullscreen}>
                  <FullscreenIcon />
                </IconButton>
              </Tooltip>
            )}
          </ControlGroup>
        </Box>
      </Parent>
    </Fade>
  );
}

const Parent = styled(forwardRef(({ ...props }, ref) => <div {...props} ref={ref} />))`
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0, rgba(0, 0, 0, 0.35) 60%, transparent);
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: visible;
  bottom: 0px;
  width: 100%;
`;

const ControlGroup = styled((props) => <div {...props} />)`
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  align-items: center;
`;
