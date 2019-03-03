import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class Item extends Component {

  constructor(player, options) {
    super(player, options);
  }

  createEl(tag = 'div', props = {className: "pl-menu__item pl-menu__item--block qa-item"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }

  buildCSSClass() {
    // vjs-icon-cog can be removed when the settings menu is integrated in video.js
    return `pl-menu__item pl-menu__item--block qa-item ${super.buildCSSClass()}`;
  }
}

videojs.registerComponent('Item', Item);
export default Item;