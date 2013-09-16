app.pages.register = {    
    init:function() {
        $('#register-submit-button').live('click', function () {
            var country = $('#register-country').val();
            var phoneNumber = $('#register-phone_number').val();
            var password = $('#register-password').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                phoneNumber = app.userExitCode + phoneNumber;
            } else {
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            }
            $('#register-phone_number').val(phoneNumber);
            
            var accountService = new app.services.AccountService();
            accountService.register(country, phoneNumber, password, function(resp) {
                app.country = country;
                app.phoneNumber = phoneNumber;
                app.password = password;
                app.verificationType = 'register';
                app.fullPhoneNumber = resp.data['phone_number'];
                app.userExitCode = resp.data['exit_code'];
                $.cookie('logins', JSON.stringify({
                    'country': app.country,
                    'phone_number': app.phoneNumber,
                    'password': app.password
                }));
                $.mobile.changePage('#verification');
            }, function() {
                app.ajaxAlert('register', 'Your registration details are incorrect. If you are having difficulty registering take a look at the <a href="http://autotext.co/support" rel="external" target="_blank">FAQ</a>.');
            });
        });
    }
};