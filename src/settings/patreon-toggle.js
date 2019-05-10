import videojs from 'video.js';
import storage from '../storage';

const ClickableComponent = videojs.getComponent('ClickableComponent');

/**
 * The specific menu item type for selecting a setting
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends ClickableComponent
 * @class Patreon
 */

class Patreon extends ClickableComponent {

  constructor(player, options) {
    super(player, options);
  }

  createEl() {
    let el = super.createEl('input', {className: 'qa-input-checkbox', defaultChecked: JSON.parse(storage.getItem('patreon')) || false}, {type:'checkbox', id: 'patreon-toggle'});
    return el;
  }

  buildCSSClass() {
    return `qa-input-checkbox ${super.buildCSSClass()}`;
  }

  /**
   * Handle click for button
   *
   * @method handleClick
   */
  handleClick(event) {
    super.handleClick(event);

    const target = event.target;

    if(target.checked) {
      storage.setItem('patreon', true);
      this.player().trigger('patreon');
    } else {
      storage.setItem('patreon', false);
      this.player().trigger('public');
    }
  }

}

videojs.registerComponent('Patreon', Patreon);
export default Patreon;
