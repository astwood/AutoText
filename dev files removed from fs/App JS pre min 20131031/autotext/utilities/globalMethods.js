/**
* Refresh scheduled/history page message lists every 60 seconds
*/
app.refreshList = function (pageId) {
    var me = this;
    setTimeout(function () {
        if ($.mobile.activePage.attr('id') == pageId) {
            me.pages[pageId].onLoaded();
            me.refreshList(pageId);
        }
    }, 60000);
};

/**
* Sets new/edit message pages fields back to their default state
*/
app.newPageResetFields = function() {
    var me = this;
    if (me.canResetNewPage) {
        me.newData = {
            'name': '',
            'recipient': '',
            'content': '',
            'time': '',
            'reminder': '',
            'repeat_options': ''
        };
        $('#new-name, #new-recipient, #new-content').val('');
        $('#message-repeats input[name="message-repeats"]').removeAttr('checked');
        $('#message-repeats-none').attr('checked', 'checked');
        try {
            $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
        } catch(e) {
        }
        $('#message-repeats-wd option:selected').removeAttr('selected');
        $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
        try {
            $('#message-repeats-wd').slider('refresh');
        } catch(e) {
        }
        var scrollEl = $('#new-date');
        scrollEl.val('').scroller('destroy').removeClass('scrollified');

        if (!me.viewing) {
            scrollEl.scroller({
                preset: 'calendar',
                theme: 'ios',
                mode: 'scroller',
                display: 'inline',
                lang: 'en'
            }).addClass('scrollified');
        }
        $('#new-date-text').text('');
    }
};
/**
* Save a message on the local device, flag as unsynced and attempt to process unsynced messages in 60 seconds
*/
app.saveAsUnsynced = function() {
    var me = this;
    me.unsyncEdit = true;
    me.updateDrafts('edit', me.draftId, null, true);
    me.justSetUnsynced = true;
    if (me.unsyncedTimer === null) {
        me.unsyncedTimer = setTimeout(function() {
            me.processUnsynced();
        }, 60000);
    }
};

app.processUnsynced = function() {
    var me = this;
    var messages = me.updateDrafts('unsynced');
    if (messages.length > 0) {
        var messageData = messages[0];
        var data = {
            name: messageData.Sms['name'],
            recipient: messageData.Sms['recipient'],
            content: messageData.Sms['content'],
            time: messageData.Schedule['send_time'],
            repeat_options: messageData.Sms['repeat_options'],
            reminder: messageData.Sms['reminder']
        };
        var now = Math.floor(new Date().getTime() / 1000) + 60;
        if (data.time < now) data.time = now;

        var editing = messageData.Sms['real_id'] != undefined && messageData.Sms['real_id'].length > 0;
        var ids = [];
        if (editing) ids = messageData.Sms['real_id'].split('&');

        $.ajax({
            url: me.protocol + me.url + '/sms/' + (editing ? 'edit/' + ids[0] : 'schedule') + '?u=' + me.fullPhoneNumber + '&p=' + me.password,
            type: 'POST',
            data: $.param(data),
            beforeSend: function() {
                clearTimeout(me.unsyncedTimer);
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    me.updateDrafts('delete', messageData.Sms['id']);
                    if (messages.length > 1) {
                        me.processUnsynced();
                    } else {
                        clearTimeout(me.unsyncedTimer);
                        me.unsyncedTimer = null;
                        app.pages.scheduled.onLoaded();
                        me.refreshList('scheduled');
                    }
                } else {
                    me.unsyncedTimer = setTimeout(function() {
                        me.processUnsynced();
                    }, 60000);
                }
            },
            error: function() {
                me.unsyncedTimer = setTimeout(function() {
                    me.processUnsynced();
                }, 60000);
            }
        });
    } else {
        clearTimeout(me.unsyncedTimer);
        me.unsyncedTimer = null;
    }
};

