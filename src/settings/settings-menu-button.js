
/**
 * @file settings-menu-button.js
 */
import videojs from 'video.js';
import Patreon from './patreon-toggle';
import VideoStats from './videostats-toggle';
import Section from './section';
import Item from './menu-item';
import Inner from './inner';
import PatreonLabelWrapper from './patreon-label-wrapper';
import VideoStatsLabelWrapper from './videostats-label-wrapper';
import ToggleItem from './toggle-item';
import PlToggle from './pl-toggle';
import PatreonLabel from './patreon-label';
import VideoStatsLabel from './videostats-label';
import QualitySubMenuItem from './quality-submenu-item';
import QualitySubMenuSection from './quality-submenu-section';
import QualityMenuButton from './quality-menu-button';
import QualityMenuItem from './qualityMenuItem';
import BackButton from './backbutton';
const MenuButton = videojs.getComponent('MenuButton');
const Component = videojs.getComponent('Component');

/**
 * The component for controlling the settings menu
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends MenuButton
 * @class SettingsMenuButton
 */
class SettingsMenuButton extends MenuButton {

  constructor(player, options) {
    super(player, options);
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    // vjs-icon-cog can be removed when the settings menu is integrated in video.js
    return `vjs-settings-menu vjs-icon-cog ${super.buildCSSClass()}`;
  }

  /**
   * Create the settings menu
   *
   * @return {Menu} Menu object populated with items
   * @method createMenu
   */
  createMenu() {
    let menu = new Component(this.player());

    menu.addClass('at-settings-menu');
    menu.el().setAttribute('style', 'max-height: 476px;');

    const inner = new Inner(this.player(), this.options_);
    menu.addChild(inner);

    const qualityMenuItem = new QualityMenuItem(this.player(), this.options_);
    inner.addChild(qualityMenuItem);

    //quality submenu div/section
    const qualitySubMenuItem = new QualitySubMenuItem(this.player(), this.options_);
    inner.addChild(qualitySubMenuItem);

    const backButton = new BackButton(this.player(), this.options_);
    qualitySubMenuItem.addChild(backButton);

    const qualitySubMenuSection = new QualitySubMenuSection(this.player(), this.options_);
    inner.addChild(qualitySubMenuSection);

    const qualityMenuButton = new QualityMenuButton(this.player(), this.options_);
    qualityMenuItem.addChild(qualityMenuButton);

    //default menu
    const section = new Section(this.player(), this.options_);
    inner.addChild(section);

    const item = new Item(this.player(), this.options_);
    section.addChild(item);

    //patreon toggle
    const patreonToggleItem = new ToggleItem(this.player(), this.options_);
    item.addChild(patreonToggleItem)

    const patreonLabelWrapper = new PatreonLabelWrapper(this.player(), 'Patreon');
    patreonToggleItem.addChild(patreonLabelWrapper);

    const patreonPlToggle = new PlToggle(this.player(), this.options_);
    patreonToggleItem.addChild(patreonPlToggle);

    const patreonToggle = new Patreon(this.player(), this.options_);
    patreonPlToggle.addChild(patreonToggle);

    const patreonLabel = new PatreonLabel(this.player(), this.options_);
    patreonPlToggle.addChild(patreonLabel);


    //video stats toggle
    const videoStatsToggleItem = new ToggleItem(this.player(), this.options_);
    item.addChild(videoStatsToggleItem)

    const videoStatsLabelWrapper = new VideoStatsLabelWrapper(this.player(), 'Video Stats');
    videoStatsToggleItem.addChild(videoStatsLabelWrapper);

    const videoStatsPlToggle = new PlToggle(this.player(), this.options_);
    videoStatsToggleItem.addChild(videoStatsPlToggle);
    
    const videoStatsToggle = new VideoStats(this.player(), this.options_);
    videoStatsPlToggle.addChild(videoStatsToggle);

    const videoStatsLabel = new VideoStatsLabel(this.player(), this.options_);
    videoStatsPlToggle.addChild(videoStatsLabel);
    
    return menu;
  }

  /*
   * hide menu when clicked outside
   */
  hideMenu() {

  }

}

SettingsMenuButton.prototype.controlText_ = 'Settings Menu';

Component.registerComponent('SettingsMenuButton', SettingsMenuButton);
export default SettingsMenuButton;