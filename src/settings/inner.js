import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class Inner extends Component {

  constructor(player, options) {
    super(player, options);
  }

  createEl(tag = 'div', props = {className: "pl-menu__inner"}, attributes = {}) {
    let el = super.createEl(tag, props, attributes);
    return el;
  }
}

videojs.registerComponent('Inner', Inner);
export default Inner;