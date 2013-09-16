app.services.MessageService = function() {

};

app.services.MessageService.prototype.getScheduled = function(callback) {
    var url = app.protocol + app.url + '/sms/index/scheduled?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.MessageService.prototype.getSent = function(callback) {
    var url = app.protocol + app.url + '/sms/index/sent?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.MessageService.prototype.getStatusDescription = function(successCallback, errorCallback) {
    var url = app.protocol + app.url + '/sms/getStatusDescription/' + app.editViewStatus + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        successCallback(resp.data);
    }, errorCallback);
};

app.services.MessageService.prototype.validate = function(pageId, data, successCallback, errorCallback, ajaxErrorCallback) {
    var url = app.protocol + app.url + '/sms/validates?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, data, pageId, successCallback, null, errorCallback, ajaxErrorCallback);
};

app.services.MessageService.prototype.editOrSchedule = function(editId, data, successCallback, completeCallback) {
    var url = app.protocol + app.url + '/sms/' + (app.editing && app.editType != 'single' ? 'edit/' + editId : 'schedule') + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        beforeSend: function() {
            app.loadingTimers.push(setTimeout(function() {
                $.mobile.loading('show');
            }, 1000));
        },
        complete: function() {
            completeCallback();
        },
        success: function(resp) {
            $('#' + $.mobile.activePage.attr('id') + ' .progressbar-status').text('Saved!');
            resp = JSON.parse(resp);
            if (resp.status == 'OK') {
                successCallback(resp);
            } else {
                var errTxt = resp.data[0][0];
                app.ajaxAlert($.mobile.activePage.attr('id'), errTxt);
            }
        },
        error: function() {
            app.saveAsUnsynced();
            $.mobile.changePage('#scheduled');
        }
    });
};