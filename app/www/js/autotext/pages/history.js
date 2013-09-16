app.pages.history = {    
    init:function() {
        $('#history').live('pagebeforeshow', function () { app.pages.history.onLoaded(); });
        $('#history').live('pageshow', function () { app.pages.history.onShow(); });
        $('#history-message-list a.view-message').live('click', function (e) {
            e.preventDefault();
            app.viewing = true;
            app.newPageResetFields();
            var smsId = $(this).parents('li').attr('data-id');
            var scheduleId = $(this).parents('li').attr('data-schedule-id');
            $('#new .edit-id').val(smsId + '&' + scheduleId);
            app.lastPageBeforeNew = $.mobile.activePage.attr('id');
            $.mobile.changePage('#new');
        });
    },
    onLoaded: function () {
        app.viewing = false;
        app.repeats = false;
        app.editing = false;
        app.reminding = false;
        app.draftEdit = false;
        app.unsyncEdit = false;
        app.lastPageBeforeNew = app.lastPageBeforeSettings = 'history';

        var service = new app.services.MessageService();
        service.getSent(function(allData) {
            $('#history-message-list li').not('#history-message-template').remove();
            if (allData['schedules'].length > 0) {
                $.each(allData['schedules'], function (row) {
                    var data = allData['schedules'][row];
                    var newRow = $('#history-message-template').clone();
                    var sendTime = new Date(data['Schedule'].send_time * 1000);
                    var content = data['Sms'].content;
                    if (data['Sms'].name.length > 0) content = data['Sms'].name + ' - ' + content;
                    newRow.attr('data-id', data['Sms'].id);
                    newRow.attr('data-schedule-id', data['Schedule'].id);
                    newRow.find('.message-recipients').text(data['Sms'].recipient_user);
                    newRow.find('.message-content').text(content);
                    newRow.find('.message-status').text(data['Schedule'].status_text);
                    newRow.find('.message-date').text(app.formatDate(sendTime));
                    newRow.find('.message-time').text(app.formatTime(sendTime));
                    newRow.find('.ui-li-aside').addClass('colour-' + data['Schedule'].status_colour);
                    switch (data['Schedule'].status) {
                        case 'delivered':
                        case 'pending': // tick
                            newRow.find('.status-icon').attr('src', 'img/icon_tick.png');
                            break;
                        default: // cross
                            newRow.find('.status-icon').attr('src', 'img/icon_cross.png');
                            break;
                    }
                    newRow.removeAttr('id');
                    newRow.show();
                    $('#history-message-list').append(newRow);

                    app.formatNumbersWithContactNames(data['Sms'].recipient_user, $('#history-message-list li[data-id="' + data['Sms'].id + '"] .message-recipients'));
                });
            }
        });

        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .history-link').addClass('ui-btn-active');
    },
    onShow:function() {
        $.each(app.listUpdateTimers, function (timeout) {
            clearTimeout(app.listUpdateTimers[timeout]);
        });

        app.refreshList('history');
    }
};