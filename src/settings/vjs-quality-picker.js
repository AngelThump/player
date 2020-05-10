
import QualitySubMenuItemDiv from './quality-submenu-item-div';
import QualityButton from './quality-button';
import videojs from 'video.js';

function qualityPickerPlugin() {
    let player = this;

    let SUPPORTED_TRACKS = ["video", "audio"];

    // On later versions `player.tech` is undefined before this...
    if (player.tech_) {
      player.tech_.on('loadedqualitydata', onQualityData);
    } else {
      player.ready(function () {
        player.tech_.on('loadedqualitydata', onQualityData);
      }, true);
    }

    function onQualityData(event, {qualityData, qualitySwitchCallback}) {
        const subMenuSection = player.controlBar.settingsMenuButton.children()[1].children()[0].children()[2];
        if(subMenuSection.children().length > 0) {
          subMenuSection.removeChild(subMenuSection.children()[0]);
        }
        const qualitySubMenuItemDiv = new QualitySubMenuItemDiv(player, {});
        subMenuSection.addChild(qualitySubMenuItemDiv);

        for (let track of SUPPORTED_TRACKS) {
          
          if(!qualityData[track] || qualityData[track].length < 1) {
            continue;
          }

          if(qualityData[track].length === 1) {
            qualityData[track][0].label = 'Source'

            const options = Object.assign({qualitySwitchCallback, track}, qualityData[track][0], { selectable: false });

            const button = new QualityButton(player, options);
            qualitySubMenuItemDiv.addChild(button);
            break;
          }

          let quality = qualityData[track][0];
          quality.label = 'Auto';
          const options = Object.assign({qualitySwitchCallback, track}, quality, { selectable: true });
          const button = new QualityButton(player, options);
          qualitySubMenuItemDiv.addChild(button);
          
          for (let i = qualityData[track].length-1; i>0; i--) {
            let quality = qualityData[track][i];
          
            if(qualityData[track].length-1 === i) {
              quality.label = `${quality.label} (Source)`;
            }

            let nextLabel = qualityData[track][i-1].label;
            if(nextLabel) {
              if(quality.label === '720p' && qualityData[track][i-1].label === '720p') {
                //check if source
                if(i===qualityData[track].length-1) {
                  quality.label = '720p60 (Source)'
                  qualityData[track][i-1].label = '720p30'
                } else {
                  quality.label = '720p60'
                  qualityData[track][i-1].label = '720p30'
                }
              }
            }

            const options = Object.assign({qualitySwitchCallback, track}, quality, { selectable: true });

            const button = new QualityButton(player, options);
            qualitySubMenuItemDiv.addChild(button);
          }
        }
    }
}

let registerPlugin = videojs.registerPlugin || videojs.plugin;

registerPlugin('qualityPickerPlugin', qualityPickerPlugin);
