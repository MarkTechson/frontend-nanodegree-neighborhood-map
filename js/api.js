var api = api || {};

(function() {
    'use strict';

    api.getWeather = function(latLong) {
        var API_KEY = '90deed4a81de156d7b12fa470d92c4d3';
        var url = 'http://api.openweathermap.org/data/2.5/weather?' + 'lat=' + latLong.lat() + '&lon=' + latLong.lng() + '&appid=' + API_KEY;

        return makeApiCall(url);
    };

    api.getDoctors = function (latLong, distance) {
        var API_KEY = '33e85e7a0c2c240bd3471c355f159084';
        var url = 'https://api.betterdoctor.com/2015-01-27/doctors?';
        var query = 'location=' + latLong.lat() + '%2C' + latLong.lng() + '%2C' + distance + '&user_location=' + latLong.lat() + '%2C' + latLong.lng() + '&skip=0&limit=10&user_key=';

        // Define the custom success function that knows how to
        // process the data returned from the end point defined here
        var doneFn = function (result, deferred) {
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

                    // Format the address
                    var address = practice.visit_address;
                    var street2 = address.street2 ? address.street2 + ' ' : '';

                    response.address = address.street + ' ' + street2 + address.city + ', ' + address.state + ' ' + address.zip;
                    responseList.push(response);
                });

                deferred.resolve(responseList);
            }
        };

        return makeApiCall(url + query + API_KEY, doneFn);
    };

    function makeApiCall(url, doneFn) {
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
            deferred.reject([xhr, textStatus, errorThrown]);
        });

        return deferred.promise;
    }
})();
