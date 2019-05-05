import React from 'react';
import ReactDOM from 'react-dom';

let search = window.location.search;
let params = new URLSearchParams(search);
let channel = params.get('channel')

const API = "https://api.angelthump.com/v1/";

const videoJsOptions = {
    errorDisplay: false,
    html5: {
        hlsjsConfig: {
            debug: false,
            startLevel: window.localStorage.getItem('lastSourceID') || 0,
            liveSyncDurationCount: 2,
            maxLoadingDelay: 5
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

        'chromeCastButton':{},
        'settingsMenuButton': {},
        'fullscreenToggle':{}
        }
    },
    fill: true,
    responsive: true,
    VideoStatsUL: {version: '1.0.1'}
}

if (typeof window.MediaSource === 'undefined') {
    videoJsOptions.html5 = {
        hls: {
            overrideNative: false
        },
        nativeVideoTracks: true,
        nativeAudioTracks: true,
        nativeTextTracks: true
    };
}

if(channel) {
    channel = channel.toLowerCase();
    fetch(API + channel)
    .then(response => response.json())
    .then(data => {
        if(!data.passwordProtected) {
            import('./player').then(VideoPlayer => {
                ReactDOM.render(
                <div className="player">
                    <VideoPlayer.default options={videoJsOptions} channel={channel} data={data}/>
                </div>, document.getElementById('root'));
            })
        } else {
            import('./password-protected').then(PasswordProtected => {
                ReactDOM.render(
                <div className="player">
                    <PasswordProtected.default options={videoJsOptions} channel={channel} data={data}/>
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
