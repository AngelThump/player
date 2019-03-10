require('!style-loader!css-loader!./css/settings.css')
require('!style-loader!css-loader!video.js/dist/video-js.css')
require('!style-loader!css-loader!./css/player.css')
require('!style-loader!css-loader!./css/videojs-logobrand.css')
require('!style-loader!css-loader!./css/videojs-chromecast.css')
import logo from '../dist/assets/patreon.png';
import videojs from 'video.js';
window.videojs = videojs;
import React from 'react';
import hlsjs from 'videojs-hlsjs-plugin';
hlsjs.register(videojs);
videojs.Html5Hlsjs.addHook('beforeinitialize', (videojsPlayer, hlsjsInstance) => {
    //console.log(hlsjsInstance);
});
import canAutoplay from 'can-autoplay';
import './settings/videostats-ul';
import './settings/settings-menu-button';
import './settings/vjs-quality-picker';
require('./videojs-chromecast');
require('./videojs-logobrand');
require('./videojs-persistvolume');
import io from 'socket.io-client';
import feathers from '@feathersjs/client';
import 'videojs-hotkeys';

/*TODO: When offline, change back to offline background img? Or use a div overlay for offline image when offline.
 *      Figure out video stats via hls.js. bitrate,buffersize,etc like twitch    
 */

export default class VideoPlayer extends React.Component {
    
    constructor(props) {
        super(props);
     }

    componentDidMount() {
        this.player = videojs(this.videoNode, this.props.options, () => {
        });

        const player = this.player;

        canAutoplay.video().then(function(obj) {
            if (obj.result === false) {
                player.muted(true);
            }
        });

        player.logobrand({
            image: logo,
            destination: "https://patreon.com/angelthump"
        });
        player.persistvolume({
            namespace: "volume"
        });
        player.VideoStatsUL.hide();
        player.qualityPickerPlugin();

        player.hotkeys({
            volumeStep: 0.1,
            rewindKey: () => {
                return null;
            },
            forwardKey: () => {
                return null;
            },
            enableModifiersForNumbers: false,
            enableNumbers: false,
            enableHoverScroll: true
          });

        let { data, channel } = this.props;
        if(data) {
            let { live, poster, thumbnail, playerTranscodeReady, title, viewers, isPatron } = data;
            let viewerSocket, viewerAPISocket, requestTime = 1000;
            let patreon = JSON.parse(window.localStorage.getItem('patreon')) || false;

            viewerAPISocket = io('https://viewer-api.angelthump.com', {
                transports: ['websocket']
            });
            viewerAPISocket.on('connect', () => {
                viewerAPISocket.emit('channel', channel);
            });
            viewerAPISocket.on('reload', () => {
                window.location.reload();
            });
            viewerAPISocket.on('redirect', (url) => {
                window.location = url;
            });
            viewerAPISocket.on('transcode', (transcode) => {
                console.log("socket sent transcode: " + transcode);
                playerTranscodeReady = transcode;
                setTimeout(function() {
                    player.trigger('public');
                }, 10000);
            });
            viewerAPISocket.on('live', (liveBoolean) => {
                console.log("socket sent live: " + liveBoolean);
                live = liveBoolean;
                setTimeout(function() {
                    retry();
                }, 3000);
            });
            
            player.bigPlayButton.hide();
            if(!live) {
                player.poster(poster);
            } else {
                setTimeout(function() {
                    player.poster(poster);
                }, 5000);
            }
            
            player.on("pause", () => {
                player.bigPlayButton.show();
                document.getElementById('paused-overlay').style.visibility='visible';

                if(viewerSocket) {
                    if(viewerSocket.connected) {
                        viewerSocket.disconnect();
                    }
                }
            })

            player.on("playing", () => {
                player.loadingSpinner.show();
                player.bigPlayButton.hide();
                document.getElementById('paused-overlay').style.visibility='hidden';

                if(viewerSocket == undefined) {
                    connect();
                } else if (!viewerSocket.connected) {
                    connect();
                }
            })

            player.on('error', (e) => {
                if(viewerSocket) {
                    if(viewerSocket.connected) {
                        viewerSocket.disconnect();
                    }
                }
                player.loadingSpinner.hide();
                if(e.code != 3) {
                    player.error(null);
                    if(live) {
                        retry();
                    }
                }
            })

            player.on('patreon', () => {
                if (localStorage !== null) {
                    let auth = io("https://angelthump.com", {
                        transports: ['websocket'],
                        forceNew: true
                    });

                    let app = feathers()
                    .configure(feathers.socketio(auth))
                    .configure(feathers.authentication());
                    app.authenticate()
                    .then(response => {
                        console.log('Authenticated!');
                        return app.passport.verifyJWT(response.accessToken);
                    })
                    .then(payload => {
                        return app.service('users').get(payload.userId);
                    })
                    .then(userVar => {
                        app.set('user', userVar);
                        let user = app.get('user');
                        if (user.isPatron || user.partner) {
                            if(playerTranscodeReady) {
                                player.src({
                                    type: "application/x-mpegURL",
                                    src: "https://video-patreon-cdn.angelthump.com/hls/" + channel + ".m3u8"
                                })
                            } else {
                                player.src({
                                    type: "application/x-mpegURL",
                                    src: "https://video-patreon-cdn.angelthump.com/hls/" + channel + "/index.m3u8"
                                })
                            }
                        } else {
                            alert("You are not a patron! If you are, did you link your account?");
                            document.getElementById('patreon-toggle').checked = false;
                            window.localStorage.setItem('patreon', false);
                            window.open('https://angelthump.com/patron', 'AngelThump x Patreon','height=640,width=960,menubar=no,scrollbars=no,location=no,status=no');
                        }
                        auth.disconnect();
                    }).catch(function(error){
                        console.error('Error authenticating!', error);
                        window.open('https://angelthump.com/login', 'AngelThump Login','height=640,width=960,menubar=no,scrollbars=no,location=no,status=no');
                        document.getElementById('patreon-toggle').checked = false;
                        window.localStorage.setItem('patreon', false);
                        auth.disconnect();
                    });
                } else {
                    alert('You must enable 3rd party cookies in your browser before using Patreon servers!');
                }
            })

            player.on('public', () => {
                if(playerTranscodeReady) {
                    player.src({
                        type: "application/x-mpegURL",
                        src: "https://video-cdn.angelthump.com/hls/" + channel + ".m3u8"
                    })
                } else {
                    player.src({
                        type: "application/x-mpegURL",
                        src: "https://video-cdn.angelthump.com/hls/" + channel + "/index.m3u8"
                    })
                }
            })

            player.trigger('public');

            if(patreon) {
                player.trigger('patreon');
            }

            let connect = () => {
                player.poster(poster);
                viewerSocket = io('https://viewer-api.angelthump.com:3030', {
                    transports: ['websocket']
                });
                viewerSocket.on('connect', () => {
                    viewerSocket.emit('channel', channel);
                });
            }

            let retry = () => {
                if(live) {
                    setTimeout(function() {
                        player.trigger('public');
        
                        if (requestTime < 16000) {
                            requestTime = requestTime * 2;
                        }
                    }, requestTime);
                }
            }
        }
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    render() {
        return (
            <div data-vjs-player>
                <video playsInline autoPlay controls ref={ node => this.videoNode = node } className="player-video video-js vjs-has-started"></video>
                <div id="paused-overlay" className="player-overlay player-play-overlay js-paused-overlay" style={{visibility: this.props.paused ? 'visible' : 'hidden' }}></div>
            </div>
        )
    }
}