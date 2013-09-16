app.pages.login = {    
    init:function() {
        $('#login').live('pagebeforeshow', function () { app.pages.login.onLoaded(); });
        $('#login-submit-button').live('click', function () {
            var country = $('#login-country').val();
            var phoneNumber = $('#login-phone_number').val();
            var password = $('#login-password').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = app.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            $('#login-phone_number').val(phoneNumber);
            var accountService = new app.services.AccountService();
            accountService.login(country, phoneNumber, password, function(resp) {
                app.fullPhoneNumber = resp.data['phone_number'];
                app.userExitCode = resp.data['exit_code'];
                app.phoneNumber = phoneNumber;
                app.country = country;
                app.password = password;
                $.cookie('logins', JSON.stringify({
                    'country': app.country,
                    'phone_number': app.phoneNumber,
                    'password': app.password
                }), { expires: 7300 });
                $.mobile.changePage('#scheduled');
                $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
            }, function() {
                app.ajaxAlert('login', 'Your login details are wrong - please review.');
            });
        });
    },
    onLoaded: function () {
        app.stopCountryChange = false;
    }
};