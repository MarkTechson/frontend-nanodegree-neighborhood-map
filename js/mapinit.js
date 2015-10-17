var app = app || {};

(function () {
    'use strict';
    app.initMap = function () {
        // Configure the map
        app.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -34.397, lng: 150.644},
            zoom: 6,
            mapTypeControl: false,
            minZoom: 10
        });
        console.log('In your right mind');
    };
})();
