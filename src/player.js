require('!style-loader!css-loader!./css/settings.css')
require('!style-loader!css-loader!video.js/dist/video-js.css')
require('!style-loader!css-loader!./css/player.css')
require('!style-loader!css-loader!./css/videojs-logobrand.css')
require('!style-loader!css-loader!./css/videojs-chromecast.css')
require('!style-loader!css-loader!./css/login.css')
import "babel-polyfill";
import logo from '../dist/assets/patreon.png';
import videojs from 'video.js';
window.videojs = videojs;
import React from 'react';
import hlsjs from 'videojs-hlsjs-plugin';
hlsjs.register(videojs);
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
import storage from './storage';

/*TODO: When offline, change back to offline background img? Or use a div overlay for offline image when offline.
 *      Figure out video stats via hls.js. bitrate,buffersize,etc
 *      Server list
 *      Display load of region/server the user is assigned to next to server selection
 */

export default class VideoPlayer extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.player = videojs(this.videoNode, this.props.options, () => {
        });

        const player = this.player;

        let hlsTech;
        player.ready(function() {
            hlsTech = player.tech({IWillNotUseThisInPlugins: true}).hls;
        });

        canAutoplay.video().then(function(obj) {
            if (obj.result === false) {
                player.muted(true);
            }
        });

        player.logobrand({
            image: logo,
            destination: "https://www.patreon.com/join/angelthump"
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
            let patreon = JSON.parse(storage.getItem('patreon')) || false;

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
                }, 5000);
            });
            viewerAPISocket.on('live', (liveBoolean) => {
                console.log("socket sent live: " + liveBoolean);
                live = liveBoolean;
                if(live) {
                    setTimeout(function() {
                        retry();
                    }, 3000);
                } else {
                    playerTranscodeReady = false;
                }
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
                //console.log(hlsTech.hls);
                //console.log(hlsTech.hls.liveSyncPosition);
                player.loadingSpinner.show();
                player.bigPlayButton.hide();
                document.getElementById('paused-overlay').style.visibility='hidden';

                if(!viewerSocket) {
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
                const auth = io("https://sso.angelthump.com");

                const app = feathers()
                .configure(feathers.socketio(auth))
                .configure(feathers.authentication());

                app.reAuthenticate()
                .then(async () => {
                    const {user} = await app.get('authentication');
                    if(!user.patreon && user.angel) {
                        alert("You do not have patreon linked to your account!");
                        alert("You are not a patron! If you are, did you link your account?");
                        document.getElementById('patreon-toggle').checked = false;
                        storage.setItem('patreon', false);
                        window.open('https://angelthump.com/dashboard/patreon', 'AngelThump x Patreon','height=640,width=960,menubar=no,scrollbars=no,location=no,status=no');
                        return;
                    }
                  
                    let isPatron, tier;
                    if(!user.patreon) {
                        isPatron = false;
                        tier = 0;
                    } else {
                        isPatron = user.patreon.isPatron;
                        tier = user.patreon.tier;
                    }
                  
                    if(!user.angel && !isPatron && tier === 0) {
                        alert("You are not a patron! If you are, did you verify your patreon?");
                        document.getElementById('patreon-toggle').checked = false;
                        storage.setItem('patreon', false);
                        window.open('https://angelthump.com/settings/connection', 'AngelThump x Patreon','height=640,width=960,menubar=no,scrollbars=no,location=no,status=no');
                        return;
                    }

                    //hide logo
                    document.getElementById('vjs-logobrand-image').style.visibility = 'hidden';
                    if(playerTranscodeReady) {
                        player.src({
                            type: "application/x-mpegURL",
                            src: `https://video-patreon-cdn.angelthump.com/hls/${channel}.m3u8`
                        })

                        let promise = player.play();

                        if (promise !== undefined) {
                            promise.then(function() {
                                // Autoplay started!
                            }).catch(function(error) {
                                // Autoplay was prevented.
                                console.log(error)
                            });
                        }
                    } else {
                        player.src({
                            type: "application/x-mpegURL",
                            src: `https://video-patreon-cdn.angelthump.com/hls/${channel}/index.m3u8`
                        })

                        let promise = player.play();

                        if (promise !== undefined) {
                            promise.then(function() {
                                // Autoplay started!
                            }).catch(function(error) {
                                // Autoplay was prevented.
                                console.log(error)
                            });
                        }
                    }
                    auth.disconnect();
                }).catch(function(error){
                    console.error('Error authenticating!', error);

                    let loginPage = document.createElement('div');
                    loginPage.setAttribute('class', 'login-page');
                    loginPage.innerHTML = "<a href='/'><img src='/assets/small_logo.png'></a><div class='error' id='error' style='display: none; text-align: center;'>Wrong Username/Password! Please try again!</div><div class='form'><form id='loginForm' class='login-form' onsubmit='return false'><input id='strategy' type='hidden' name='strategy' value='local'><input id='user' type='user' name='user' placeholder='username' autocomplete='off'><input id='password' type='password' name='password' placeholder='password' autocomplete='off'><button type='submit' id='login'>login</button></form></div>"

                    const modalOptions = {
                        content: loginPage
                    };

                    const ModalDialog = videojs.getComponent('ModalDialog');
                    const loginModal = new ModalDialog(player, modalOptions);

                    player.addChild(loginModal);
                    loginModal.open();

                    const getCredentials = () => {
                        var payload;
                        var user = {
                            username: document.getElementById('user').value,
                            password: document.getElementById('password').value
                        };
                        payload = user ? Object.assign({ strategy: 'local' }, user) : {};
                        return payload;
                    }

                    const login = async (payload) => {
                        await app.authenticate(payload)
                        .then(() => {
                            loginModal.close();
                            player.trigger('patreon');
                            document.getElementById('patreon-toggle').checked = true;
                            storage.setItem('patreon', true);
                        }).catch(function(error) {
                            document.getElementById("error").style.display = 'block';
                            console.error('Error authenticating!', error);
                        });
                        auth.disconnect();
                    }

                    document.getElementById("login").addEventListener("click", () => {
                        login(getCredentials());
                    });

                    document.getElementById('patreon-toggle').checked = false;
                    storage.setItem('patreon', false);
                });
            })
            
            player.on('public', () => {
                if(playerTranscodeReady) {
                    player.src({
                        type: "application/x-mpegURL",
                        src: `https://video-cdn.angelthump.com/hls/${channel}.m3u8`
                    })

                    let promise = player.play();

                    if (promise !== undefined) {
                        promise.then(function() {
                            // Autoplay started!
                        }).catch(function(error) {
                            // Autoplay was prevented.
                            console.log(error)
                        });
                    }
                } else {
                    player.src({
                        type: "application/x-mpegURL",
                        src: `https://video-cdn.angelthump.com/hls/${channel}/index.m3u8`
                    })

                    let promise = player.play();

                    if (promise !== undefined) {
                        promise.then(function() {
                            // Autoplay started!
                        }).catch(function(error) {
                            // Autoplay was prevented.
                            console.log(error)
                        });
                    }
                }
            })

            /*
            player.on('retry', () => {
                if(!patreon) {
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
                } else {
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
                }
            })*/

            player.on('retry', () => {
                if(patreon) {
                    player.trigger('patreon');
                } else {
                    player.trigger('public');
                }
            })

            if(patreon) {
                player.trigger('patreon');
            } else {
                player.trigger('public');
            }

            let connect = () => {
                player.poster(poster);

                viewerSocket = io('https://viewer-api.angelthump.com:3031', {
                    transports: ['websocket']
                });
                viewerSocket.on('connect', () => {
                    viewerSocket.emit('channel', channel);
                });
            }

            let retry = () => {
                setTimeout(function() {
                    player.trigger('retry');

                    if (requestTime < 16000) {
                        requestTime = requestTime * 2;
                    }
                }, requestTime);
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
