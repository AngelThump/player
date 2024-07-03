import { styled, Box, Tooltip, IconButton, Fade, Slider, Paper, MenuList, MenuItem, ListItemText, Typography, Divider, ClickAwayListener, Switch, ListItemIcon } from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { forwardRef, useEffect, useState } from "react";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import PictureInPictureIcon from "@mui/icons-material/PictureInPicture";
import PictureInPictureOutlinedIcon from "@mui/icons-material/PictureInPictureOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { localStorageSetItem } from "./storage";
import Cast from "./cast";

export default function Controls(props) {
  const [showSettings, setShowSettings] = useState(false);
  const [menuToShow, setMenuToShow] = useState("");
  const [position, setPosition] = useState(undefined);
  const [startBuffer, setStartBuffer] = useState(undefined);
  const [duration, setDuration] = useState(undefined);
  const { player, playerAPI, hls, live, overlayVisible, handleFullscreen, handlePIP, patreon, setPatreonServers, setShowStats, showStats } = props;
  const [currentLevel, setCurrentLevel] = useState(undefined);

  useEffect(() => {
    if (!player) return;
    const getTime = () => {
      setStartBuffer(player.buffered.length > 0 ? player.buffered.start(0) : 0);
      setPosition(Math.round(player.currentTime));
      setDuration(Math.round(player.duration));
    };
    getTime();
    const interval = setInterval(getTime, 1000);

    return () => clearInterval(interval);
  }, [player, hls]);

  useEffect(() => {
    if (!hls) return;

    const initalize = async () => {
      while (hls.currentLevel === -1) {
        await sleep(100);
      }

      const reversedLevels = hls.levels.slice(0).reverse();
      const currentIndex = reversedLevels.findIndex((tmpLevel) => tmpLevel.attrs.VIDEO === hls.levels[hls.currentLevel].attrs.VIDEO);

      setCurrentLevel(currentIndex);
    };

    const sleep = async (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    initalize();
  }, [hls]);

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

  const handleQualityChange = (e, i, level) => {
    if (!hls) return;
    const correctIndex = hls.levels.findIndex((tmpLevel) => level.attrs.VIDEO === tmpLevel.attrs.VIDEO);
    if (correctIndex === -1) return;
    if (correctIndex === hls.currentLevel) return;

    hls.currentLevel = correctIndex;
    localStorageSetItem("level", correctIndex);
    setCurrentLevel(i);
  };

  const handlePatreonServers = (e) => {
    localStorageSetItem("patreon", !patreon);
    setPatreonServers(!patreon);
  };

  const handlePlaybackStats = (e) => {
    setShowStats(!showStats);
  };

  const handleTimeChange = (e, value) => {
    player.currentTime = value;
    setPosition(player.currentTime);
  };

  return (
    <Fade in={overlayVisible} onDoubleClick={(e) => e.stopPropagation()}>
      <Parent>
        {
        live && !isNaN(duration) && !isNaN(position) && !isNaN(startBuffer) && (
          <Slider size="small" valueLabelDisplay="auto" valueLabelFormat={formatTime} value={position} min={startBuffer} step={1} max={duration} onChange={handleTimeChange} />
        )}
        <Box sx={{ display: "flex" }}>
          <ControlGroup style={{ justifyContent: "flex-start" }}>
            {live && (
              <>
                {playerAPI.paused ? (
                  <Tooltip enterTouchDelay={0} title="Play (space)" disableInteractive>
                    <IconButton onClick={playHandler}>
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip enterTouchDelay={0} title="Pause (space)" disableInteractive>
                    <IconButton onClick={playHandler}>
                      <PauseIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {playerAPI.muted ? (
                  <Tooltip enterTouchDelay={0} title="Unmute (m)" disableInteractive>
                    <IconButton onClick={muteHandler}>
                      <VolumeOffIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip enterTouchDelay={0} title="Mute (m)" disableInteractive>
                    <IconButton onClick={muteHandler}>
                      <VolumeUpIcon />
                    </IconButton>
                  </Tooltip>
                )}
                <Box sx={{ height: "100%", width: "7rem", display: "flex", alignItems: "center", ml: 1 }}>
                  {playerAPI.muted === undefined ? <></> : <Slider size="small" value={playerAPI.muted ? 0 : playerAPI.volume * 100} onChange={handleVolumeChange} />}
                </Box>
               
                <Box
                  sx={{
                    ml: 1.5,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption">{`${formatTime(position)}`}</Typography>
                  <Box sx={{ ml: 0.5, mr: 0.5, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Typography variant="caption">{`/`}</Typography>
                  </Box>
                  <Typography variant="caption">{`${formatTime(duration)}`}</Typography>
                </Box>
              </>
            )}
          </ControlGroup>
          <ControlGroup style={{ justifyContent: "flex-end" }}>
            {live && (
              <ClickAwayListener onClickAway={handleClickAway}>
                <Box>
                  {showSettings && (
                    <Box sx={{ position: "absolute", inset: "auto 0px 100% auto", mr: 6, mb: -1 }}>
                      <Paper sx={{ minWidth: 220, display: "inline-block", background: "#050404" }}>
                        {menuToShow === "quality" ? (
                          <MenuList>
                            <MenuItem onClick={() => setMenuToShow("")}>
                              <ListItemText>{`< Back`}</ListItemText>
                            </MenuItem>
                            <Divider />
                            {hls &&
                              hls.levels
                                .slice(0)
                                .reverse()
                                .map((level, i) => (
                                  <MenuItem
                                    key={`level ${i}`}
                                    onClick={(e) => {
                                      handleQualityChange(e, i, level);
                                    }}
                                  >
                                    <ListItemIcon>{currentLevel === i ? <RadioButtonCheckedIcon color="primary" /> : <RadioButtonUncheckedIcon color="primary" />}</ListItemIcon>
                                    <ListItemText>{`${level.attrs.VIDEO}`}</ListItemText>
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
                                <Typography variant="caption">{`${(hls && hls.levels[hls.currentLevel] && hls.levels[hls.currentLevel].attrs.VIDEO) || "Source"}`}</Typography>
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
                  )}
                  <Tooltip enterTouchDelay={0} title="Settings" disableInteractive>
                    <IconButton onClick={toggleSettings}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ClickAwayListener>
            )}
            {live && <Cast src={(hls && hls.url) || (player && player.src)} />}
            {playerAPI.pip ? (
              <Tooltip enterTouchDelay={0} title="Exit Picture-in-Picture" disableInteractive>
                <span>
                  <IconButton onClick={handlePIP} disabled={!playerAPI.canUsePIP}>
                    <PictureInPictureIcon />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <>
                <Tooltip enterTouchDelay={0} title="Picture-in-Picture" disableInteractive>
                  <span>
                    <IconButton onClick={handlePIP} disabled={!playerAPI.canUsePIP}>
                      <PictureInPictureOutlinedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
            {playerAPI.fullscreen ? (
              <Tooltip enterTouchDelay={0} title="Exit Fullscreen (f)" disableInteractive>
                <IconButton onClick={handleFullscreen}>
                  <FullscreenExitIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip enterTouchDelay={0} title="Fullscreen (f)" disableInteractive>
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


const formatTime = (time) => {
  const isTimeNaN = isNaN(time);
  const hours = !isTimeNaN ? Math.floor(time / 3600) : 0,
    remainder = !isTimeNaN ? time % 3600 : 0,
    minutes = !isTimeNaN ? Math.floor(remainder / 60) : 0,
    seconds = !isTimeNaN ? Math.floor(remainder % 60) : 0;

  let hh, mm, ss;
  if (hours !== 0) hh = hours.toString().padStart(2, "0");

  mm = minutes.toString().padStart(1, "0");
  ss = seconds.toString().padStart(2, "0");

  return `${hh ? `${hh}:` : ""}${mm}:${ss}`;
};

const Parent = styled(forwardRef(({ ...props }, ref) => <div {...props} ref={ref} />))`
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0, rgba(0, 0, 0, 0.35) 60%, transparent);
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: visible;
  bottom: 0px;
  width: 100%;
  padding: 1rem 1.5rem 1rem 1.5rem;
`;

const ControlGroup = styled((props) => <div {...props} />)`
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  align-items: center;
`;
