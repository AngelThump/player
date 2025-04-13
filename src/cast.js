import React, { useEffect, useRef } from "react";
import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import CastConnectedOutlinedIcon from "@mui/icons-material/CastConnectedOutlined";
import { Tooltip, IconButton } from "@mui/material";
import { CastButton, useCast } from "react-cast-sender";

export default function Cast(props) {
  const { src, _player, streamData } = props;
  const { initialized, connected, player, playerController } = useCast();
  const castButtonRef = useRef(null);

  useEffect(() => {
    if (!connected || !src || !streamData || !player) return;
    if (player.isMediaLoaded) return;

    const mediaInfo = new window.chrome.cast.media.MediaInfo(streamData.user.display_name, "application/x-mpegURL");
    mediaInfo.contentUrl = src;
    mediaInfo.streamType = window.chrome.cast.media.StreamType.OTHER;

    //Transcodes are still in TS not FMP4
    if (!streamData.transcode) {
      //Needs this for FMP4
      mediaInfo.hlsSegmentFormat = window.chrome.cast.media.HlsSegmentFormat.FMP4;
      mediaInfo.hlsVideoSegmentFormat = window.chrome.cast.media.HlsVideoSegmentFormat.FMP4;
    }

    const metadata = new window.chrome.cast.media.MovieMediaMetadata();
    metadata.title = `${streamData.user.display_name} - ${streamData.user.title}`;
    metadata.images = [new window.chrome.cast.Image(streamData.user.profile_logo_url)];
    mediaInfo.metadata = metadata;

    const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;

    const loadMedia = (request) => {
      const castSession = window.cast.framework.CastContext.getInstance().getCurrentSession();
      if (castSession) {
        return castSession.loadMedia(request);
      } else {
        return Promise.reject("No CastSession has been created");
      }
    };

    loadMedia(request)
      .then(() => {
        console.log("Media Loaded!");
        _player.pause();
      })
      .catch((e) => console.error(e));

    return;
  }, [connected, playerController, src, streamData, _player, player]);

  return (
    <Tooltip enterTouchDelay={0} title="Cast" disableInteractive>
      <IconButton disabled={!initialized} onClick={() => castButtonRef.current.click()}>
        {connected ? <CastConnectedOutlinedIcon /> : <CastOutlinedIcon />}
      </IconButton>
      <CastButton ref={castButtonRef} style={{ display: "none" }} />
    </Tooltip>
  );
}
