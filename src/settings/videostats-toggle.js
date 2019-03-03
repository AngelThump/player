import videojs from 'video.js';
const ClickableComponent = videojs.getComponent('ClickableComponent');

/**
 * The specific menu item type for selecting a setting
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends ClickableComponent
 * @class VideoStats
 */

class VideoStats extends ClickableComponent {

  constructor(player, options) {
    super(player, options);
  }

  createEl() {
    let el = super.createEl('input', {className: 'qa-input-checkbox', defaultChecked: false}, {type:'checkbox', id: 'videostats-toggle'});
    return el;
  }

  buildCSSClass() {
    return `qa-input-checkbox ${super.buildCSSClass()}`;
  }

  /**
   * Handle click for button
   *
   * @method handleClick
   */
  handleClick(event) {
    super.handleClick(event);
    const target = event.target;
    
    const VideoStatsUL = this.player().VideoStatsUL;
    if(target.checked) {
      VideoStatsUL.show();
    } else {
      VideoStatsUL.hide();
    }
  }

}

videojs.registerComponent('VideoStats', VideoStats);
export default VideoStats;