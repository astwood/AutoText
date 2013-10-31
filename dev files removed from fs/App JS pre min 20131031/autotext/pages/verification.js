app.pages.verification = {    
    init:function() {
        $('#verification').live('pagebeforeshow', function () { app.pages.verification.onLoaded(); });
        $('#verification-invalid-format').live('click', function () {
            var accountService = new app.services.AccountService();
            accountService.formatting(function() {
                $('#verification form').css('bottom', 0);
                app.ajaxAlert('verification', 'Thanks - we\'ll look in to it right away.');
            });
        });
        $('#verification-submit-button').live('click', function () {
            var verificationCode = $('#verification-pin').val();
            var dataStr = 'country=' + app.country + '&phone_number=' + app.phoneNumber + '&pin=' + verificationCode;
            var password;
            if (app.verificationType == 'forgotten') {
                password = $('#verification-password').val();
                dataStr += '&password=' + password;
            }
            var accountService = new app.services.AccountService();
            accountService.verify(dataStr, function() {
                if (app.verificationType == 'forgotten') {
                    app.ajaxAlert('verification', 'Thanks - your password has been reset.', 'login');
                } else {
                    accountService.login(app.country, app.phoneNumber, app.password, function(resp) {
                        app.fullPhoneNumber = resp.data['phone_number'];
                        app.userExitCode = resp.data['exit_code'];
                        $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
                        $.mobile.changePage('#scheduled');
                    }, function() {
                        app.ajaxAlert('verification');
                    });
                }
            }, function() {
                if (app.verificationType == 'forgotten') {
                    app.ajaxAlert('verification', 'We think there might be an error with the verification code or password that you\'ve entered - please review.');
                } else {
                    app.ajaxAlert('verification', 'We think there might be an error with the verification code that you\'ve entered - please review.');
                }
            });
        });
    },
    onLoaded: function () {
        app.clearTimeouts();
        $('#verification-sent-number').text('+' + app.fullPhoneNumber);

        $('#verification').removeClass('verify-forgotten verify-register');
        $('#verification').addClass('verify-' + app.verificationType);
        if (app.verificationType == 'forgotten') {
            $('#verification-nocode-text').hide();
            $('#verification-password_text').hide();
            $('#verification-password').show();
            $('#verification-firstline').text('You will shortly receive your verification code via text message. Simply enter the code in the box below along with your new password and hit verify.');
        } else {
            $('#verification-nocode-text').show();
            $('#verification-password').hide();
            $('#verification-password_text').show();
            $('#verification-firstline').text('You will shortly receive your verification code via text message. Simply enter the code in the box below and hit Verify.');
        }
        $("#verification-password").val("");
        $("#verification-pin").val("");
    }
};