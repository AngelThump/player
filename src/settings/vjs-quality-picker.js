
import QualitySubMenuItemDiv from './quality-submenu-item-div';
import QualityButton from './quality-button';
import videojs from 'video.js';
function qualityPickerPlugin() {
    let player = this;

    let SUPPORTED_TRACKS = ["video", "audio", "subtitle"];

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

        for (let i=0; i < SUPPORTED_TRACKS.length; i++) {
          let track = SUPPORTED_TRACKS[i];

          if (qualityData[track] && qualityData[track].length >= 1) {
            let qualityList = qualityData[track];

            if(qualityList.length == 1) {
              let quality = qualityList[i];
              quality.label = 'Source';
              let options = Object.assign({qualitySwitchCallback, track}, quality, { selectable: false });
          
              let button = new QualityButton(player, options);
              qualitySubMenuItemDiv.addChild(button);
            } else {
              //auto button
              let quality = qualityList[0];
              quality.label = 'Auto';
              let options = Object.assign({qualitySwitchCallback, track}, quality, { selectable: true });
              let button = new QualityButton(player, options);
              qualitySubMenuItemDiv.addChild(button);
              
              for (let i=qualityList.length-1; i > 0; i--) {
                let quality = qualityList[i];
                let label = quality.label;
                if(i==qualityList.length-1) {
                  quality.label = quality.label + ' (Source)';
                  const inner = player.controlBar.settingsMenuButton.children()[1].children()[0];
                  const item = inner.children()[0];
                  item.children()[0].el_.children[3].innerHTML = quality.label;
                  window.localStorage.setItem('lastSourceLabel', quality.label);
                }
                if(label == '1250kbps') {
                  quality.label = '480p';
                }
                let options = Object.assign({qualitySwitchCallback, track}, quality, { selectable: true });
            
                let button = new QualityButton(player, options);
                qualitySubMenuItemDiv.addChild(button);
              }
            }
          }
        }
    }
}

let registerPlugin = videojs.registerPlugin || videojs.plugin;

registerPlugin('qualityPickerPlugin', qualityPickerPlugin);
