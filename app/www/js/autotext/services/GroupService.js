app.services.GroupService = function() {

};

app.services.GroupService.prototype.getAll = function(callback) {
    var url = app.protocol + app.url + '/groups/index?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.GroupService.prototype.delete = function(id, callback) {
    var url = app.protocol + app.url + '/groups/delete/' + id + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, callback);
};

app.services.GroupService.prototype.getGroup = function(id, callback) {
    var url = app.protocol + app.url + '/groups/view/' + id + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.GroupService.prototype.editGroup = function(id) {
    var url = app.protocol + app.url + '/groups/edit/' + id + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, {}, "newgroup");
};

app.services.GroupService.prototype.validate = function (data, pageId, errorMessage, successCallback, errorCallback, ajaxErrorCallback) {
    var url = app.protocol + app.url + '/groups/validates?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, data, pageId, successCallback, errorMessage, function() {
        if (errorMessage != null && errorMessage != '') {
            app.ajaxAlert(pageId, errorMessage);
        }
        if (errorCallback != undefined) {
            errorCallback();
        }
    }, ajaxErrorCallback);
};

app.services.GroupService.prototype.addEdit = function(isEditing,data, successCallback, errorCallback) {
    var url = app.protocol + app.url + '/groups/' + (!isEditing ? 'add' : 'edit/' + $('#newgroup .edit-id').val()) + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, data, "newgroup", successCallback, null, errorCallback);
};