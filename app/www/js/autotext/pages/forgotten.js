app.pages.forgotten = {    
    init:function() {
        $('#forgotten-submit-button').live('click', function () {
            app.pages.forgotten.forgottenSubmit();
        });
    },
    forgottenSubmit: function () {
        var country = $('#forgotten-country').val();
        var phoneNumber = $('#forgotten-phone_number').val();
        if (phoneNumber.substr(0, 1) == '+') {
            phoneNumber = app.userExitCode + phoneNumber.substr(1);
        }
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        $('#forgotten-phone_number').val(phoneNumber);
        var service = new app.services.AccountService();
        service.forgotten(country, phoneNumber, function () {
            app.country = country;
            app.phoneNumber = phoneNumber;
            app.verificationType = 'forgotten';
            $.mobile.changePage('#verification');
        }, function() {
            app.ajaxAlert('forgotten', 'We couldn\'t find your phone number - please review.');
        });
    }
};