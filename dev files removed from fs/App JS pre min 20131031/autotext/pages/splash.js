app.pages.splash = {    
    init:function() {
        $('#splash').live('pageshow', function () { app.pages.splash.onShow(); });
    },
    onShow: function () {
        app.clearTimeouts();
        var loginCookie = $.cookie('logins');
        var draftCookie = $.cookie('drafts');
        if (typeof draftCookie == 'undefined') {
            $.cookie('drafts', JSON.stringify([]),
                { expires: 7300 });
        }

        if (typeof loginCookie != 'undefined') {
            loginCookie = JSON.parse(loginCookie);
            var service = new app.services.AccountService();
            service.login(loginCookie.country, loginCookie.phone_number, loginCookie.password, function(resp) {
                app.fullPhoneNumber = resp.data['phone_number'];
                app.userExitCode = resp.data['exit_code'];
                app.phoneNumber = loginCookie.phone_number;
                app.country = loginCookie.country;
                app.password = loginCookie.password;
                $.mobile.changePage('#scheduled');
                $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
            }, function() {
                $.removeCookie('logins');
                $.mobile.changePage('#login', { transition: 'fade' });
            });
        } else {
            $.mobile.changePage('#login', { transition: 'fade' });
        }
    }
};