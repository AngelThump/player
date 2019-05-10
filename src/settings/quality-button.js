import videojs from 'video.js';
const Button = videojs.getComponent('Button');
const dom = videojs.dom || videojs;
import storage from '../storage';

/**
 * The specific menu item type for selecting a setting
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class QualityButton
 */

class QualityButton extends Button {

  constructor(player, options) {
    super(player, options);
    this.update();
  }

  createEl() {
    let el = super.createEl('button', {className: 'ellipsis pl-quality-option-button'}, {id:'', tabindex: 0 ,type:'button'});
    return el;
  }

  update() {
    let el = this.el();
    el.appendChild(dom.createEl('span', {}, {}, this.options_.label));
  }

  /**
   * Handle click for button
   *
   * @method handleClick
   */
  handleClick(event) {
    super.handleClick(event);

    const player = this.player();

    player.controlBar.settingsMenuButton.unpressButton();

    const inner = player.controlBar.settingsMenuButton.children()[1].children()[0];
    const item = inner.children()[0];
    const section = inner.children()[3];
    const submenuItem = inner.children()[1];
    const submenuSection = inner.children()[2];

    this.options_.qualitySwitchCallback(this.options_.id, this.options_.trackType);

    storage.setItem('lastSourceLabel', this.options_.label);
    if(this.options_.id >= 0) {
      storage.setItem('lastSourceID', this.options_.id);
    }

    item.children()[0].el_.children[3].innerHTML = this.options_.label;

    submenuItem.hide();
    submenuSection.hide();

    item.show();
    section.show();

  }

}

videojs.registerComponent('QualityButton', QualityButton);
export default QualityButton;
