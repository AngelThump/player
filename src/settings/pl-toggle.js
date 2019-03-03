import videojs from 'video.js';
const Component = videojs.getComponent('Component');

class PlToggle extends Component {

    constructor(player, options) {
        super(player, options);
    }

    createEl(tag = 'div', props = {className: 'pl-toggle'}, attributes = {}) {
        let el = super.createEl(tag, props, attributes);

        return el;
    }

    buildCSSClass() {
        // vjs-icon-cog can be removed when the settings menu is integrated in video.js
        return `pl-toggle ${super.buildCSSClass()}`;
    }
}

videojs.registerComponent('PlToggle', PlToggle);
export default PlToggle;