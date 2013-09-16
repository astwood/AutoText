app.services.CreditService = function() {

};

app.services.CreditService.prototype.getInternationalCredits = function(callback) {
    var url = app.protocol + app.url + '/users/getInternationalCredits?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};