(function () {
    'use strict';

    var nsViewModel = {
        address: ko.observable(''),
        showWelcome: ko.observable(true),
        showLocations: ko.observable(true),
        useCurrentLocation: ko.observable(true),
        updateShowWelcome: function () {
            this.showWelcome(!this.showWelcome());
        },
        updateShowLocations: function () {
            console.log('invoked');
            this.showLocations(!this.showLocations());
        },
        submitAddress: function (target) {
            var vm = this;

            // Only submit the
            if (vm.address() && vm.address().trim().length > 0) {
                vm.showWelcome(false);
                document.getElementById('address').blur();
            }
        }
    };

    // Assign the bindings
    ko.applyBindings(nsViewModel);
})();
