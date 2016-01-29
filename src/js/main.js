
// Date Picker functions Bootstrap
$(function () {
    $('.datetimepickerDate').datepicker();
    // $('#datetimepicker3').datetimepicker({
    //   pickDate: false
    // });
    // $('#datetimepicker4').datetimepicker({
    //   pickDate: false
    // });


});

//Google Address Autocomplete
//This will allow a user to begin putting in an address and use google to find it and complete the adrress

var autocomplete;
var componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    country: 'long_name',
    postal_code: 'short_name'
};

function initAutocomplete() {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  autocomplete = new google.maps.places.Autocomplete(
      (document.getElementById('eventLocationAddress')),
      {types: ['geocode']});

  // When the user selects an address from the dropdown, populate the address
  // fields in the form.
  autocomplete.addListener('place_changed', fillInAddress);
}

// function fillInAddress() {
//   // Get the place details from the autocomplete object.
//   var place = autocomplete.getPlace();

//   for (var component in componentForm) {
//     document.getElementById(component).value = '';
//     document.getElementById(component).disabled = false;
//   }

//   // Get each component of the address from the place details
//   // and fill the corresponding field on the form.
//   for (var i = 0; i < place.address_components.length; i++) {
//     var addressType = place.address_components[i].types[0];
//     if (componentForm[addressType]) {
//       var val = place.address_components[i][componentForm[addressType]];
//       document.getElementById(addressType).value = val;
//     }
//   }
// }

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

// HTML canvas creating the invitation using knockout observables

$(document).ready(function(){ 

function MyViewModel() {
    var self = this;
    self.eventForm = ko.observable(true);
    self.eventType = ko.observable('');
    self.eventName = ko.observable('');
    self.hostName = ko.observable('');
    self.hostPTN = ko.observable('');
    self.eventLocationName = ko.observable('');
    self.eventLocationAddress = ko.observable('');
    self.eventStartDate = ko.observable('');
    self.startTime = ko.observable('');
    self.eventEndDate = ko.observable('');
    self.endTime = ko.observable('');
    self.datevisible = ko.observable(false);
    self.eventMessage = ko.observable('');
    self.addEndButton = ko.observable('Add End Date');
    self.personalForm = ko.observable(false);
    self.moreDetails = ko.observable(false);
    self.guestButton = ko.observable('Create Guest List');
    self.guestList = ko.observable(false);
    self.guestName = ko.observable('');
    self.guestEmail = ko.observable('');
    self.guestListArray = ko.observableArray('');
    self.dateButtonClass = ko.observable('btn btn-default');
    self.detailButtonText = ko.observable('Add Detail Profile');
    self.detailButtonClass = ko.observable('btn btn-default');


    
    self.printEventName = ko.computed(function() {
        return self.eventName();
    });
    self.printName = ko.computed(function() {
        return self.hostName();
    });
    self.printHostPTN = ko.computed(function() {
        return self.hostPTN();
    });
    self.printEventLocationName = ko.computed(function() {
        return self.eventLocationName();
    });
    self.printEventLocationAddress = ko.computed(function() {
        return self.eventLocationAddress();
    });
    self.printEventDates = ko.computed(function() {
        return 'Start Date: ' + self.eventStartDate() + ' at ' + self.startTime() + ' to End Date: ' + self.eventEndDate() + ' at ' + self.endTime();
    });
    self.printEventMessage = ko.computed(function() {
        return self.eventMessage();
    });
    self.printEventType = ko.computed(function() {
        return self.eventType();
    });
    self.showEndDate = function() {
        if(self.datevisible()) {
            self.addEndButton('Add End Date');
            self.datevisible(false);
            self.dateButtonClass('btn btn-default');
        }else{
            self.datevisible(true);
            self.addEndButton('Remove End Date');
            self.dateButtonClass('btn btn-danger');
        }
    };
    self.showPersonal = function() {
        self.eventForm(false);
        self.personalForm(true);
    };
    self.showMoreDetails = function() {
        if(self.moreDetails()) {
            self.moreDetails(false);
            self.detailButtonText('Add Detail Profile');
            self.detailButtonClass('btn btn-default');
        }else{
            self.moreDetails(true);
            self.detailButtonText('Hide Detail Profile');
            self.detailButtonClass('btn btn-danger');
        }
    };
    self.showGuestList = function() {
        if(self.guestList()) {
            self.guestList(false);
            self.guestButton('Create Guest List');
        }else{
            self.guestList(true);
            self.guestButton('Remove Guest List');
        }
    };
    self.addGuest = function() {
        self.guestListArray.push({guestName: self.guestName(), guestEmail: self.guestEmail()});
    }
}

    var vm = new MyViewModel();

    ko.applyBindings(vm);
});




