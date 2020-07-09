import React from 'react';
import ReactDOM from 'react-dom';
import { localStorageGetItem } from './storage';

let search = window.location.search;
let params = new URLSearchParams(search);
let channel = params.get('channel')

const API = "https://api.angelthump.com/v2/streams/";

const videoJsOptions = {
    errorDisplay: false,
    html5: {
        hlsjsConfig: {
            debug: false,
            enableWorker: true,
            startLevel: localStorageGetItem('lastSourceID') || 0,
            //1 for near instant loading, 0 for lowest latency?
            liveSyncDurationCount: 2,
            liveMaxLatencyDurationCount: 6,
            maxBufferSize: 10*1000*1000,
            liveBackBufferLength: 0
        }
    },
    chromecast:{
        appId:'50E3A992'
    },
    controlBar: {
        children: {
        'playToggle':{},
        'muteToggle':{},
        'volumeControl':{},
        'currentTimeDisplay':{},
        'timeDivider':{},
        'durationDisplay':{},
        'liveDisplay':{},

        'flexibleWidthSpacer':{},
        'progressControl':{},
        'pictureInPictureToggle':{},

        'chromeCastButton':{},
        'settingsMenuButton': {},
        'fullscreenToggle':{}
        }
    },
    fill: true,
    responsive: true,
    VideoStatsUL: {version: '1.1.3'}
}

if (typeof window.MediaSource === 'undefined') {
    videoJsOptions.html5 = {
        hls: {
            overrideNative: false
        },
        nativeVideoTracks: true,
        nativeAudioTracks: true
    };
}

if(channel) {
    channel = channel;
    fetch(API + channel)
    .then(response => response.json())
    .then(response => {
        const userData = response.user;
        if(!userData.password_protect) {
            import('./player').then(VideoPlayer => {
                ReactDOM.render(
                <div className="player">
                    <VideoPlayer.default options={videoJsOptions} channel={channel} data={response}/>
                </div>, document.getElementById('root'));
            })
        } else {
            import('./password-protected').then(PasswordProtected => {
                ReactDOM.render(
                <div className="player">
                    <PasswordProtected.default options={videoJsOptions} channel={channel} data={response}/>
                </div>, document.getElementById('root'));
            })
        }
    }).catch(() => {
        import('./player').then(VideoPlayer => {
            ReactDOM.render(
            <div className="player">
                <VideoPlayer.default options={videoJsOptions}/>
            </div>, document.getElementById('root'));
        });
    });
} else {
    import('./player').then(VideoPlayer => {
        ReactDOM.render(
        <div className="player">
            <VideoPlayer.default options={videoJsOptions}/>
        </div>, document.getElementById('root'));
    });
}
