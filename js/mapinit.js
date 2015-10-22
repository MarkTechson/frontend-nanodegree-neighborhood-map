var app = app || {};

(function (app) {
    'use strict';

    app.initMap = function () {
        // Configure the map
        app.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -34.397, lng: 150.644},
            zoom: 6,
            mapTypeControl: false,
            minZoom: 10
        });

        var geocoder = new google.maps.Geocoder();
        // Configure geocoder service
        app.geocodeByAddress = function (address, callback) {
            geocoder.geocode({'address': address}, function(results, status) {
                callback(results, status);
            });
        };
    };
})(app);
