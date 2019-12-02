import React from 'react';
import ReactDOM from 'react-dom';
import storage from './storage';

let search = window.location.search;
let params = new URLSearchParams(search);
let channel = params.get('channel')

const API = "https://api.angelthump.com/v1/";

const videoJsOptions = {
    errorDisplay: false,
    html5: {
        hlsjsConfig: {
            debug: false,
            startLevel: storage.getItem('lastSourceID') || 0,
            liveSyncDurationCount: 2
            //loader: FetchLoader
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
    VideoStatsUL: {version: '1.0.81'}
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
    channel = channel.toLowerCase();
    fetch(API + channel)
    .then(response => response.json())
    .then(data => {
        if(data.banned) {
            import('./banned').then(Banned => {
                ReactDOM.render(
                <div className="banned">
                    <Banned.default channel={channel}/>
                </div>, document.getElementById('root'));
            })
        } else {
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
