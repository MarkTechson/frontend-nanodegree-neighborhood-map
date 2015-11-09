/* globals ko, google, mapApi, api */

(function() {
    'use strict';

    function NSAppViewModel() {
        //viewmodel context
        var vm = this;
        var errorMessages = [
            'looks like we might have put the cart before the horse',
            'something went wrong, wanna try again',
            'this definitely does NOT look like what you requested',
            'let\'s be honest - something is not working right',
            'it\'s not you, it\'s me! Maybe...try again',
            'ERROR, CANNOT COMPUTE ROBOT SAYS PROBLEM',
            'the truth? No data came back...sorry'
        ];
        var loadingMessages = [
            'pay no attention to the man behind the curtain',
            'finding the crayons to draw the map',
            'while you are waiting, could you pass me that soda?',
            'loading data...bit by marvelous bit',
            'is that really the place you are thinking of moving? COOL!',
            'your wish is our command...line...statement...',
            'thank you for your patience, please enjoy this donut',
            'quick question: is it Cub fan or Cubs fan?',
            'hey, wait around here often?',
            'all the fun awaits...once this data shows up.',
            'clean up on aisle 2',
            'wow, you really want this data so bad you\'re willing to wait?',
            'while you wait, do some pushups - it is good for you'
        ];

        // Distance from origin in miles
        var distance = 10;

        // Constants for the application
        var HOME = 'home';
        var MUSEUM = 'museum';
        var RESTAURANT = 'restaurant';
        var SCHOOL = 'school';
        var HOSPITAL = 'hospital';

        // Method defined on the vm
        vm.submitAddress = submitAddress;
        vm.updateShowLocations = updateShowLocations;
        vm.updateShowWelcome = updateShowWelcome;
        vm.setAddress = setAddress;
        vm.clearPossibleLocations = clearPossibleLocations;
        vm.selectLocation = selectLocation;
        vm.showHome = showHome;

        // Properties defined on the vm
        vm.currentWeather = ko.observable('');
        vm.showRandomLoadingMessage = ko.observable('');
        vm.locations = ko.observableArray([]);
        vm.address = ko.observable('');
        vm.locationFilter = ko.observable('');
        vm.doctorGender = ko.observable('both');
        vm.filteredLocations = ko.computed(filterLocationsCompOb);
        vm.showLocations = ko.observable(true);
        vm.showWelcome = ko.observable(true);
        vm.useCurrentLocation = ko.observable(true);
        vm.message = ko.observable('');
        vm.isError = ko.observable(false);
        vm.possibleLocations = ko.observableArray([]);
        vm.hasPossibleLocations = ko.computed(function () {
            return vm.possibleLocations().length > 0;
        });
        vm.isLoading = ko.observable(false);

        // Initialize components
        init();

        function init () {
            // Regsister an event to keep track if the place changed
            mapApi.registerEvent('place_changed', function () {
                vm.address(mapApi.autocomplete.getPlace().formatted_address);
            });

            // Register the icons
            mapApi.registerIcon(HOME, '../img/home.png', '../img/home.png');
            mapApi.registerIcon(MUSEUM, '../img/museum-historical.png', '../img/museum-historical-selected.png');
            mapApi.registerIcon(RESTAURANT, '../img/restaurant.png',  '../img/restaurant-selected.png');
            mapApi.registerIcon(SCHOOL, '../img/university.png', '../img/university-selected.png');
            mapApi.registerIcon(HOSPITAL, '../img/hospital.png', '../img/hospital-selected.png');
        }


        function selectLocation(location) {
            mapApi.highlightMarker(location.id, location.type, location.content, true);
        }

        function clearMessages() {
            vm.message('');
            vm.isError(false);
        }

        function resetUI() {
            clearMessages();
            mapApi.clearAllMarkers();
        }

        function setAddress(location) {
            updateMapWithLocationData(location.geometry.location);
        }

        function clearPossibleLocations() {
            vm.possibleLocations([]);
        }

        function getRandomLoadingMessage(messages) {
            return messages[Math.floor(Math.random() * messages.length)];
        }

        function filterLocationsCompOb () {
            var filterTerm = vm.locationFilter().toLowerCase();

            var result = vm.locations().filter(function (location) {
                var genderFlag = true;
                var textFlag = true;
                var keepAddress = true;

                var address;

                // Filter by gender
                if (vm.doctorGender() !== "both") {
                    genderFlag = location.gender === vm.doctorGender();
                }

                // Filter by match
                if (filterTerm.length > 0) {
                    address = location.address ? location.address.toLowerCase() : '';
                    textFlag = address.indexOf(filterTerm) >= 0;
                }

                keepAddress = genderFlag && textFlag;

                if (keepAddress) {
                    mapApi.showMarker(location.id);
                } else {
                    mapApi.clearMarker(location.id);
                }

                return keepAddress;
            });

            return result;
        }

        function showHome() {
            mapApi.highlightMarker('user-home-location', HOME, '', true);
        }

        function updateShowWelcome() {
            vm.showWelcome(!vm.showWelcome());
        }

        function updateShowLocations() {
            vm.showLocations(!vm.showLocations());
        }

        function submitAddress() {
            var selectedPlace = mapApi.autocomplete.getPlace() || {};

            // Clear any UI messages
            clearMessages();

            selectedPlace.name = selectedPlace.name ? selectedPlace.name : vm.address();

            if (selectedPlace.name.trim().length > 0) {
                vm.isLoading(true);
                resetUI();
                vm.message("Please wait - " + getRandomLoadingMessage(loadingMessages));

                // Check to see if user selected an autocomplete option
                if (selectedPlace.place_id) {
                    updateMapWithLocationData(selectedPlace.geometry.location);
                } else {
                    mapApi.geocodeByAddress(selectedPlace.name, function (result, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            clearMessages();
                            if (result.length > 1) {
                                // Present the user with an option to select which address
                                // to use
                                vm.possibleLocations(result);
                            } else {
                                vm.address(result[0].formatted_address);
                                updateMapWithLocationData(result[0].geometry.location);
                            }
                        } else {
                            vm.isError(true);
                            vm.message('Error - ' + getRandomLoadingMessage(errorMessages) + '. Check your address.');
                        }
                    });
                }
            }
        }

        function updateMapWithLocationData(location) {
            vm.locations([]);
            vm.currentWeather('');
            mapApi.setHomeLocation(location, HOME);

            api.getWeather(location).then(function(result) {
                // Process the weather data
                if (result.status !== false) {
                    vm.currentWeather(result.main.temp);
                }

                return api.getDoctors(location, distance).then(function (doctorResult) {
                    // Process the doctor locations
                    doctorResult.forEach(function (doctor) {
                        vm.locations.push(doctor);
                        mapApi.addMarker(doctor.latLong, doctor.id, doctor.type, doctor.content, true);
                    });

                    clearMessages();
                    updateShowWelcome();
                    vm.isLoading(false);
                });
            });
        }

    }

    // Assign the bindings
    ko.applyBindings(new NSAppViewModel());
})();
