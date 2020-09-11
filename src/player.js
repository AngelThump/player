require('!style-loader!css-loader!./css/settings.css')
require('!style-loader!css-loader!video.js/dist/video-js.css')
require('!style-loader!css-loader!./css/player.css')
require('!style-loader!css-loader!./css/videojs-logobrand.css')
require('!style-loader!css-loader!./css/videojs-chromecast.css')
require('!style-loader!css-loader!./css/login.css')
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
import { localStorageGetItem, localStorageSetItem } from './storage';
import 'videojs-landscape-fullscreen';

/*TODO: 
    When offline, change back to offline background img? Or use a div overlay for offline image when offline.
    show first frame as poster if live. if not live, show user's poster
 */

export default class VideoPlayer extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.player = videojs(this.videoNode, this.props.options, () => {
        });

        const player = this.player;

        player.landscapeFullscreen(this.props.options.fullscreen);

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

        let { data, channel, server } = this.props;
        if(data) {
            let { user, thumbnail_url, transcodeReady } = data;
            let live = data.type === 'live';
            let offline_banner_url = user.offline_banner_url;
            let viewCountSocket, requestTime = 1000;
            let patreon = JSON.parse(localStorageGetItem('patreon')) || false;

            let viewCountApiConnect = () => {
                viewCountSocket = new WebSocket('wss://viewer-api.angelthump.com/uws/');
                viewCountSocket.onopen = () => {
                    viewCountSocket.send(JSON.stringify({action: 'subscribe', channel: channel}));
                    if(!player.paused() && live) {
                        viewCountSocket.send(JSON.stringify({action: 'join', channel: channel}));
                    }
                    setInterval(() => {
                        viewCountSocket.send('{}');
                    }, 10 * 1000)
                };

                viewCountSocket.onmessage = (message) => {
                    const jsonObject = JSON.parse(message.data);
                    const action = jsonObject.action;
                    if(action === 'reload') {
                        window.location.reload();
                    } else if (action === 'redirect') {
                        window.location.search = `?channel=${jsonObject.punt_username}`;
                    } else if (action === 'live') {
                        console.log('socket sent live: ' + jsonObject.live);
                        live = jsonObject.live;
                        if(live) {
                            setTimeout(function() {
                                retry();
                            }, 3000);
                        }
                    } else if (action === 'edge_down') {
                        console.log(`edge down: ${jsonObject.edge}`);
                        /*
                        if(server === jsonObject.edge && live) {
                            updateEdge();
                        }*/
                    }
                };

                viewCountSocket.onclose = function(e) {
                    if(e.code === 1008) {
                        return console.error(e.reason);
                    }
                    console.log('Trying to reconnect to view count ws.', e.reason);
                    setTimeout(function() {
                        viewCountApiConnect();
                    }, 5000);
                };
            }
            
            const updateEdge = async () => {
                console.log('might be trying to change server');
                await fetch(`https://vigor.angelthump.com/${channel}/edge`)
                .then(response => response.json())
                .then(response => {
                    if(server !== response.server) {
                        server = response.server;
                        return player.trigger('public');
                    }
                })
                .catch(() => {
                    console.error('failed to get m3u8 server');
                });
            }


            if(!viewCountSocket) {
                viewCountApiConnect();
            }

            player.bigPlayButton.hide();
            if(!live) {
                player.poster(offline_banner_url);
            } else {
                setTimeout(function() {
                    player.poster(offline_banner_url);
                }, 5000);
            }

            player.on("pause", () => {
                player.bigPlayButton.show();
                document.getElementById('paused-overlay').style.visibility='visible';

                
                if(viewCountSocket.readyState === 1) {
                    viewCountSocket.send(JSON.stringify({action: 'leave', channel: channel}));
                }
            })

            player.on("playing", () => {
                const hlsTech = player.tech({IWillNotUseThisInPlugins: true}).hls;
                //console.log(hlsTech);
                //console.log(hlsTech.liveSyncPosition);
                player.loadingSpinner.show();
                player.bigPlayButton.hide();
                document.getElementById('paused-overlay').style.visibility='hidden';
                player.poster(offline_banner_url);

                if(viewCountSocket.readyState === 1) {
                    viewCountSocket.send(JSON.stringify({action: 'join', channel: channel}));
                }
            })

            player.on('error', () => {
                const error = player.error();
                if(viewCountSocket.readyState === 1) {
                    viewCountSocket.send(JSON.stringify({action: 'leave', channel: channel}));
                }

                player.loadingSpinner.hide();
                if(error.code != 3) {
                    player.error(null);
                    if(live) {
                        //updateEdge();
                        
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
                        localStorageSetItem('patreon', false);
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
                        localStorageSetItem('patreon', false);
                        window.open('https://angelthump.com/settings/connection', 'AngelThump x Patreon','height=640,width=960,menubar=no,scrollbars=no,location=no,status=no');
                        return;
                    }

                    //hide logo
                    document.getElementById('vjs-logobrand-image').style.visibility = 'hidden';
                    player.src({
                        type: "application/x-mpegURL",
                        src: `https://vigor.angelthump.com/hls/${channel}.m3u8?patreon=true`
                    })
                    player.play();
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
                            localStorageSetItem('patreon', true);
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
                    localStorageSetItem('patreon', false);
                });
            })
            
            player.on('public', () => {
                player.src({
                    type: "application/x-mpegURL",
                    src: `https://vigor.angelthump.com/hls/${channel}.m3u8`
                })
                player.play();
            })

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
