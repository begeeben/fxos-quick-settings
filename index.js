(function () {

  // Borrowed from shared/js/settings_listener.js
  var SettingsListener = {
    /* lock stores here */
    _lock: null,

    /* keep record of observers in order to remove them in the future */
    _observers: [],

    /**
     * getSettingsLock: create a lock or retrieve one that we saved.
     * mozSettings.createLock() is expensive and lock should be reused
     * whenever possible.
     */
    getSettingsLock: function sl_getSettingsLock() {
      // If there is a lock present we return that
      if (this._lock && !this._lock.closed) {
        return this._lock;
      }

      // If there isn't we return one.
      var settings = window.navigator.mozSettings;

      return (this._lock = settings.createLock());
    },

    observe: function sl_observe(name, defaultValue, callback) {
      var settings = window.navigator.mozSettings;
      if (!settings) {
        window.setTimeout(function() { callback(defaultValue); });
        return;
      }

      var req;
      try {
        req = this.getSettingsLock().get(name);
      } catch (e) {
        // It is possible (but rare) for getSettingsLock() to return
        // a SettingsLock object that is no longer valid.
        // Until https://bugzilla.mozilla.org/show_bug.cgi?id=793239
        // is fixed, we just catch the resulting exception and try
        // again with a fresh lock
        console.warn('Stale lock in settings_listener.js.',
                     'See https://bugzilla.mozilla.org/show_bug.cgi?id=793239');
        this._lock = null;
        req = this.getSettingsLock().get(name);
      }

      req.addEventListener('success', (function onsuccess() {
        callback(typeof(req.result[name]) != 'undefined' ?
          req.result[name] : defaultValue);
      }));

      var settingChanged = function settingChanged(evt) {
        callback(evt.settingValue);
      };
      settings.addObserver(name, settingChanged);
      this._observers.push({
        name: name,
        callback: callback,
        observer: settingChanged
      });
    },

    unobserve: function sl_unobserve(name, callback) {
      var settings = window.navigator.mozSettings;
      var that = this;
      this._observers.forEach(function(value, index) {
        if (value.name === name && value.callback === callback) {
          settings.removeObserver(name, value.observer);
          that._observers.splice(index, 1);
        }
      });
    }
  };

  // If injecting into an app that was already running at the time
  // the app was enabled, simply initialize it.
  if (document.documentElement) {
    initialize();
  }

  // Otherwise, we need to wait for the DOM to be ready before
  // starting initialization since add-ons are usually (always?)
  // injected *before* `document.documentElement` is defined.
  else {
    window.addEventListener('DOMContentLoaded', initialize);
  }

  // var SettingsListener = window.wrappedJSObject.SettingsListener;

  function initialize() {
    // console.log('init quick settings');
    // console.log('SettingsListener', window.wrappedJSObject.SettingsListener);

    var quickSettingsContainer = document.querySelector('#quick-settings > ul');
    quickSettingsContainer.style.flexWrap = 'wrap';

    // Remove previously appended buttons if any
    var lastButton = document.querySelector('#quick-settings-full-app').parentNode;
    while (lastButton.nextSibling) {
      quickSettingsContainer.removeChild(lastButton.nextSibling);
    }

    // Template:
    // <li><a href="#" id="quick-settings-wifi" class="icon bb-button" data-icon="wifi-4" data-enabled="false" role="button" data-l10n-id="quick-settings-wifiButton-off"></a></li>
    var settings = {
      nfc: createButton('nfc'),
      volume: createButton('volume'),
      flashlight: createButton('flashlight'),
      hotspot: createButton('hotspot'),
      orientation: createButton('orientation'),
      powersave: createButton('powersave'),
      location: createButton('location'),
      developer: createButton('developer')
    };

    initVolumeButton(settings.volume.firstChild);
    initNfcButton(settings.nfc.firstChild);
    initFlashButton(settings.flashlight.firstChild);
    initHotSpotButton(settings.hotspot.firstChild);
    initOrientationButton(settings.orientation.firstChild);
    initPowersaveButton(settings.powersave.firstChild);
    initLocationButton(settings.location.firstChild);
    initDeveloperButton(settings.developer.firstChild);

    for (var prop in settings) {
      quickSettingsContainer.appendChild(settings[prop]);
    }

    // XXX: Add 2 additional li as placeholders to layout buttons correctly
    quickSettingsContainer.appendChild(document.createElement('li'));
    quickSettingsContainer.appendChild(document.createElement('li'));

    var allSettings = document.querySelectorAll('#quick-settings > ul > li');
    for (var i=0; i < allSettings.length; i++) {
      allSettings[i].style.flex = '1 1 20%';
    }
  }

  function createButton(name) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.id = 'quick-settings-' + name;
    a.classList.add('icon');
    a.classList.add('bb-button');
    a.setAttribute('role', 'button');
    li.appendChild(a);

    return li;
  }

  function initVolumeButton(button) {

    var originalVolume = 0;

    function onVolumeChanged(value) {
      if (value > 14) {
        button.dataset.icon = 'sound-max';
        button.dataset.l10nId = 'quick-settings-volumeButton-max';
      } else if (value < 1) {
        button.dataset.icon = 'mute';
        button.dataset.l10nId = 'quick-settings-volumeButton-mute';
      } else {
        button.dataset.icon = 'sound-min';
        button.dataset.l10nId = 'quick-settings-volumeButton-min';
      }

      originalVolume = value > 0 ? value : originalVolume;
    }

    function onClick() {
      if (button.dataset.icon === 'mute') {
        window.navigator.mozSettings.createLock().set({'audio.volume.notification': originalVolume});
      } else {
        window.navigator.mozSettings.createLock().set({'audio.volume.notification': 0});
      }
    }

    button.dataset.icon = 'sound-max';
    // button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-volumeButton-max';
    button.addEventListener('click', onClick);

    SettingsListener.observe('audio.volume.notification', '', onVolumeChanged);
  }

  function initNfcButton(button) {

    function onNfcStatusChanged(status) {
      if (status === 'enabling' || status === 'enabled') {
        button.style.color = '#008EAB';
        button.dataset.enabled = true;
        button.dataset.l10nId = 'quick-settings-nfcButton-on';
      } else if (status === 'disabling' || status === 'disabled') {
        button.style.color = '';
        button.dataset.enabled = false;
        button.dataset.l10nId = 'quick-settings-nfcButton-off';
      }
    }

    function onClick() {
      if (button.dataset.enabled === 'true') {
        window.navigator.mozSettings.createLock().set({'nfc.enabled': false});
      } else {
        window.navigator.mozSettings.createLock().set({'nfc.enabled': true});
      }
    }

    button.dataset.icon = 'nfc';
    button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-nfcButton-off';
    button.addEventListener('click', onClick);

    SettingsListener.observe('nfc.status', undefined, onNfcStatusChanged);
  }

  function initFlashButton(button) {

    var options = {
      mode: 'video'
    };

    var cameraId = window.navigator.mozCameras.getListOfCameras()[0];
    var mozCamera;

    // need to check if the current app uses camera or not, show an error toast if yes

    // need to release camera when the screen is on after it went black

    // before getCamera, need to check if any app other than the current app occupies the camera,
    // release the camera if yes

    function onClick () {
      console.log('onClick', button.dataset.enabled);
      if (button.dataset.enabled === 'true') {
        console.log('release camera');
        mozCamera.release();

        button.dataset.icon = 'flash-off';
        button.dataset.enabled = false;
        button.dataset.l10nId = 'quick-settings-flashlightButton-off';
      } else {
        console.log('get camera');
        window.navigator.mozCameras.getCamera(cameraId, options)
        .then(function (result) {
          console.log('set flash on');
          mozCamera = result.camera;
          mozCamera.flashMode = 'torch';
        }, function (error) {
          console.log(error);
        }).catch(function (e) {
          console.log('catch', e);
        });

        button.dataset.icon = 'flash-on';
        button.dataset.enabled = true;
        button.dataset.l10nId = 'quick-settings-flashlightButton-on';
      }
    }

    button.dataset.icon = 'flash-off';
    button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-flashlightButton-off';
    button.addEventListener('click', onClick);
  }

  function initHotSpotButton(button) {

    function onHotSpotStatusChanged(status) {
      if (status) {
        button.style.color = '#008EAB';
        button.dataset.enabled = true;
        button.dataset.l10nId = 'quick-settings-hotSpotButton-on';
      } else {
        button.style.color = '';
        button.dataset.enabled = false;
        button.dataset.l10nId = 'quick-settings-hotSpotButton-off';
      }
    }

    function onClick() {
      if (button.dataset.enabled === 'true') {
        window.navigator.mozSettings.createLock().set({'tethering.wifi.enabled': false});
      } else {
        window.navigator.mozSettings.createLock().set({'tethering.wifi.enabled': true});
      }
    }

    button.dataset.icon = 'tethering';
    button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-hotspotButton-off';
    button.addEventListener('click', onClick);

    SettingsListener.observe('tethering.wifi.enabled', false, onHotSpotStatusChanged);
  }

  function initOrientationButton(button) {

    function onOrientationStatusChanged(status) {
      if (status) {
        button.style.color = '#008EAB';
        button.dataset.enabled = true;
        button.dataset.l10nId = 'quick-settings-orientButton-on';
      } else {
        button.style.color = '';
        button.dataset.enabled = false;
        button.dataset.l10nId = 'quick-settings-orientButton-off';
      }
    }

    function onClick() {
      if (button.dataset.enabled === 'true') {
        window.navigator.mozSettings.createLock().set({'screen.orientation.lock': false});
      } else {
        window.navigator.mozSettings.createLock().set({'screen.orientation.lock': true});
      }
    }

    button.dataset.icon = 'toggle-camera-front';
    button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-orientationButton-off';
    button.addEventListener('click', onClick);

    SettingsListener.observe('screen.orientation.lock', false, onOrientationStatusChanged);
  }

  function initPowersaveButton(button) {

    function onPowersaveStatusChanged(status) {
      if (status) {
        button.style.color = '#008EAB';
        button.dataset.enabled = true;
        button.dataset.l10nId = 'quick-settings-powersaveButton-on';
      } else {
        button.style.color = '';
        button.dataset.enabled = false;
        button.dataset.l10nId = 'quick-settings-powersaveButton-off';
      }
    }

    function onClick() {
      if (button.dataset.enabled === 'true') {
        window.navigator.mozSettings.createLock().set({'powersave.enabled': false});
      } else {
        window.navigator.mozSettings.createLock().set({'powersave.enabled': true});
      }
    }

    button.dataset.icon = 'battery-3';
    button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-powersaveButton-off';
    button.addEventListener('click', onClick);

    SettingsListener.observe('powersave.enabled', false, onPowersaveStatusChanged);
  }

  function initLocationButton(button) {

    function onLocationStatusChanged(status) {
      if (status) {
        button.style.color = '#008EAB';
        button.dataset.enabled = true;
        button.dataset.l10nId = 'quick-settings-locationButton-on';
      } else {
        button.style.color = '';
        button.dataset.enabled = false;
        button.dataset.l10nId = 'quick-settings-locationButton-off';
      }
    }

    function onClick() {
      if (button.dataset.enabled === 'true') {
        window.navigator.mozSettings.createLock().set({'geolocation.enabled': false});
      } else {
        window.navigator.mozSettings.createLock().set({'geolocation.enabled': true});
      }
    }

    button.dataset.icon = 'location';
    button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-locationButton-off';
    button.addEventListener('click', onClick);

    SettingsListener.observe('geolocation.enabled', false, onLocationStatusChanged);
  }

  function initDeveloperButton(button) {
    function onClick() {
      new MozActivity({
        name: 'configure',
        data: {
          target: 'device',
          section: 'developer'
        }
      });
    }

    button.dataset.icon = 'bug';
    button.dataset.enabled = false;
    button.dataset.l10nId = 'quick-settings-developerButton-off';
    button.addEventListener('click', onClick);
  }
}());
