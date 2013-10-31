app.ajaxPost = function (url, data, pageId, success, errorMessage, errorCallback, ajaxErrorCallback, completeCallback) {
    if (typeof pageId == 'undefined' || pageId == null) {
        pageId = $.mobile.activePage.attr('id');
    }
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        beforeSend: function () {
            app.loadingTimers.push(setTimeout(function () {
                $.mobile.loading('show');
            }, 1000));
        },
        complete: function () {
            if (completeCallback == undefined || completeCallback == null) {
                app.clearTimeouts();
                $.mobile.loading('hide');
            } else {
                completeCallback();
            }
        },
        success: function (resp) {
            resp = JSON.parse(resp);
            if (resp.status == 'OK') {
                if (success != undefined && success != null) {
                    success(resp);
                }
            } else {
                if (errorCallback != undefined) {
                    errorCallback();
                } else {
                    app.ajaxAlert(pageId, errorMessage);
                }
            }
        },
        error: function (ajaxError) {
            if (ajaxErrorCallback != undefined) {
                ajaxErrorCallback(ajaxError);
            } else {
                app.ajaxAlert(pageId);
            }
        }
    });
};

app.ajaxGet = function (url, success, errorCallback) {
    $.ajax({
        url: url,
        type: 'GET',
        beforeSend: function () {
            app.loadingTimers.push(setTimeout(function () {
                $.mobile.loading('show');
            }, 1000));
        },
        complete: function () {
            app.clearTimeouts();
            $.mobile.loading('hide');
        },
        success: function (resp) {
            resp = JSON.parse(resp);
            if (resp.status == 'OK') {
                success(resp);
            } else {
                if (errorCallback == undefined || errorCallback == null) {
                    app.ajaxAlert($.mobile.activePage.attr('id'));
                } else {
                    errorCallback();
                }
            }
        },
        error: function () {
            if (errorCallback == undefined || errorCallback == null) {
                app.ajaxAlert($.mobile.activePage.attr('id'));
            } else {
                errorCallback();
            }
        }
    });
};

app.ajaxAlert = function(page, text, callback) {
    var me = this;
    var err = $('#' + page + ' .error');

    if (typeof text == 'undefined' || text == null || text == '') {
        text = 'Something went wrong, please try again.';
    }
    err.find('.inner').html(text);
    if (typeof callback != 'undefined') {
        me.ajaxAlertCallback = callback;
    }
    $('body').append('<div class="error-overlay"><div>');
    err.slideDown();
    $('.error, .error-overlay').bind('click tap', function() {
        if (me.showingSpamFailNotification) {
            me.showingSpamFailNotification = false;
            var accountService = new app.services.AccountService();
            accountService.shownSpamFailNotification(function() {
                $('.error, .error-overlay').slideUp().unbind('click tap');
                if (me.ajaxAlertCallback != null) {
                    callback = me.ajaxAlertCallback;
                    me.ajaxAlertCallback = null;
                    $.mobile.changePage('#' + callback);
                }
            }, function() {
                me.ajaxAlert($.mobile.activePage.attr('id'));
            });
        } else {
            $('.error, .error-overlay').slideUp();
            $(this).unbind('click tap');
            if (me.ajaxAlertCallback != null) {
                callback = me.ajaxAlertCallback;
                me.ajaxAlertCallback = null;
                $.mobile.changePage('#' + callback);
            }
        }
    });
};