/* globals google */
var mapApi = mapApi || {};

/**
 * Google Maps API wrapper that provides developers with convenience methods and provides an abstraction layer
 * for map specific functionality.
 */
(function(mapApi) {
    'use strict';

    var icons = {};
    var events = [];
    var markers = {};
    var infoWindow;
    var selected;
    var markerOnClickCallBack;

    /**
     * This api function allows us to queue events to be registered when the map
     * has been loaded. Since the timing is unknown (defer async) we'll store the requests
     * and register them when the maps api is ready.
     *
     * @param {String} name event name to be registered
     * @param {Function} callback function representing the callback to be invoked on the specified event
     */
    mapApi.registerEvent = function(name, callback) {
        events.push({name: name, callback: callback});
    };

    /**
     * Registers map marker icons with the api to be used on the map.
     *
     * @param {String} icon name of the icon for reference
     * @param {String} main the non-selected version of the icon
     * @param {String} alt the selected version of the icon (used in 'highlighting')
     */
    mapApi.registerIcon = function(icon, main, alt) {
        if(!icons[icon]) {
            icons[icon] = {};
        }

        icons[icon].main = main;
        icons[icon].alt = alt;
    };

    /**
     * Based on the parameters given a map maker is highlighted (i.e, drawn into focus)
     * and and if appropriate an infoWindow is displayed containing the content
     * provided.
     *
     * @param {String} id identifier of the map marker icon
     * @param {String} type identifies the type of icon (i.e, HOME, SCHOOL or some other user defined type)
     * @param {String} content markup to be displayed in the InfoWindow related to the map marker
     * @param {Boolean} animate should the map marker animate and show an InfoWindow
     */
    mapApi.highlightMarker = function(id, type, content, animate) {
        var timeout = -1;

        // If the selected exists, deselected it and clear the timeout
        if (selected) {
            clearTimeout(selected.timeout);
            markers[selected.id].setAnimation(null);
            markers[selected.id].setIcon(icons[selected.type].main);
        }

        markers[id].setIcon(icons[type].alt);

        // Open the infoWindow
        if (content.length > 0) {
            infoWindow.setContent(content);
            infoWindow.open(mapApi.map, markers[id]);
        }

        if (animate) {
            // Shift the map to the location of the marker
            mapApi.map.panTo(markers[id].getPosition());
            // Set the marker to bounce
            markers[id].setAnimation(google.maps.Animation.BOUNCE);

            // Set a timeout to clear the animation after a second;
            timeout = setTimeout(function () {
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

    /**
     * "Registers" an on-click callback to be executed when the user clicks on a
     * map marker.
     *
     * @param {Function} callback a function to be executed when a marker is clicked
     */
    mapApi.markerOnClick = function(callback) {
        markerOnClickCallBack = callback;
    };

    /**
     * Adds a marker to the map with the id, type of icon, content and interactive status
     * provided. This function also registers an onclick event to be called when a marker is clicked.
     * NOTE: Which ever function is referenced in the markerOnClickCallBack will be invoked.
     *
     * @param {LatLng} latLong a latitude/longitude object (google.maps.LatLng) of where to place this marker
     * @param {String} id unique identifier for this marker (for the marker cache)
     * @param {String} type sets the type of icon to be used (HOME, etc)
     * @param {String} content markup to be used in the InfoWindow for this marker
     * @param {Boolean} interactive whether or not this marker should animate on click (should the event be registered)
     */
    mapApi.addMarker = function(latLong, id, type, content, interactive) {
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
                mapApi.highlightMarker(id, type, content, true);

                if (markerOnClickCallBack) {
                    markerOnClickCallBack(id);
                }
            });
        }

        markers[id] = marker;
    };

    /**
     * Displays all of the markers on the map.
     */
    mapApi.showAllMarkers = function() {
        var markerKeys = Object.keys(markers);

        for (var i = 0; i < markerKeys.length; i++) {
            mapApi.showMarker(markerKeys[i]);
        }
    };

    /**
     * Removes all of the markers from the map and clears the selected property.
     * Once invoked, the markers are destroyed, not just hidden.
     */
    mapApi.clearAllMarkers = function() {
        var markerKeys = Object.keys(markers);

        for (var i = 0; i < markerKeys.length; i++) {
            mapApi.clearMarker(markerKeys[i]);
        }

        // Clear the selected marker as well
        selected = undefined;
        markers = {};
    };

    /**
     * Toggles a marker to no longer show on the map. Since a reference to the
     * marker still exists, the marker is not destroyed.
     *
     * @param {String} id identifier of the marker to be toggled off
     */
    mapApi.clearMarker = function(id) {
        toggleMarker(id, null);
    };

    /**
     * Toggles a marker to show on the map.
     *
     * @param {String} id identifier for the marker to be toggled on
     */
    mapApi.showMarker = function(id) {
        toggleMarker(id, mapApi.map);
    };

    /**
     * The home location uses a special id. This function creates a marker
     * with the type provided by the user at the specified location with no content
     * and no interactivity.
     *
     * @param {LatLng} latLong latitude/longitude (google.maps.LatLng) of the marker
     * @param {String} type used to specify which type of icon to use for this marker
     */
    mapApi.setHomeLocation = function(latLong, type) {
        mapApi.map.setCenter(latLong);
        mapApi.addMarker(latLong, 'user-home-location', type, '', false);
    };

    /**
     * Boostrap function to be called once the google maps API is looaded. This function
     * intiates the components used in this API (places, geocode and map)
     */
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

        // Configure the info window
        infoWindow = new google.maps.InfoWindow({
            maxWidth: 300
        });

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

    /**
     * Helper function to display or hide markers. If the marker toggle value (value)
     * matches the current value, make no change - this stops the map marker flicker
     *
     * @param {String} id id of the marker to be toggled
     * @param {Object|null} value this will either be a map or null (showing and hiding of the marker)
     */
    function toggleMarker(id, value) {
        if (markers[id]) {
            if (markers[id].getMap() !== value) {
                markers[id].setMap(value);
            }
        }
    }
})(mapApi);