/**
* Function used to add, edit and retrieve draft/unsynced messages to/from the local device
*/
app.updateDrafts = function(action, id, data, unsynced, addDraft) {
    var me = this;
    if (typeof action != 'string') return false;
    //todo: a bug with $.cookie('drafts')
    var drafts = JSON.parse($.cookie('drafts'));
    switch (action) {
    default:
        return false;
    case 'add':
        if (typeof data != 'object') return false;
        me.draftEdit = true;
        drafts.push(data);
        break;
    case 'edit':
        if (typeof id != 'string') return false;
        me.draftEdit = true;
        $(drafts).each(function(draft) {
            if (drafts[draft].Sms['id'] == id) {
                var value = $('input[name="message-repeats"]:checked').val().toUpperCase();
                var weekDays = $('#message-repeats-wd option:selected').val() == 'on';
                var repeatOptions = {
                    'D': 0,
                    'W': 0,
                    'M': 0,
                    'Y': 0,
                    'WD': 0
                };
                if (typeof repeatOptions[value] != 'undefined') repeatOptions[value] = 1;
                if (weekDays) repeatOptions['WD'] = 1;

                var tmpRealId = null;
                var tmpUnsyncedInEdit = unsynced != undefined ? unsynced : drafts[draft].Sms['unsynced'];
                if (drafts[draft].Sms['real_id'] != undefined) tmpRealId = drafts[draft].Sms['real_id'];
                drafts[draft] = {
                    'Sms': {
                        'content': $('#new-content').val(),
                        'id': id,
                        'is_draft': true,
                        'name': $('#new-name').val(),
                        'recipient': $('#new-recipient').val(),
                        'recipient_user': $('#new-recipient').val(),
                        'reminder': me.reminding ? '1' : '0',
                        'repeat_options': JSON.stringify(repeatOptions),
                        'unsynced': tmpUnsyncedInEdit
                    },
                    'Schedule': {
                        'id': me.generateUUID(),
                        'send_time': $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() / 1000 : new Date().getTime() / 1000,
                        'status': tmpUnsyncedInEdit ? 'unsynced' : 'draft',
                        'status_colour': tmpUnsyncedInEdit ? 'f0b05f' : 'a3a3a3',
                        'status_text': tmpUnsyncedInEdit ? 'Unsynced' : 'Draft'
                    }
                };

                if (tmpRealId != null) drafts[draft].Sms['real_id'] = tmpRealId;
            }
        });
        break;
    case 'view':
        if (typeof id != 'string') return false;
        var ret = null;
        me.draftId = id;
        $(drafts).each(function(draft) {
            if (drafts[draft].Sms['id'] == id) {
                ret = drafts[draft];
            }
        });

        if (ret === null) {
            var tmpUnsynced = unsynced != undefined ? unsynced : false;
            ret = {
                'Sms': {
                    'content': me.editData.content,
                    'id': id,
                    'is_draft': true,
                    'name': me.editData.name,
                    'recipient': me.editData.recipient,
                    'recipient_user': me.editData.recipient_user,
                    'reminder': me.reminding ? '1' : '0',
                    'repeat_options': me.editData.repeat_options,
                    'unsynced': tmpUnsynced
                },
                'Schedule': {
                    'id': me.generateUUID(),
                    'send_time': me.editData.schedule_time,
                    'status': tmpUnsynced ? 'unsynced' : 'draft',
                    'status_colour': 'a3a3a3',
                    'status_text': tmpUnsynced ? 'Unsynced' : 'Draft'
                }
            };
            if (addDraft) {
                me.updateDrafts('add', 0, ret);
            } else {
                var realId = $('#new .edit-id').val();
                if (realId.length > 0) {
                    ret.Sms['real_id'] = realId;
                } else if ($('#new #new-recipient').val() != '' || $('#new #new-content').val() != '' || addDraft) {
                    me.updateDrafts('add', 0, ret);
                }
            }
        }
        return ret;
    case 'delete':
        if (typeof id != 'string') return false;
        var tmpDeleteData = [];
        $(drafts).each(function(draft) {
            if (drafts[draft].Sms['id'] != id) {
                tmpDeleteData.push(drafts[draft]);
            }
        });
        drafts = tmpDeleteData;
        break;
    case 'wipe':
        drafts = [];
        break;
    case 'list':
        var tmp = JSON.parse($.cookie('drafts'));
        var times = [];
        var res = [];
        $.each(tmp, function(draft) {
            times.push(tmp[draft].Schedule.send_time);
        });
        times = me.asort(times);
        for (var ti = 0; ti < times.length; ti++) {
            for (var di = 0; di < tmp.length; di++) {
                if (times[ti] == tmp[di].Schedule.send_time) {
                    res.push(tmp[di]);
                }
            }
        }

        return res;
    case 'unsynced':
        var draftsUnsyncedData = JSON.parse($.cookie('drafts'));
        var tmpUnsyncedData = [];
        $.each(draftsUnsyncedData, function (draft) {
            if (draftsUnsyncedData[draft].Sms['unsynced']) {
                tmpUnsyncedData.push(draftsUnsyncedData[draft]);
            }
        });
        return tmpUnsyncedData;
    }
    $.cookie('drafts', JSON.stringify(drafts),
        { expires: 7300 });

    return true;
};

