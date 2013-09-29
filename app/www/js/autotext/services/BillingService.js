app.services.BillingService = function() {

};

app.services.BillingService.prototype.getProducts = function(callback) {
    var url = app.protocol + app.url + '/billing/listProducts?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.BillingService.prototype.verify = function (transactionIdentifier, productId, transactionReceipt, successCallback) {
    var url = app.protocol + app.url + '/billing/verify?u=' + app.fullPhoneNumber + '&p=' + app.password;
    var data = {
        productId: productId,
        transactionReceipt: transactionReceipt,
        transactionIdentifier: transactionIdentifier
    };

    var errorMsg = 'Error occurred while processing the purchase. If you are sure you have made the purchase, please contact us.';
    app.ajaxPost(url, data, 'purchase', successCallback, errorMsg, function () {
        app.ajaxAlert('purchase', errorMsg);
    }, function (ajaxError) {
        var err = app.system.serialize(ajaxError, 'error');
        app.ajaxAlert('purchase', 'Network error: ' + err + '. If you are sure you have made the purchase, please contact us.');
    });
};