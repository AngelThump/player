import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class Section extends Component {

  constructor(player, options) {
    super(player, options);
  }

  createEl(tag = 'div', props = {className: "pl-menu__section pl-menu__section--with-sep"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }

  buildCSSClass() {
    // vjs-icon-cog can be removed when the settings menu is integrated in video.js
    return `pl-menu__section pl-menu__section--with-sep ${super.buildCSSClass()}`;
  }
}

videojs.registerComponent('Section', Section);
export default Section;