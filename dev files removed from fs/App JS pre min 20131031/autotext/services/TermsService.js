app.services.TermsService = function() {

};

app.services.TermsService.prototype.getTerms = function(callback) {
    var url = app.protocol + app.url + '/pages/terms';
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};