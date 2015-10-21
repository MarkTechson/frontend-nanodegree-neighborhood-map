(function (app) {
    'use strict';

    var welcomeDiv = document.getElementById('copy-and-address');
    var addressInput = document.getElementById('address');
    var addressForm = document.getElementById('addressForm');

    registerUIEvents();

    function registerUIEvents() {
        // There is a bug with android mobile that causes some forms to be hidden
        // by the softkeyboard, in this case, let's move the input to the top
        // of the screen
        var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;

        if(isAndroid) {
            addressInput.addEventListener('focus', function () {
                welcomeDiv.className = "welcome-content shift-top";
            });

            addressInput.addEventListener('blur', function () {
                welcomeDiv.className = "welcome-content shift-down";
            });
        }

        // On the submit event, hide the splash screen
        // addressForm.addEventListener('submit', function (e) {
        //     welcomeScreen.className = "welcome-screen hide-welcome-screen";
        //     addressInput.blur();
        //     e.preventDefault();
        // });
    }
})(app);
