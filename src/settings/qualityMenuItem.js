import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class QualityMenuItem extends Component {

  constructor(player, options) {
    super(player, options);
  }
  
  createEl(tag = 'div', props = {className: "pl-menu__item pl-menu__item--block pl-menu__item--with-caret"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }
}

videojs.registerComponent('QualityMenuItem', QualityMenuItem);
export default QualityMenuItem;