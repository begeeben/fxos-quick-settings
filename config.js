(function(exports) {
  'use strict';

  var Config = {
    ELEMENTS: ['nfc', 'volume', 'flashlight', 'hotspot',
               'orientation', 'powersave', 'location',
               'developer'],

    header: document.querySelector('gaia-header'),
    activeItems: [],

    init: function() {
      if (navigator.mozHasPendingMessage &&
          navigator.mozHasPendingMessage('activity')) {
        navigator.mozSetMessageHandler('activity', activity => {
          this.activity = activity;
        });
      }

      this.getAllElements();
      var req = window.navigator.mozSettings.createLock()
        .get('quick.settings.addon');
      req.onsccess = () => {
        this.activeItems = req.result['quick.settings.addon'];
        console.log('XXX active:'+this.activeItems);
        this.activeItems.forEach((item) => {
          console.log('XXX item:'+item);
          this[item].checked = true;
        });

        this.ELEMENTS.forEach((name) => {
          this[name].addEventListener('change', this.switchHandler);
        });
      };
    },

    close: function() {
      window.navigator.mozSettings.createLock().set({
        'quick.settings.addon': this.activeItems
      });
      this.activity.postResult('closed');
    },

    switchHandler: function qs_switchHandler(evt) {
      evt.preventDefault();
      switch (evt.type) {
        case 'change':
//          switch (evt.target) {
            console.log('XXX add to activeItems:' + evt.target);
//          }
          break;
      }
    },

    /**
     * Gets all relevant elements with an id prefixed by quick-settings-.
     * @memberof QuickSettings.prototype
     */
    getAllElements: function qs_getAllElements() {
      this.ELEMENTS.forEach((name) => {
        this[name] =
          document.getElementById('quick-settings-' + name);
      });
    }

    // Template:
    //   <gaia-switch name="battery">
    //     <label data-l10n-id="battery">Battery save mode</label>
    //   </gaia-switch>
    // </li>
//    createButton: function createButton(name) {
//      var li = document.createElement('li');
//      var gaiaSwitch = document.createElement('gaia-switch');
//      var label =  document.createElement('label');
//      gaiaSwitch.name = 'quick-settings-' + name;
//      label.setAttribute('data-l10n-id', name);
//      label.textContent = name;
//      gaiaSwitch.appendChild(label);
//      li.appendChild(gaiaSwitch);
//
//      return li;
//    }
  };

  Config.header.addEventListener('action', event => {
    if (event.detail.type === 'close') { Config.close(); }
  });

  Config.init();

  exports.Config = Config;
})(window);
