
// Date Picker functions Bootstrap
$(function () {
    $('#datetimepicker1').datepicker({
        autoclose: true
    });
    $('#datetimepicker2').datepicker({
        autoclose: true
    });

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
    //Event form variables
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
    self.dateButtonClass = ko.observable('btn btn-default');
    //Profile form variables
    self.personalForm = ko.observable(false);
    self.moreDetails = ko.observable(false);
    self.detailButtonText = ko.observable('Add Detail Profile');
    self.detailButtonClass = ko.observable('btn btn-default');
    //Guest List variables
    self.guestButton = ko.observable('Create Guest List');
    self.guestList = ko.observable(false);
    self.guestNameToAdd = ko.observable('');
    self.guestEmailToAdd = ko.observable('');
    self.guestListArray = ko.observableArray('');
    var idNum = 1001;
    


    //Print to screen for review of event details
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
        if(self.eventStartDate() === '' ) {
            return; 
        
        }else{
            if(self.startTime() === '') {
                if(self.eventEndDate() === '') {
                    return 'Start Date: ' + self.eventStartDate();
                }else{
                    if(self.endTime() === '') {
                         return 'Start Date: ' + self.eventStartDate() + ' to ' + self.eventEndDate();
                    }else{
                        return 'Start Date: ' + self.eventStartDate() + ' to ' + self.eventEndDate() + ' at ' + self.endTime();
                    }
                }
            }else{
               if(self.eventEndDate() === '') {
                    return 'Start Date: ' + self.eventStartDate() + ' at ' + self.startTime();
                }else{
                    if(self.endTime() === '') {
                         return 'Start Date: ' + self.eventStartDate() + ' at ' + self.startTime() + ' to ' + self.eventEndDate();
                    }else{
                        return 'Start Date: ' + self.eventStartDate() + ' at ' + self.startTime() + ' to ' + self.eventEndDate() + ' at ' + self.endTime();
                    }
                }
            }
        }
    });
    self.printEventMessage = ko.computed(function() {
        return self.eventMessage();
    });
    self.printEventType = ko.computed(function() {
        
        return self.eventType();
    });

    //Add end date if requested
    self.showEndDate = function() {
        if(self.datevisible()) {
            self.addEndButton('Add End Date');
            self.datevisible(false);
            self.dateButtonClass('btn btn-default');
            self.eventEndDate('');
            self.endTime('');
        }else{
            self.datevisible(true);
            self.addEndButton('Remove End Date');
            self.dateButtonClass('btn btn-danger');
        }
    };


    //show the guest list table and form options 
    self.showGuestList = function() {
        if(self.guestList()) {
            self.guestList(false);
            self.guestButton('Create Guest List');
        }else{
            self.guestList(true);
            self.guestButton('Hide Guest List');
        }
    };
    //Add guest to list and print to screen
    self.capName = ko.computed(function() {
      var guestNameArray = [];
      var searchString = /\s/g;
      var subSpace = self.guestNameToAdd().toLowerCase().split(searchString);
      
      function lastName () {
        for (i=0; i<subSpace.length; i++) {
          var nameVar = subSpace[i];
          var nameSubFirst = nameVar.substr(0,1).toUpperCase();
          var nameSubLast = nameVar.substr(1);
          var nameResult = nameSubFirst + nameSubLast;
          guestNameArray.push(nameResult);       
        }
       
      };
      var callfunction = lastName();
      var subLast = guestNameArray.join(" ");
      
      return subLast;
       
    }, self);

    self.validEmail = ko.computed(function() {
      var emailGuest = self.guestEmailToAdd();
      var containsAt = emailGuest.search(/[a-zA-Z]@[a-zA-z]/g) > -1;
      var indexPeriod = emailGuest.search(/\./g);
      var isWeb = emailGuest.substr(indexPeriod);
      var containsPeriod = 3 < isWeb.length < 5;
      function validationCheck () {
                          if(containsAt === containsPeriod) {
                            return emailGuest;
                          }else{
                            return 'Invalid Email';
                          }
                        };
      var emailCheck = validationCheck();
      return emailCheck;
    });
    self.addGuest = function() {
        if (self.guestNameToAdd() != '') {
            idNum += 1;

            var nameGuest = self.capName();
            var emailGuest = self.validEmail();
            self.guestListArray.push({guestName: nameGuest, guestEmail: emailGuest, guestID: idNum}); 
            self.guestNameToAdd('');
            self.guestEmailToAdd('');
        }
    }.bind(self); 

    self.removeGuest = function(guest) {
        self.guestListArray.remove(guest);
    };

    //Request personal information after event form is saved
    self.showPersonal = function() {
        self.eventForm(false);
        self.personalForm(true);
    };

    //Allow for greater profile details if desired
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

}


ko.bindingHandlers.enterkey = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var callback = valueAccessor();
        $(element).keypress(function (event) {
            var keyCode = (event.which ? event.which : event.keyCode);
            if (keyCode === 13) {
                callback.call(viewModel);
                return false;
            }
            return true;
        });
    }
};

    var vm = new MyViewModel();

    ko.applyBindings(vm);
});




