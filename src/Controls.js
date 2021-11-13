import { styled, Box, Tooltip, IconButton, Fade, Slider, Paper, MenuList, MenuItem, ListItemText, Typography, Divider, ClickAwayListener, Switch, ListItemIcon } from "@mui/material";
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
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { localStorageSetItem } from "./storage";

export default function Controls(props) {
  const [showSettings, setShowSettings] = useState(false);
  const [menuToShow, setMenuToShow] = useState("");
  const { player, playerAPI, hls, live, overlayVisible, handleFullscreen, handlePIP, channel, patreon, setPatreonServers, setShowStats, showStats } = props;

  const playHandler = () => {
    playerAPI.paused ? player.play() : player.pause();
  };

  const muteHandler = () => {
    player.muted = !playerAPI.muted;
  };

  const handleVolumeChange = (e, newValue) => {
    player.muted = false;
    player.volume = newValue / 100;
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleClickAway = () => {
    setShowSettings(false);
  };

  const handleQualityChange = (e, index) => {
    if (hls) {
      if (hls.currentLevel === index) return;
      hls.nextLevel = index;
      localStorageSetItem("level", index);
    }

    //TODO: native hls quality change
  };

  const handlePatreonServers = (e) => {
    localStorageSetItem("patreon", !patreon);
    setPatreonServers(!patreon);
  };

  const handlePlaybackStats = (e) => {
    setShowStats(!showStats);
  };

  return (
    <Fade in={overlayVisible} onDoubleClick={(e) => e.stopPropagation()}>
      <Parent>
        <Box sx={{ display: "flex", mb: 1, mt: 1, ml: 1, mr: 1 }}>
          <ControlGroup style={{ justifyContent: "flex-start" }}>
            {live ? (
              <>
                {playerAPI.paused ? (
                  <Tooltip title="Play (space)">
                    <IconButton onClick={playHandler}>
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Pause (space)">
                    <IconButton onClick={playHandler}>
                      <PauseIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {playerAPI.muted ? (
                  <Tooltip title="Unmute (m)">
                    <IconButton onClick={muteHandler}>
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
                    <Box sx={{ position: "absolute", inset: "auto 0px 100% auto", mr: 6 }}>
                      <Paper sx={{ minWidth: 200, display: "inline-block", background: "#050404" }}>
                        {menuToShow === "quality" ? (
                          <MenuList>
                            <MenuItem onClick={() => setMenuToShow("")}>
                              <ListItemText>{`< Back`}</ListItemText>
                            </MenuItem>
                            <Divider />
                            {hls &&
                              hls.levels.map((level, i) => (
                                <MenuItem
                                  key={`level ${i}`}
                                  onClick={(e) => {
                                    handleQualityChange(e, i);
                                  }}
                                >
                                  <ListItemIcon>{hls.currentLevel === i ? <RadioButtonCheckedIcon color="primary" /> : <RadioButtonUncheckedIcon color="primary" />}</ListItemIcon>
                                  <ListItemText>{`${level.name.length > 0 ? level.name : "Source"}`}</ListItemText>
                                </MenuItem>
                              ))}
                          </MenuList>
                        ) : menuToShow === "advanced" ? (
                          <MenuList>
                            <MenuItem onClick={() => setMenuToShow("")}>
                              <ListItemText>{`< Back`}</ListItemText>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handlePlaybackStats}>
                              <ListItemText>Video Stats</ListItemText>
                              <Switch edge="end" checked={showStats} size="small" />
                            </MenuItem>
                          </MenuList>
                        ) : (
                          <MenuList sx={{ pl: 1, pr: 1 }}>
                            <MenuItem onClick={() => setMenuToShow("quality")}>
                              <ListItemText>Quality</ListItemText>
                              <Box sx={{ mr: 1 }}>
                                <Typography variant="caption">{`${hls && hls.levels[0] ? hls.levels[0].name : ""}`}</Typography>
                              </Box>
                              <Typography variant="body2">{`>`}</Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handlePatreonServers}>
                              <ListItemText>Patreon Servers</ListItemText>
                              <Switch edge="end" checked={patreon} size="small" />
                            </MenuItem>
                            <MenuItem onClick={() => setMenuToShow("advanced")}>
                              <ListItemText>Advanced</ListItemText>
                              <Typography variant="caption">{`>`}</Typography>
                            </MenuItem>
                          </MenuList>
                        )}
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
