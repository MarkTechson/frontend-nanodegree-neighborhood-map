var app = app || {};

(function (app) {
    'use strict';

    document.getElementById('welcome-screen').addEventListener('click', function () {
        document.getElementById('welcome-screen').className = 'welcome-screen slide-up';
    });
})(app);
