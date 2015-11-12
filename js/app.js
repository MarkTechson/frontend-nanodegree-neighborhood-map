/* globals ko, mapApi, api */

/**
 * Application ViewModel for the Private Practice application.
 */
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
        vm.isLocationSelected = isLocationSelected;

        // Properties defined on the vm
        vm.selectedId = ko.observable('');
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

        /**
         * Initialization function for configuring and initializing components
         * to be used in the view model.
         */
        function init() {
            // Regsister an event to keep track if the place changed
            mapApi.registerEvent('place_changed', function () {
                vm.address(mapApi.autocomplete.getPlace().formatted_address);
                submitAddress();
            });

            mapApi.markerOnClick(function (id) {
                vm.selectedId(id);
            });
            // Register the icons
            mapApi.registerIcon(HOME, '../img/home.png', '../img/home.png');
            mapApi.registerIcon(MUSEUM, '../img/museum-historical.png', '../img/museum-historical-selected.png');
            mapApi.registerIcon(RESTAURANT, '../img/restaurant.png',  '../img/restaurant-selected.png');
            mapApi.registerIcon(SCHOOL, '../img/university.png', '../img/university-selected.png');
            mapApi.registerIcon(HOSPITAL, '../img/hospital.png', '../img/hospital-selected.png');
        }

        /**
         * Highlights a location on the map based on the location object parameter
         *
         * @param {Object} location the location (likely selected by the user) to highlight on the map
         */
        function selectLocation(location) {
            vm.selectedId(location.id);
            mapApi.highlightMarker(location.id, location.type, location.content, true);
        }

        /**
         * Determines if the location is currently selceted by the user
         *
         * @param {String} id the id for the location from the UI in question
         */
        function isLocationSelected(id) {
            return id === vm.selectedId();
        }
        /**
         * Clears any displayed messages and sets the error state to false.
         */
        function clearMessages() {
            vm.message('');
            vm.isError(false);
        }

        /**
         * Clears markers and messages on UI and map
         */
        function resetUI() {
            clearMessages();
            mapApi.clearAllMarkers();
        }

        /**
         * Based on the location parameter provided update the map information
         *
         * @param {Object} location the location of the focal point on the map
         */
        function setAddress(location) {
            updateMapWithLocationData(location.geometry.location);
        }

        /**
         * Removes all of the possible locations
         */
        function clearPossibleLocations() {
            vm.possibleLocations([]);
        }

        /**
         * Finds a random message from the list of messages
         *
         * @param {Array} messages a list of messages
         * @returns {String} message a randomly selected message
         */
        function getRandomLoadingMessage(messages) {
            return messages[Math.floor(Math.random() * messages.length)];
        }

        /**
         * Computed observable function that filters the list of locations displayed on the map
         * across three data points (name, address or doctor gender). For text searches it performs
         * a case insensitive seach.
         *
         * @returns {Array} filtered locations
         */
        function filterLocationsCompOb() {
            var filterTerm = vm.locationFilter().toLowerCase();

            //Filter the locations property on the ViewModel
            var result = vm.locations().filter(function (location) {
                var genderFlag = true;
                var textFlag = true;
                var keepAddress = true;

                var address;
                var name;

                // Filter by gender
                if (vm.doctorGender() !== "both") {
                    genderFlag = location.gender === vm.doctorGender();
                }

                // Filter by name or address
                if (filterTerm.length > 0) {
                    address = location.address ? location.address.toLowerCase() : '';
                    name = location.name ? location.name.toLowerCase() : '';

                    textFlag = address.indexOf(filterTerm) >= 0 || name.indexOf(filterTerm) >= 0;
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

        /**
         * Highlights the home marker on the map
         */
        function showHome() {
            mapApi.highlightMarker('user-home-location', HOME, '', true);
        }

        /**
         * Toggles the "Show Welcome" property on the ViewModel which controls
         * wether or not the welcome/landing screen is visible.
         */
        function updateShowWelcome() {
            vm.showWelcome(!vm.showWelcome());
        }

        /**
         * Toggles the "Show Location" property on the ViewModel which controls
         * whether or not the locations panel is shown
         */
        function updateShowLocations() {
            vm.showLocations(!vm.showLocations());
        }

        /**
         * Performs the submission of the address and searching function for the application.
         * If the location is valid, then a search is performed by the application for location related data.
         */
        function submitAddress() {
            var selectedPlace = mapApi.autocomplete.getPlace() || {};

            // Clear any UI messages
            clearMessages();

            if (selectedPlace.place_id) {
                vm.isLoading(true);
                resetUI();
                vm.message("Please wait - " + getRandomLoadingMessage(loadingMessages));

                updateMapWithLocationData(selectedPlace.geometry.location);
            }
        }

        /**
         * Updates the map with information returned from the data requests to get the local
         * weather and a request to get the doctors for the specified region.
         *
         * @param {Object} location the location to be used in the data requests
         */
        function updateMapWithLocationData(location) {
            vm.locations([]);
            vm.currentWeather('');
            mapApi.setHomeLocation(location, HOME);
            vm.doctorGender('both');
            vm.selectedId('');

            api.getWeather(location).then(function(result) {
                // Process the weather data
                if (result.status !== false) {
                    vm.currentWeather(result.main.temp + '');
                }

                // Request the doctor information based on the location provided and distance
                return api.getDoctors(location, distance).then(function (doctorResult) {
                    if (doctorResult.status !== false) {
                        // Process the doctor locations
                        doctorResult.forEach(function (doctor) {
                            vm.locations.push(doctor);
                            mapApi.addMarker(doctor.latLong, doctor.id, doctor.type, doctor.content, true);
                        });

                        clearMessages();
                        updateShowWelcome();
                        vm.isLoading(false);
                    } else {
                        vm.isLoading(false);
                        vm.isError(true);
                        vm.message("Yikes! " + getRandomLoadingMessage(errorMessages));
                    }
                });
            });
        }
    }

    // Assign the bindings
    ko.applyBindings(new NSAppViewModel());
})();
