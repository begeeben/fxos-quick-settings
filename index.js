(function () {

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

  function initialize() {

    console.log('init quick settings');

    // // Borrow some code from Gaia shared/js/settings_listener.js
    // var _lock;
    // function sl_getSettingsLock() {
    //   if (_lock && !_lock.closed) { return _lock; }
    //   var settings = window.navigator.mozSettings;
    //   return (_lock = settings.createLock());
    // }

    // // Wire up an event listener to set brightness on slider change.
    // var sliderEl = $$('quick-brightness-control');
    // sliderEl.addEventListener('change', function (ev) {
    //   sl_getSettingsLock().set({
    //     'screen.brightness': sliderEl.value
    //   });
    // });

    //

    var quickSettingsContainer = document.querySelector('#quick-settings > ul');
    quickSettingsContainer.style.flexWrap = 'wrap';

    // <li><a href="#" id="quick-settings-wifi" class="icon bb-button" data-icon="wifi-4" data-enabled="false" role="button" data-l10n-id="quick-settings-wifiButton-off"></a></li>
    var settings = {
      volume: createButton('volume'),
      nfc: createButton('nfc'),
      flashlight: createButton('flashlight')
    };

    settings.volume.firstChild.dataset.icon = 'sound-max';
    settings.volume.firstChild.dataset.enabled = true;
    settings.volume.firstChild.dataset.l10nId = 'quick-settings-volumeButton-max';
    settings.nfc.firstChild.dataset.icon = 'nfc';
    settings.nfc.firstChild.dataset.enabled = false;
    settings.nfc.firstChild.dataset.l10nId = 'quick-settings-nfcButton-off';
    settings.flashlight.firstChild.dataset.icon = 'flash-off';
    settings.flashlight.firstChild.dataset.enabled = false;
    settings.flashlight.firstChild.dataset.l10nId = 'quick-settings-flashlightButton-off';

    var oldButton;
    for (var prop in settings) {
      oldButton = document.querySelector('#quick-settings-' + prop);
      if (oldButton) {
        quickSettingsContainer.removeChild(oldButton.parentNode);
      }
      quickSettingsContainer.appendChild(settings[prop]);
    }

    var allSettings = document.querySelectorAll('#quick-settings > ul > li');
    for (var i=0; i < allSettings.length; i++) {
      // allSettings[i].style.flex = '1 1 20%';
      allSettings[i].style.flex = '';
    }

  }

  function createButton (name) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.id = 'quick-settings-' + name;
    a.classList.add('icon');
    a.classList.add('bb-button');
    // a.dataset.icon = name;
    a.setAttribute('role', 'button');
    li.appendChild(a);

    return li;
  }


}());
