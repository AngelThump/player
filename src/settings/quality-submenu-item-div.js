import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class QualitySubMenuItemDiv extends Component {

  constructor(player, options) {
    super(player, options);
  }

  createEl(tag = 'div', props = {className: "pl-menu__item pl-menu__item--block"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }
}

videojs.registerComponent('QualitySubMenuItemDiv', QualitySubMenuItemDiv);
export default QualitySubMenuItemDiv;