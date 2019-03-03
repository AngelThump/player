import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class ToggleItem extends Component {

  constructor(player, options) {
    super(player, options);
  }

  createEl(tag = 'div', props = {className: "pl-player-menu__toggle-item"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }

  buildCSSClass() {
    // vjs-icon-cog can be removed when the settings menu is integrated in video.js
    return `pl-player-menu__toggle-item ${super.buildCSSClass()}`;
  }
}

videojs.registerComponent('ToggleItem', ToggleItem);
export default ToggleItem;