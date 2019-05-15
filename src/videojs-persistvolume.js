"use strict";

import storage from './storage';

(function(factory) {
  /*!
   * Custom Universal Module Definition (UMD)
   *
   * Video.js will never be a non-browser lib so we can simplify UMD a bunch and
   * still support requirejs and browserify. This also needs to be closure
   * compiler compatible, so string keys are used.
   */
  if (typeof define === 'function' && define['amd']) {
    define(['video.js'], function(vjs){ factory(window, document, vjs) });
  // checking that module is an object too because of umdjs/umd#35
  } else if (typeof exports === 'object' && typeof module === 'object') {
    factory(window, document, require('video.js'));
  } else {
    factory(window, document, videojs);
  }

})(function(window, document, vjs) {
  const extend = function(obj) {
    var arg, i, k;
    for (i = 1; i < arguments.length; i++) {
      arg = arguments[i];
      for (k in arg) {
        if (arg.hasOwnProperty(k)) {
          obj[k] = arg[k];
        }
      }
    }
    return obj;
  },

  defaults = {
    namespace: ""
  },

  volumePersister = function(options) {
    var player = this;
    var settings = extend({}, defaults, options || {});

    var key = settings.namespace + '-' + 'volume';
    var muteKey = settings.namespace + '-' + 'mute';
    player.on("volumechange", function() {
      storage.setItem(key, player.volume());
      storage.setItem(muteKey, player.muted());
    });

    player.ready(function() {
      var persistedMute = storage.getItem(muteKey);
      if(persistedMute !== null) {
        player.muted('true' === persistedMute);
      }

      var persistedVolume = storage.getItem(key);
      if(persistedVolume !== null) {
        player.volume(persistedVolume);
        player.trigger('volumechange');
      }
    });
  };

  videojs.registerPlugin("persistvolume", volumePersister);

});
