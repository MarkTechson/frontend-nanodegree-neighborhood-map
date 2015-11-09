/**
 * 3rd party API integration component.  This API module provides access to the openweathermap service
 * and the BetterDoctor service.
 */
var api = api || {};

(function() {
    'use strict';

    var imagePreLoad = {};
    var doctorInfoTemplate = Handlebars.compile($('#infowindow-template').html());

    /**
     * Gets the weather based on the latitude and longitude parameter
     * @param {LatLng} latitude longitude object used in Google Maps
     * @returns {Promise} promise that can be resolved with the value of request
     */
    api.getWeather = function(latLong) {
        var API_KEY = '90deed4a81de156d7b12fa470d92c4d3';
        var url = 'http://api.openweathermap.org/data/2.5/weather?units=imperial&' + 'lat=' + latLong.lat() + '&lon=' + latLong.lng() + '&appid=' + API_KEY;

        return makeApiCall(url, void 0, function(deferred) {
            deferred.resolve({
                status: false
            });
        });
    };

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

                    // Helps prevent the chance of a uid collision
                    response.id = '**betterdoctor**' + practice.uid;
                    response.type = 'hospital';
                    response.latLong = {
                        lat: practice.lat,
                        lng: practice.lon
                    };
                    response.content = getInfoWindowContent(doctor);
                    response.address = getAddress(practice.visit_address);
                    response.gender = doctor.profile.gender;

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

        return makeApiCall(url + query + API_KEY, doneFn);
    };

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

    function getAddress(address) {
        var street2 = address.street2 ? address.street2 + ' ' : '';
        return address.street + ' ' + street2 + address.city + ', ' + address.state + ' ' + address.zip;
    }

    function preloadImage(imageUrl, callback) {
        imagePreLoad[imageUrl] = false;

        var img = new Image();
        img.onload = function() {
            imagePreLoad[this.src] = true;
            callback();
        };

        img.src = imageUrl;
    }

    function makeApiCall(url, doneFn, failFn) {
        var deferred = Q.defer();

        $.ajax(url)
        .done(function(result) {
            if (doneFn) {
                doneFn(result, deferred);
            } else {
                deferred.resolve(result);
            }
        })
        .fail(function(xhr, textStatus, errorThrown) {
            if (failFn) {
                failFn(deferred, [xhr, textStatus, errorThrown]);
            } else {
                deferred.reject([xhr, textStatus, errorThrown]);
            }
        });

        return deferred.promise;
    }
})();
