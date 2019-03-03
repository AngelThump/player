import videojs from 'video.js';
const Button = videojs.getComponent('Button');
const dom = videojs.dom || videojs;

/**
 * The specific menu item type for selecting a setting
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class BackButton
 */

class BackButton extends Button {

  constructor(player, options) {
    super(player, options);
  }

  createEl() {
    let el = super.createEl('button', {className: 'qa-header-button'}, {}, "");
    el.appendChild(dom.createEl('span', {}, {}, "Quality"));
    return el;
  }

  /**
   * Handle click for button
   *
   * @method handleClick
   */
  handleClick(event) {
    super.handleClick(event);
    
    const player = this.player();
    const inner = player.controlBar.settingsMenuButton.children()[1].children()[0];
    const item = inner.children()[0];
    const section = inner.children()[3];
    const submenuItem = inner.children()[1];
    const submenuSection = inner.children()[2];

    submenuItem.hide();
    submenuSection.hide();

    item.show();
    section.show();
  }
}

videojs.registerComponent('BackButton', BackButton);
export default BackButton;