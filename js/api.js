/* globals Handlebars, $, Q */

/**
 * 3rd party API integration component.  This API module provides access to the openweathermap service
 * and the BetterDoctor service.
 */
var api = api || {};

(function() {
    'use strict';

    var imagePreLoad = {};

    // Prepare the handlebars template
    var doctorInfoTemplate = Handlebars.compile($('#infowindow-template').html());

    /**
     * Gets the weather based on the latitude and longitude parameter.
     *
     * @param {LatLng} latLong latitude longitude object used in Google Maps
     * @returns {Promise} promise that can be resolved with the value of request
     */
    api.getWeather = function(latLong) {
        var API_KEY = '90deed4a81de156d7b12fa470d92c4d3';
        var url = 'http://api.openweathermap.org/data/2.5/weather?units=imperial&' + 'lat=' + latLong.lat() + '&lon=' + latLong.lng() + '&appid=' + API_KEY;

        // Make the API call and pass in the fail function to handle any errors
        return makeApiCall(url, void 0, function(deferred) {
            deferred.resolve({
                status: false
            });
        });
    };

    /**
     * Gets the doctor data based on the latitude and longitude parameter and the
     * distance parameter.
     *
     * @param {LatLng} latLong latitude longitude object used in Google Maps
     * @param {Number|String} distance the distance in miles from the lat/long provide to be used in the search
     */
    api.getDoctors = function(latLong, distance) {
        var API_KEY = '33e85e7a0c2c240bd3471c355f159084';
        var url = 'https://api.betterdoctor.com/2015-01-27/doctors?';
        var query = 'location=' + latLong.lat() + '%2C' + latLong.lng() + '%2C' + distance + '&user_location=' + latLong.lat() + '%2C' + latLong.lng() + '&skip=0&limit=10&user_key=';

        // Define the custom success function that knows how to
        // process the data returned from the end point defined here
        var doneFn = function(result, deferred) {
            var responseList = [];

            if (!result.data) {
                deferred.reject(new Error('betterdoctor API Request Failed'));
            } else {
                result.data.forEach(function (doctor) {
                    var response = {};
                    var practice = doctor.practices[0];

                    // Give each of the practices a unique id
                    response.id = '**betterdoctor**' + doctor.uid;
                    response.type = 'hospital';
                    response.latLong = {
                        lat: practice.lat,
                        lng: practice.lon
                    };
                    response.content = getInfoWindowContent(doctor);
                    response.address = getAddress(practice.visit_address);
                    response.gender = doctor.profile.gender;
                    response.distance = parseFloat(practice.distance).toFixed(2);
                    response.name = practice.name;

                    // This pre-load effort is to try and take advantage
                    // of the browser cache
                    preloadImage(doctor.profile.image_url, function() {
                        var images = Object.keys(imagePreLoad);
                        var resolve = true;

                        for(var i = 0; i < images.length; i++) {
                            if(!imagePreLoad[images[i]]) {
                                resolve = false;
                                break;
                            }

                            if (resolve) {
                                deferred.resolve(responseList);
                            }
                        }
                    });

                    responseList.push(response);
                });
            }
        };

        // This function will be run in the event the data call
        // fails
        function failFn(deferred) {
            deferred.resolve({
                status: false
            });
        }

        return makeApiCall(url + query + API_KEY, doneFn, failFn);
    };

    /**
     * Creates creates an html template to be used for the information
     * window popups on the map. The doctor information is parsed and then
     * passed to the handlebars template.
     *
     * @param {Object} doctor object to be used in the template
     * @returns {String} html template
     */
    function getInfoWindowContent(doctor) {
        // Create the content object to be used with the template
        var content = {};

        if (doctor.practices.length === 0) {
            content.name = '';
            content.address = '';
        } else {
            content.name = doctor.practices[0].name;
            content.address = getAddress(doctor.practices[0].visit_address);
        }

        content.profilePicture = doctor.profile.image_url;
        content.attributionUrl = doctor.attribution_url;

        if (doctor.profile.bio.length === 0) {
            content.bio = 'Find more information by clicking the "View Full Profile" link above.';
        } else {
            content.bio = doctor.profile.bio;
        }

        return doctorInfoTemplate(content);
    }

    /**
     * Helper function used to format an address into a displayable
     * format to be used in the application.
     *
     * @param {Object} address object representing the address
     * @returns {String} formatted address string
     */
    function getAddress(address) {
        var street2 = address.street2 ? address.street2 + ' ' : '';
        return address.street + ' ' + street2 + address.city + ', ' + address.state + ' ' + address.zip;
    }

    /**
     * Makes a request for the image passed in and then executes the
     * callback function parameter once the image loads
     *
     * @param {String} imageUrl url representing the image
     * @param {Function} callback function to be executed once the image has loaded
     */
    function preloadImage(imageUrl, callback) {
        imagePreLoad[imageUrl] = false;

        var img = new Image();
        img.onload = function() {
            imagePreLoad[this.src] = true;
            callback();
        };

        img.src = imageUrl;
    }

    /**
     * This function acts as a template for making a request to an service. The optional
     * parameters allow the developer to have special functionality executed on the success
     * or failure of the API call or by default return the result from the ajax function. This function
     * uses promises to allow developers to chain requests together and curry the results.
     *
     * @param {String} url the url to place the call to
     * @param {Function} doneFn a function to be executed when the done method has been called. If ommitted,
     *                   the deffered promise is resolved with the result of the api call.
     * @param {Function} failFn a function to be executed when the fail method has been called. If ommitted,
     *                   the deffered promise is rejected with the error information from the call.
     * @returns {Promise} returns a promise. See https://github.com/kriskowal/q for more details.
     */
    function makeApiCall(url, doneFn, failFn) {
        var deferred = Q.defer();

        $.ajax(url)
        .done(function(result) {
            // If a custom done function is provided, call it
            if (doneFn) {
                doneFn(result, deferred);
            } else {
                deferred.resolve(result);
            }
        })
        .fail(function(xhr, textStatus, errorThrown) {
            // If a custom fail function is provided, call it
            if (failFn) {
                failFn(deferred, [xhr, textStatus, errorThrown]);
            } else {
                deferred.reject([xhr, textStatus, errorThrown]);
            }
        });

        return deferred.promise;
    }
})();
