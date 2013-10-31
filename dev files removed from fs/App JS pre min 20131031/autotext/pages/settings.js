app.pages.settings = {    
    init:function() {
        $('#settings').live('pagebeforeshow', function () { app.pages.settings.onLoaded(); });
        $('#settings-account-link').live('click', function () {
            $.mobile.changePage('#account');
        });
        $('#settings-help-link').live('click', function () {
            $.mobile.changePage('#help');
        });
        /**
         * Bind settings page reset password link
         */
        $('#settings .reset-password-link').live('click', function () {
            $('#settings .dialog-overlay, #reset-password-confirm').show();
        });
        /**
         * Bind reset password confirmation ok button
         */
        $('#reset-password-confirm .ok').live('click', function () {
            $.removeCookie('logins');
            $('#forgotten-country option').removeAttr('selected');
            $('#forgotten-country option[value="' + app.country + '"]').attr('selected', 'selected');
            $('#forgotten-phone_number').val(app.phoneNumber);
            $('#settings .dialog-overlay, #reset-password-confirm').hide();
            app.pages.forgotten.forgottenSubmit();
        });
        /**
         * Bind reset password confirmation cancel button
         */
        $('#reset-password-confirm .cancel').live('click', function () {
            $('#settings .dialog-overlay, #reset-password-confirm').hide();
        });

        /**
         * Bind settings page logout link
         */
        $('#settings .logout-link').live('click', function () {
            $('#settings .dialog-overlay, #logout-confirm').show();
        });
        /**
     * Bind logout confirmation ok button
     */
        $('#logout-confirm .ok').live('click', function () {
            $.removeCookie('logins');
            $.removeCookie('noCreditShown');
            $('#login-country option:selected').removeAttr('selected');
            $('#login-country option:first').attr('selected', 'selected');
            try {
                $('#login-country').selectmenu().selectmenu('refresh');
            } catch (e) { }
            $('#login-phone_number, #login-password').val('');
            $('#settings .dialog-overlay, #logout-confirm').hide();
            $('.ui-page, .ui-mobile-viewport').removeClass('ui-page-bg-light');
            $.mobile.changePage('#login');
        });
        /**
         * Bind logout confirmation cancel button
         */
        $('#logout-confirm .cancel').live('click', function () {
            $('#settings .dialog-overlay, #logout-confirm').hide();
        });
    },
    onLoaded: function () {
        $('#settings-full-number').text('+' + app.fullPhoneNumber);
    }
};