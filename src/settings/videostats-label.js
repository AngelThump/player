import videojs from 'video.js';
const Component = videojs.getComponent('Component');

/**
 * The specific menu item type for selecting a setting
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class VideoStatsLabel
 */

class VideoStatsLabel extends Component {

  constructor(player, options) {
    super(player, options);
  }

  createEl(tag = 'label', props = {className: 'pl-toggle__button'}, attributes = {for: 'videostats-toggle'}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }

  buildCSSClass() {
    // vjs-icon-cog can be removed when the settings menu is integrated in video.js
    return `pl-toggle__button ${super.buildCSSClass()}`;
  }
}

videojs.registerComponent('VideoStatsLabel', VideoStatsLabel);
export default VideoStatsLabel;