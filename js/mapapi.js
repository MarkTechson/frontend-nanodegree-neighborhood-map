/* globals google */
var mapApi = mapApi || {};

(function(mapApi) {
    'use strict';

    var icons = {};
    var events = [];
    var markers = {};
    var selected;

    // This api method allows us to queue events to be registered when the map
    // has been loaded. Since the timing is unknown (defer async) we'll store the requests
    // and register them when the maps api is ready
    mapApi.registerEvent = function(name, callback) {
        events.push({name: name, callback: callback});
    };

    mapApi.registerIcon = function(icon, main, alt) {
        if(!icons[icon]) {
            icons[icon] = {};
        }

        icons[icon].main = main;
        icons[icon].alt = alt;
    }

    mapApi.highlightMarker = function(id, type, animate) {
        var timeout = -1;

        // If the selected exists, deselected it and clear the timeout
        if (selected) {
            clearTimeout(selected.timeout);
            markers[selected.id].setAnimation(null);
            markers[selected.id].setIcon(icons[selected.type].main);
        }

        markers[id].setIcon(icons[type].alt);

        if (animate) {
            // Shift the map to the location of the marker
            mapApi.map.panTo(markers[id].getPosition());
            // Set the marker to bounce
            markers[id].setAnimation(google.maps.Animation.BOUNCE);

            // Set a timeout to clear the animation after a second;
            var timeout = setTimeout(function () {
                markers[id].setAnimation(null);
            }, 700);
        }

        // Updated the selcted marker info
        selected = {
            id: id,
            timeout: timeout,
            type: type
        };
    };

    mapApi.addMarker = function(latLong, id, type, interactive) {
        if (interactive === undefined) {
            interactive = true;
        }

        var marker = new google.maps.Marker({
            map: mapApi.map,
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: latLong,
            icon: icons[type].main
        });

        if (interactive) {
            //Register the click event
            marker.addListener('click', function () {
                mapApi.highlightMarker(id, type, false);
            });
        }

        markers[id] = marker;
    };

    mapApi.showAllMarkers = function() {
        var markerKeys = Object.keys(markers);

        for (var i = 0; i < markerKeys.length; i++) {
            mapApi.showMarker(markerKeys[i]);
        }
    };

    mapApi.clearAllMarkers = function() {
        var markerKeys = Object.keys(markers);

        for (var i = 0; i < markerKeys.length; i++) {
            mapApi.clearMarker(markerKeys[i]);
        }

        markers = {};
    };

    mapApi.clearMarker = function(id) {
        toggleMarker(id, null);
    };

    mapApi.showMarker = function(id) {
        toggleMarker(id, mapApi.map);
    };

    mapApi.setHomeLocation = function(latLong, type) {
        mapApi.map.setCenter(latLong);
        mapApi.addMarker(latLong, 'user-home-location', type, false);
    };

    function toggleMarker(id, value) {
        markers[id].setMap(value);
    }

    mapApi.initMap = function() {
        // Configure the map
        mapApi.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -34.397, lng: 150.644},
            zoom: 6,
            mapTypeControl: false,
            minZoom: 10
        });

        var geocoder = new google.maps.Geocoder();
        // Configure geocoder service
        mapApi.geocodeByAddress = function (address, callback) {
            geocoder.geocode({'address': address}, function(results, status) {
                callback(results, status);
            });
        };

        // Define the auto complete
        mapApi.autocomplete = {};

        (function initAutoComplete() {
            var options = {
                types: ['geocode'],
                 componentRestrictions: {
                     country: 'us'
                 }
            };

            mapApi.autocomplete = new google.maps.places.Autocomplete(document.getElementById('address'), options);
            //register all of the events that were queued up
            events.forEach(function (event) {
                mapApi.autocomplete.addListener(event.name, event.callback);
            });
        })();
    };
})(mapApi);
