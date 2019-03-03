import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class QualitySubMenuItem extends Component {

  constructor(player, options) {
    super(player, options);
    this.hide();
  }
  
  createEl(tag = 'div', props = {className: "pl-menu__item pl-menu__item--block pl-menu__item--with-caret-left"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }
}

videojs.registerComponent('QualitySubMenuItem', QualitySubMenuItem);
export default QualitySubMenuItem;