app.pages.addContactFromNumber = {    
    init:function() {
        $('#addcontactfromnumber .save').live('click', function () {
            var phoneNumber = $('#addcontactfromnumber-number').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = app.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            $('#addcontactfromnumber-number').val(phoneNumber);

            var data = {
                'name': $('#addcontactfromnumber-name').val(),
                'phone_number': phoneNumber,
                'part': 'contact',
                'custom': true
            };
            var service = new app.services.GroupService();
            service.validate($.param(data), "addcontactfromnumber", null, function() {
                data['phone_number_user'] = data['phone_number'];
                app.groupData['contacts'].push(data);
                app.pages.newGroup.update();
                $('#addcontactfromnumber-name, #addcontactfromnumber-number').val('');
                $.mobile.changePage('#newgroup', { reverse: false });
            }, function() {
                app.ajaxAlert('addcontactfromnumber', 'Please ensure that you have entered your contact\'s name and phone number correctly then try again.');
            });
        });
        
        $('#addcontactfromnumber .back').live('click', function () {
            $('#addcontactfromnumber-name').val("");
            $('#addcontactfromnumber-number').val("");
        });
    }
};