/**
* Sort an array but leave keys intact
*/
app.asort = function(times) {
    return times.sort(function(a, b) {
        return a - b;
    });
};

/**
* Generate a UUID (used for draft/unsynced messages)
*/
app.generateUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
* Initiate page title progress bar on new/edit message page
*/
app.doProgressBar = function() {
    try {
        if ($('#' + $.mobile.activePage.attr('id') + ' .progressbar:visible').length < 1) {
            $('#' + $.mobile.activePage.attr('id') + ' h1 .page-title').hide();
            $('#' + $.mobile.activePage.attr('id') + ' .progressbar').show();
            $('#' + $.mobile.activePage.attr('id') + ' .progressbar-status').css('display', 'block');

            $('#new h1').css('overflow', 'visible');
            TolitoProgressBar('#' + $.mobile.activePage.attr('id') + ' .progressbar')
                .isMini(true)
                .showCounter(false)
                .setInterval(20)
                .setMax(125)
                .setOuterTheme('b')
                .setInnerTheme('c')
                .build()
                .init();
        }
    } catch(ex) {
        console.log('progressbar error: ' + ex);
    }
};

/**
* Format numbers from user's address book so their names show rather than numbers (needs re-working)
*/
app.formatNumbersWithContactNames = function(numbers, el, button) {
    if (typeof button == 'undefined') button = false;

    numbers = numbers == undefined ? [] : numbers.split(',');
    var recipientStr = '';
    for (var i = 0; i < numbers.length; i++) {
        recipientStr += '<span' + (button ? ' data-role="button" data-mini="true"' : '') + ' data-phone_number="' + numbers[i] + '">';
        recipientStr += numbers[i];
        //            recipientStr += '</span>';
        if (!button && (i + 1) < numbers.length) recipientStr += ', ';
    }
    el.html(recipientStr);
};

/**
* Format timestamp in to day/month/year
*/
app.formatDate = function(time) {
    var day = '' + parseInt(time.getDate());
    var month = '' + parseInt(time.getMonth() + 1);
    var year = '' + parseInt(time.getFullYear());
    day = day > 9 ? day : '0' + day;
    month = month > 9 ? month : '0' + month;
    return day + '/' + month + '/' + year;
};

/**
* Format timestamp in to hours:minutes
*/
app.formatTime = function(time, twelveHr) {
    if (typeof twelveHr == 'undefined') twelveHr = false;
    var hours = '' + time.getHours();
    var minutes = '' + time.getMinutes();
    hours = hours > 9 ? hours : '0' + hours;
    minutes = minutes > 9 ? minutes : '0' + minutes;
    return hours + ':' + minutes;
};

/**
* Clear timeouts that run before loading graphic is shown
*/
app.clearTimeouts = function() {
    var me = this;
    $.each(me.loadingTimers, function(timeout) {
        clearTimeout(me.loadingTimers[timeout]);
    });
};