import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class QualitySubMenuSection extends Component {

  constructor(player, options) {
    super(player, options);
    this.hide();
  }

  createEl(tag = 'div', props = {className: "pl-menu__section pl-menu__section--with-sep"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }
}

videojs.registerComponent('QualitySubMenuSection', QualitySubMenuSection);
export default QualitySubMenuSection;