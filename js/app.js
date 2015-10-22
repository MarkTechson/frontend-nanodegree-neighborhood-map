var app = app || {};

(function () {
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

        // Method defined on the vm
        vm.submitAddress = submitAddress;
        vm.updateShowLocations = updateShowLocations;
        vm.updateShowWelcome = updateShowWelcome;
        vm.showRandomLoadingMessage = ko.observable('');

        // Properties defined on the vm
        vm.locations = ko.observableArray(['Location', 'Mocation', 'Focation', 'Vocation']);
        vm.address = ko.observable('');
        vm.locationFilter = ko.observable('');
        vm.filteredLocations = ko.computed(filterLocationsCompOb);
        vm.showLocations = ko.observable(true);
        vm.showWelcome = ko.observable(true);
        vm.useCurrentLocation = ko.observable(true);
        vm.message = ko.observable('');
        vm.isError = ko.observable(false);

        function getRandomLoadingMessage(messages) {
            return messages[Math.floor(Math.random() * messages.length)];
        }

        function filterLocationsCompOb () {
            var filterTerm = vm.locationFilter().toLowerCase();
            var result = vm.locations();

            if (filterTerm.length > 0) {
                result = result.filter(function (item) {
                    var element = item ? item.toLowerCase() : '';

                    return element.indexOf(filterTerm) >= 0;
                });
            }
            return result;
        }
        function updateShowWelcome() {
            vm.showWelcome(!vm.showWelcome());
        }

        function updateShowLocations() {
            console.log('invoked');
            vm.showLocations(!vm.showLocations());
        }

        function submitAddress(target) {
            if (vm.address() && vm.address().trim().length > 0) {
                vm.message("Please wait - " + getRandomLoadingMessage(loadingMessages));
                vm.isError(false);

                app.geocodeByAddress(vm.address(), function (result, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        vm.message('');
                        console.log(result);
                    } else {
                        vm.isError(true);
                        vm.message('Error - ' + getRandomLoadingMessage(errorMessages) + '. Check your address.');
                    }
                });
                // vm.showWelcome(false);
                // document.getElementById('address').blur();
            }
        }
    }

    // Assign the bindings
    ko.applyBindings(new NSAppViewModel());
})();
