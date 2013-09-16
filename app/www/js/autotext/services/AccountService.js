app.services.AccountService = function() {

};

app.services.AccountService.prototype.login = function(country, phoneNumber, password, successCallback, errorCallback) {
    var url = app.protocol + app.url + '/users/login';
    var data = 'country=' + country + '&phone_number=' + phoneNumber + '&password=' + password;
    app.ajaxPost(url, data, "login", function(resp) {
        successCallback(resp);
    }, null, errorCallback);
};

app.services.AccountService.prototype.getCredits = function(callback) {
    var url = app.protocol + app.url + '/users/getCredits?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.AccountService.prototype.shownSpamFailNotification = function(successCallback, errorCallback) {
    var url = app.protocol + app.url + '/users/shownSpamFailNotification?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, successCallback, errorCallback);
};

app.services.AccountService.prototype.register = function (country, phoneNumber, password, successCallback, errorCallback) {
    var url = app.protocol + app.url + '/users/register';
    var data = 'country=' + country + '&phone_number=' + phoneNumber + '&password=' + password;
    app.ajaxPost(url, data, "register", successCallback, null, errorCallback);
};

app.services.AccountService.prototype.formatting = function(callback) {
    var url = app.protocol + app.url + '/users/formatting';
    var data = 'country=' + app.country + '&phone_number=' + app.phoneNumber;
    app.ajaxPost(url, data, "verification", callback);
};

app.services.AccountService.prototype.verify = function(data, callback) {
    var url = app.protocol + app.url + '/users/verify/' + app.verificationType;
    app.ajaxPost(url, data, "verification", callback);
};

app.services.AccountService.prototype.forgotten = function(country, phoneNumber, callback, errorCallback) {
    var url = app.protocol + app.url + '/users/forgotten';
    var data = 'country=' + country + '&phone_number=' + phoneNumber;
    app.ajaxPost(url, data, "forgotten", callback, null, errorCallback);
};