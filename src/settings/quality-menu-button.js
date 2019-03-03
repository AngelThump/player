import videojs from 'video.js';
const Button = videojs.getComponent('Button');
const dom = videojs.dom || videojs;

/**
 * The specific menu item type for selecting a setting
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class QualityMenuButton
 */

class QualityMenuButton extends Button {

  constructor(player, options) {
    super(player, options);

    this.update();
  }

  createEl() {
    let el = super.createEl('button', {className: 'qa-quality-button'}, {id: "", tabindex: 0, type:'button'});
    el.appendChild(dom.createEl('span', {}, {}, "Quality"));
    el.appendChild(dom.createEl('span', {className: "pl-pill pl-mg-l-05 qa-quality-pill"}, {}, ""));
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

    item.hide();
    section.hide();

    submenuItem.show();
    submenuSection.show();
  }

  //get source from local storage, otherwise default to auto.
  update() {
    let el = this.el();
    let label = window.localStorage.getItem('lastSourceLabel') || 'Auto';
    el.children[3].innerHTML = label;
  }
}

videojs.registerComponent('QualityMenuButton', QualityMenuButton);
export default QualityMenuButton;