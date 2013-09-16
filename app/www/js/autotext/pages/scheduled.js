app.pages.scheduled = {    
    init:function() {
        $('#scheduled').live('pagebeforeshow', function () { app.pages.scheduled.onLoaded(); });
        $('#scheduled').live('pageshow', function () { app.pages.scheduled.onShow(); });
        $('.edit-message').live('click', function () {
            $('#new-content').height(250);
        });
        $('.settings').live('click', function () {
            $.mobile.changePage('#settings');
        });
        $('#delete-repeats-confirm .cancel').live('click', function () {
            $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                $(this).parents('.delete-btn-container').remove();
            });
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        $('#delete-repeats-confirm .all').live('click', function () {
            $.fn.swipeDeleteType = 'all';
            $.fn.swipeDoDelete.call(app);//todo: confirm if parameter is app or this?
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        $('#delete-repeats-confirm .single').live('click', function () {
            $.fn.swipeDeleteType = 'single';
            $.fn.swipeDoDelete.call(app);
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        $('#scheduled-message-list a.edit-message').live('click', function (e) {
            e.preventDefault();
            if ($('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            } else {
                app.dataSingle = false;//(app.draftDeleteType == 'single');
                app.repeats = typeof $(this).parents('li').attr('data-repeats') != 'undefined';
                app.editing = true;
                app.draftEdit = typeof $(this).parents('li').attr('data-draft') == 'string';
                app.unsyncEdit = typeof $(this).parents('li').attr('data-unsynced') == 'string';
                app.newPageResetFields();
                app.newDraft = false;
                var smsId = app.dataId = $(this).parents('li').attr('data-id');
                var scheduleId = app.dataScheduleId = $(this).parents('li').attr('data-schedule-id');

                if (app.draftEdit) {
                    app.draftId = $(this).parents('li').attr('data-draft');
                } else {
                    app.draftId = app.generateUUID();
                }
                $('#new .edit-id').val(smsId + '&' + scheduleId);
                app.lastPageBeforeNew = $.mobile.activePage.attr('id');
                $.mobile.changePage('#new');
            }
        });
    },
    onLoaded: function () {
        var me = this;
        app.repeats = false;
        app.editing = false;
        app.reminding = false;
        app.draftEdit = false;
        app.unsyncEdit = false;
        app.lastPageBeforeNew = app.lastPageBeforeSettings = 'scheduled';

        var service = new app.services.MessageService();
        service.getScheduled(function(data) {
            me._render(data);
        });
        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .schedule-link').addClass('ui-btn-active');
    },
    onShow:function() {
        $.each(app.listUpdateTimers, function (timeout) {
            clearTimeout(app.listUpdateTimers[timeout]);
        });

        app.refreshList('scheduled');
        app.processUnsynced();
    },
    _render:function(allData) {
        var me = this;
        $('#scheduled-message-list li').not('#scheduled-message-template').remove();

        var drafts = app.updateDrafts('list');
        if (drafts != null && typeof drafts == 'object' && drafts.length > 0) {
            allData['schedules'] = drafts.concat(allData['schedules']);
        }

        var noCreditFound = false;
        if (allData['schedules'].length > 0) {
            $.each(allData['schedules'], function (row) {
                var data = allData['schedules'][row];
                var newRow = $('#scheduled-message-template').clone();
                var sendTime = new Date(data['Schedule'].send_time * 1000);
                var repeats = JSON.parse(data.Sms.repeat_options);
                var content = data['Sms'].content;
                var draft = typeof data['Sms'].is_draft != 'undefined';
                var unsynced = draft && data['Schedule'].status == 'unsynced';
                if (data['Sms'].name.length > 0) content = data['Sms'].name + ' - ' + content;
                if (!draft && (repeats.D == 1 || repeats.W == 1 || repeats.M == 1 || repeats.Y == 1)) {
                    newRow.attr('data-repeats', 'repeats');
                }
                if (data['Schedule'].status == 'no_credit') {
                    newRow.addClass('no_credit');
                }
                if (draft) {
                    newRow.attr('data-draft', data['Sms'].id);
                }
                if (unsynced) {
                    newRow.attr('data-unsynced', data['Sms'].id);
                }

                var rowId = data['Sms'].id;
                if (data['Sms'].real_id != undefined && data['Sms'].real_id.length > 0) {
                    rowId = data['Sms'].real_id.split('&')[0];
                }
                newRow.attr('data-id', rowId);
                newRow.attr('data-schedule-id', data['Schedule'].id);
                newRow.find('.message-recipients').text(data['Sms'].recipient_user);
                newRow.find('.message-content').text(content);
                newRow.find('.message-status').text(data['Schedule'].status_text);
                if (!draft) {
                    newRow.find('.message-date').text(app.formatDate(sendTime));
                    newRow.find('.message-time').text(app.formatTime(sendTime));
                } else {
                    newRow.find('.message-date, .message-time').text('-');
                }
                if (data['Schedule'].status == 'no_credit') noCreditFound = true;
                newRow.find('.ui-li-aside').addClass('colour-' + data['Schedule'].status_colour);
                switch (data['Schedule'].status_colour) {
                    default:
                    case '':
                    case 'a3a3a3': // grey
                        newRow.find('.status-icon').attr('src', 'img/icon_black.png');
                        break;
                    case '92d050': // green
                        newRow.find('.status-icon').attr('src', 'img/icon_green.png');
                        break;
                    case 'f0b05f': // amber
                        newRow.find('.status-icon').attr('src', 'img/icon_amber.png');
                        break;
                    case 'c80408': // red
                        newRow.find('.status-icon').attr('src', 'img/icon_red.png');
                        break;
                }
                newRow.removeAttr('id');
                newRow.show();
                $('#scheduled-message-list').append(newRow);

                app.formatNumbersWithContactNames(data['Sms'].recipient_user, $('#scheduled-message-list li[data-id="' + data['Sms'].id + '"] .message-recipients'));
            });
        }
        $('#scheduled-message-list li:not(".no_credit")').swipeDelete({
            click: function (e) {
                me._delete(e);
            }
        });

        if (app.justSetSpam) {
            app.justSetSpam = false;
            app.ajaxAlert('scheduled', 'Unfortunately this message has been flagged by our system for potential SPAM content and will be reviewed by our team before it is allowed to send.');
        } else if (app.justSetUnsynced) {
            app.justSetUnsynced = false;
            app.ajaxAlert('scheduled', 'We can\'t sync this message with our system. Please connect to a mobile network or internet connection.');
        } else if (allData['show_spam_fail_notification'] == true) {
            app.showingSpamFailNotification = true;
            app.ajaxAlert('scheduled', 'Unfortunately one or more messages have been reviewed and found to have SPAM content within them. This message will be moved to your history folder.');
        }
        else if (noCreditFound) {
            var noCreditShown = $.cookie('noCreditShown');
            if (noCreditShown == undefined) {
                $.cookie('noCreditShown', JSON.stringify(true), { expires: 1 });
                app.ajaxAlert('scheduled', 'You don\'t have enough credits to send one or more messages.');
            }
        }
    },
    _delete:function(e) {
        e.preventDefault();
        var me = $(e.currentTarget);
        var repeats = (typeof me.parents('li').attr('data-repeats') != 'undefined');
        if (repeats) {
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').show();
        } else {
            $.fn.swipeDoDelete.call(me);
        }
    }
};