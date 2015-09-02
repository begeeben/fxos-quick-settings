(function(exports) {
  'use strict';
//TODO: reffer to improve https://github.com/yzen/fxos-user-hub/blob/master/js/screen.js
  var Main = {
    header: document.querySelector('gaia-header'),

    init: function() {
      if (navigator.mozHasPendingMessage &&
          navigator.mozHasPendingMessage('activity')) {
        navigator.mozSetMessageHandler('activity', activity => {
          this.activity = activity;
        });
      }
    },

    close: function() {
      this.activity.postResult('closed');
    }
  };

  Main.header.addEventListener('action', event => {
    if (event.detail.type === 'close') { Main.close(); }
  });

  Main.init();

  exports.Main = Main;
})(window);
