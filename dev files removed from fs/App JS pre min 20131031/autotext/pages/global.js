/**
* Update page title and back button text. Also has code for message schedule options and new/edit message pages
*/
app.pages.global = {
    init:function() {
        $('[data-role="page"]').live('pagebeforeshow', function () { app.pages.global.onLoaded(); });
        $('[data-role="page"]').live('pageshow', function () { app.pages.global.onPageShow(); });
        $('[data-role="page"]').live('pagebeforehide', function () { app.pages.global.onPageBeforeHide(); });
    },
    onPageShow:function() {
        $('[data-role="page"] .ui-content').addClass('vHidden');
        $('#' + $.mobile.activePage.attr('id') + ' .vHidden').removeClass('vHidden');
        $(' h1 .page-title').css({ "visibility": "visible" });
        $('.ui-header .ui-title').css({ "visibility": "visible" });
    },
    onPageBeforeHide:function() {
        $('h1 .page-title').css({ "visibility": "hidden" });
        $('.ui-header .ui-title').css({ "visibility": "hidden" });
    },
    onLoaded: function () {
        var obj = this;
        $('body').attr('id', $.mobile.activePage.attr('id') + '-body');
        var backTxt = 'Back';
        var headerTxt = '';
        $('h1').css('overflow', 'hidden');
        switch ($.mobile.activePage.attr('id')) {
            case 'schedule-options':
                backTxt = app.editData['content'];
                if (typeof app.editData['name'] != 'undefined' && app.editData['name'].length > 0) backTxt = app.editData['name'] + ' - ' + backTxt;
                if (app.reminding) backTxt = 'RemindMe';

                headerTxt = '<span class="page-title">Schedule SMS</span><span class="progressbar-status">Scheduling...</span><span class="progressbar"></span>';

                if (app.editing) {
                    $('.save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
                }

                if (app.viewing) {
                    $('#new-name-link, #new-repeats-link, #new-date-link').addClass('link-disabled');
                    $('.save').hide();
                } else {
                    $('#new-name-link, #new-repeats-link, #new-date-link').removeClass('link-disabled');
                    $('.save').show();
                }
                break;

            case 'scheduled':
                headerTxt = 'Scheduled';
                break;

            case 'history':
                headerTxt = 'History';
                break;

            case 'groups':
                headerTxt = 'Groups';
                break;

            case 'register':
                backTxt = 'Login';
                headerTxt = 'Register';
                break;

            case 'forgotten':
                backTxt = 'Login';
                headerTxt = 'Reset Password';
                break;

            case 'newgroup':
                backTxt = 'Groups';
                headerTxt = 'Add Group';
                $('.save').show();
                if (app.groupEditing) headerTxt = 'Edit Group';

                break;

            case 'message-name':
                backTxt = 'Schedule SMS';
                headerTxt = 'Message Name';
                break;

            case 'message-date':
                backTxt = 'Schedule SMS';
                headerTxt = 'Message Date';
                break;

            case 'message-repeats':
                backTxt = 'Schedule SMS';
                headerTxt = 'Repeats';
                break;

            case 'account':
                backTxt = 'Settings';
                headerTxt = 'Settings';
                break;

            case 'purchase':
                backTxt = 'Settings';
                if (app.lastPageBeforePurchase == 'status-dialog') backTxt = 'Message Status';
                headerTxt = 'Purchase';
                break;

            case 'help':
                backTxt = 'Settings';
                headerTxt = 'Help';
                break;

            case 'help-1':
                backTxt = 'Help';
                headerTxt = 'Welcome';
                break;

            case 'help-2':
                backTxt = 'Welcome';
                headerTxt = 'Scheduled';
                break;

            case 'help-3':
                backTxt = 'Scheduled';
                headerTxt = 'History';
                break;

            case 'help-4':
                backTxt = 'History';
                headerTxt = 'New Message';
                break;

            case 'help-5':
                backTxt = 'New Message';
                headerTxt = 'Contact Groups';
                break;

            case 'help-6':
                backTxt = 'Contact Groups';
                headerTxt = 'RemindMe';
                break;

            case 'help-7':
                backTxt = 'RemindMe';
                headerTxt = 'Close';
                break;

            case 'terms':
                backTxt = 'Help';
                if (app.lastPageBeforeTerms == 'verification') {
                    backTxt = 'Input Verification Code';
                } else if (app.lastPageBeforeTerms == 'status-dialog') {
                    backTxt = 'Message Status';
                }
                headerTxt = 'Terms of Use';
                break;

            case 'verification':
                backTxt = 'Register';
                if (app.verificationType != 'register') backTxt = 'Reset Your Password';
                headerTxt = 'Verification';
                break;

            case 'status-dialog':
                backTxt = app.editData['content'];
                if (typeof app.editData['name'] != 'undefined' && app.editData['name'].length > 0) backTxt = app.editData['name'] + ' - ' + backTxt;
                if (app.reminding) backTxt = 'RemindMe';
                headerTxt = 'Message Status';
                break;

            case 'settings':
                backTxt = 'Scheduled';
                if (app.lastPageBeforeSettings == 'history') backTxt = 'History';
                headerTxt = 'Settings';
                break;

            case 'new':
                backTxt = 'Scheduled';
                if (app.lastPageBeforeNew == 'history') backTxt = 'History';
                if (app.lastPageBeforeNew == 'groups') backTxt = 'Groups';


                if (app.reminding) {
                    $('#addTo-from-contacts, #addTo-from-contacts-wrapper').hide();
                } else {
                    $('#addTo-from-contacts, #addTo-from-contacts-wrapper').show();
                };


                app.canResetNewPage = true;
                var data = $('#new .edit-id').val().split('&');
                if (!app.editing && !app.viewing) {
                    $('#new-status, #new-schedule').hide();
                    $('#new .edit-id').val('');

                    if (app.reminding) {
                        $('#new-status, #new-schedule').hide();
                        $('#new-recipient').parents('.fieldcontain').hide();
                        $('#new .ui-content').addClass('no-to');
                        $('#new-content').removeClass('bigger-max-height biggest-no-to-max-height');
                        $('#new-content').addClass('biggest-max-height');
                    }
                } else if (!app.draftEdit && (app.editing || app.viewing) && $('#new-recipient').val().length < 1) {
                    $.ajax({
                        url: app.protocol + app.url + '/sms/view/' + data[0] + '/' + data[1] + '?u=' + app.fullPhoneNumber + '&p=' + app.password,
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
                                obj._updateSmsFields(resp.data);
                            } else {
                                app.ajaxAlert('new');
                            }
                        },
                        error: function () {
                            app.ajaxAlert('new');
                        }
                    });
                } else if (app.draftEdit && $('#new-recipient').val().length < 1) {
                    var drafts = app.updateDrafts('list');
                    data = {};
                    $(drafts).each(function (draft) {
                        if (drafts[draft].Sms['id'] == app.draftId) {
                            data = drafts[draft];
                            return false;
                        }
                        return undefined;
                    });
                    obj._updateSmsFields(data);
                }

                if (!app.editing && !app.viewing && !app.copying && !app.reminding) {
                    $('#new .ui-content').removeClass('no-to');
                    $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height bigger-max-height');
                }
                if (!app.reminding) {
                    $('#new-to-field').show();
                } else {
                    $('#new-recipient').val(app.phoneNumber);
                }

                var saveEl = $('#schedule-options [data-id="header-nav"] .save .ui-btn-text');
                if (saveEl.length < 1) saveEl = $('#schedule-options [data-id="header-nav"] .save');
                if (app.viewing) {
                    saveEl.text('Cancel');
                    $('#new-submit-button').addClass('full-width');
                    $('#new-submit-button .ui-btn-text').text('Re-schedule');
                    $('#new-submit-button').css('width', '97%');
                    $('#new-recipient, #new-content, #new-date, #new-name').addClass('ui-disabled');
                    $('#message-repeats-none').parents('fieldset').addClass('ui-disabled');
                } else {
                    saveEl.text('Save');
                    $('#new-submit-button').removeClass('full-width');
                    $('#new-submit-button .ui-btn-text').text('Schedule');
                    $('#new-submit-button').css('width', 'auto');
                    $('#new-recipient, #new-content, #new-date, #new-name').removeClass('ui-disabled');
                    $('#message-repeats-none').parents('fieldset').removeClass('ui-disabled');
                }

                if (!app.reminding && (app.editing || app.viewing)) {
                    $('#new-to-field').addClass('grey-bottom');
                    $('#new-content').removeClass('bigger-max-height biggest-max-height biggest-no-to-max-height');
                } else if (!app.reminding) {
                    $('#new-to-field').removeClass('grey-bottom');
                    $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height');
                    $('#new-content').addClass('bigger-max-height');
                }

                if (app.viewing && !app.editing) {
                    $('#new-content-bubble').show();
                    $('#new-content').hide();
                    $('#new-submit-button').css('min-width', '12em');
                } else {
                    $('#new-content').show();
                    $('#new-content-bubble').hide();
                    $('#new-submit-button').css('min-width', '0');
                }

                if (app.editing) {
                    $('#new-content').css('width', '99.7%');
                    $('#new-submit-button').hide();
                } else {
                    $('#new-content').css('width', '12.9em');
                    $('#new-submit-button').show();
                }

                if (app.viewing) {
                    $('#message-repeats-wd').slider();
                    $('#message-repeats-wd').slider('disable');
                } else {
                    $('#message-repeats-wd').next().removeClass('ui-disabled');
                }

                if (app.reminding) {
                    $('#new-name').val('Remember To');
                    $('h1').css('overflow', 'visible');
                    $('#new-name').addClass('ui-disabled');
                } else {
                    $('h1').css('overflow', 'hidden');
                    $('#new-name').removeClass('ui-disabled');
                }

                if (app.editing) {
                    $('.save').show();
                } else {
                    $('.save').removeClass('cancel-state').hide();
                }

                if (app.viewing) {
                    $('#new-submit-button').removeClass('ui-disabled');
                } else {
                    $('#new-submit-button').addClass('ui-disabled');
                }

                if (app.viewing || app.editing) {
                    $('#new-status, #new-schedule').show();
                }

                if (!app.viewing) {
                    var anyEmpty = false;
                    $('#new-recipient, #new-content').each(function () {
                        if ($(this).val().length < 1) anyEmpty = true;
                    });

                    if (!anyEmpty) {
                        $('#new-submit-button').removeClass('ui-disabled');
                    } else {
                        $('#new-submit-button').addClass('ui-disabled');
                    }
                }

                if (app.editing && app.draftEdit) {
                    $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
                }

                if (app.copying) {
                    $('#new-date').val('');
                    $('#new-date-text').text(moment().format('ddd, D MMM YYYY, hh:mm a'));
                    $('#new-repeats-text').text('Never');
                    $('#message-repeats input[name="message-repeats"]').removeAttr('checked');
                    $('#message-repeats-none').attr('checked', 'checked');
                    $('#message-repeats-wd option:selected').removeAttr('selected');
                    $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
                    $('#new-submit-button').css('min-width', '0');
                    $('#new-content-bubble').hide();
                    try {
                        $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
                    } catch (e) { }
                    try {
                        $('#message-repeats-wd').slider('enable');
                    } catch (e) { }
                    app.copying = false;
                }

                app.stopDraftAddEdit = true;

                if (!app.editing && !app.viewing && !app.reminding) {
                    headerTxt = 'New Message';
                } else if (app.reminding) {
                    headerTxt = '<span class="page-title"><img src="img/icon_reminder.png" /></span>';
                } else {
                    var name = app.editData.content;
                    if (app.editData.name != undefined && app.editData.name.length > 0) name = app.editData.name + ' - ' + name;
                    headerTxt = name;
                }
                break;

            case 'messagecredits':
                backTxt = 'Help';
                if (app.lastPageBeforeMessageCredits == 'status-dialog') {
                    backTxt = 'Message Status';
                } else if (app.lastPageBeforeMessageCredits == 'purchase') {
                    backTxt = 'Purchase';
                }
                headerTxt = 'Message Credits';
                break;

            case 'addcontactfromnumber':
                backTxt = 'Back';
                headerTxt = 'Add a Number';
                break;
            case 'addcontactfromcontact':
                backTxt = 'Back';
                headerTxt = 'Add a Contact';
                break;
            case 'addNumber':
                backTxt = 'OK';
                headerTxt = 'Add a Number';
                break;
            case 'newMessageRecipients':
                backTxt = 'Back';
                headerTxt = 'Recipients';
                break;
        }

        $('.back .ui-btn-text').text(backTxt);
        $('[data-role="header"] .ui-title').html(headerTxt);
    },
    _updateSmsFields: function (data) {
        app.stopDraftAddEdit = true;
        app.editData = data.Sms;
        $.extend(app.oldEditData, app.editData);
        app.editViewStatus = data.Schedule.status;
        if (app.editData.reminder == false) {
            app.editData.reminder = 0;
        } else {
            app.editData.reminder = 1;
        }
        app.editData.time = app.editData.time_unix;
        app.editData.schedule_time = data.Schedule.send_time;
        if (data.Sms.reminder) {
            app.reminding = true;
            $('#new-status, #new-schedule').hide();
            $('#new-recipient').parents('.fieldcontain').hide();
            $('#new .ui-content').addClass('no-to');
            $('#new-content').removeClass('biggest-max-height bigger-max-height');
            $('#new-content').addClass('biggest-no-to-max-height');
        } else {
            $('#new .ui-content').removeClass('no-to');
            $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height bigger-max-height');
        }
        var statusColour = data.Schedule.status_colour;
        var statusText = data.Schedule.status_text;
        var statusIconColour = '';
        if (!app.viewing) {
            statusIconColour = 'black';
            switch (data.Schedule.status_colour) {
                case '92d050': // green
                    statusIconColour = 'green';
                    break;
                case 'f0b05f': // amber
                    statusIconColour = 'amber';
                    break;
                case 'c80408': // red
                    statusIconColour = 'red';
                    break;
            }
        } else {
            statusColour = 'b60c76';
            statusIconColour = 'cross';
            switch (data.Schedule.status) {
                case 'delivered':
                case 'pending': // tick
                    statusIconColour = 'tick';
                    break;
            }
        }
        statusText += ' <img src="img/icon_' + statusIconColour + '.png" class="status-icon" />';
        $('#new-recipient').val(data.Sms.recipient_user);
        $('#new-content').val(data.Sms.content);
        $('#new-content-bubble').html(data.Sms.content.replace(/\n/g, '<br />'));
        $('#new-status-text').html(statusText)
            .attr('style', 'color: #' + statusColour + ' !important');
        $('#new-scheduled').text(moment(data.Schedule.send_time * 1000).format('ddd, D MMM YYYY, hh:mm a'));
        app.stopDraftAddEdit = true;
        $('#new-name').val(data.Sms.name);
        $('#new-name-text').text(data.Sms.name);
        $('#status-dialog-cost').text(data.Sms.cost);
        if (typeof data.Sms.cost != 'undefined') {
            $('#status-dialog-cost-p').show();
        } else {
            $('#status-dialog-cost-p').hide();
        }

        if (!app.draftEdit && !app.viewing) {
            $('#delete-to-draft').show();
        } else {
            $('#delete-to-draft').hide();
        }

        var scrollEl = $('#new-date');
        if (app.viewing || scrollEl.hasClass('scrollified')) {
            scrollEl.scroller('destroy').removeClass('scrollified');
        }
        if (!app.viewing) {
            app.stopDraftAddEdit = true;
            var scrollerDate = moment(new Date(data.Schedule.send_time * 1000).toUTCString()).format('MM/DD/YYYY hh:mm A');
            scrollEl.val(scrollerDate)
                .scroller({
                    preset: 'calendar',
                    theme: 'ios',
                    mode: 'scroller',
                    display: 'inline',
                    lang: 'en'
                }).addClass('scrollified').trigger('change');
        }
        $('#new-date-text').text(moment(new Date(data.Schedule.send_time * 1000).toUTCString()).format('ddd, D MMM YYYY, hh:mm a'));

        var repeats = false;
        var repeatsTxt = 'Never';
        if (data.Sms.repeat_options.length > 0) {
            var tmp = JSON.parse(data.Sms.repeat_options);
            if (typeof tmp == 'object') {
                $('#message-repeats input[name="message-repeats"]').removeAttr('checked');

                if (tmp.D == '1') {
                    repeats = true;
                    repeatsTxt = 'Daily';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-d').attr('checked', 'checked');
                } else if (tmp.W == '1') {
                    repeats = true;
                    repeatsTxt = 'Weekly';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-w').attr('checked', 'checked');
                } else if (tmp.M == '1') {
                    repeats = true;
                    repeatsTxt = 'Monthly';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-m').attr('checked', 'checked');
                } else if (tmp.Y == '1') {
                    repeats = true;
                    repeatsTxt = 'Annually';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-y').attr('checked', 'checked');
                } else {
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-none').attr('checked', 'checked');
                }

                if (repeats && tmp.WD == '1' && tmp.W != '1') {
                    repeatsTxt += ', week days only';
                }

                app.stopDraftAddEdit = true;
                $('#message-repeats-wd option:selected').removeAttr('selected');
                $('#message-repeats-wd option[value="' + (tmp.WD == '1' ? 'on' : 'off') + '"]').attr('selected', 'selected');
            }
        }
        $('#new-repeats-text, #status-dialog-repeats-text').text(repeatsTxt);

        if (repeats && data.Sms.time_unix != data.Schedule.send_time) {
            $('#status-dialog-repeats-startdate').text(moment(new Date(data.Sms.time_unix * 1000).toUTCString()).format('DD/MM/YYYY hh:mm A'));

            if (typeof data.Sms.end_date != 'undefined' && data.Sms.end_date != '0') {
                $('#status-dialog-repeats-enddate').text(moment(new Date(data.Sms.end_date * 1000).toUTCString()).format('DD/MM/YYYY hh:mm A'));
                $('#status-dialog-repeats-end').show();
            } else {
                $('#status-dialog-repeats-end').hide();
            }
            if (typeof data.Sms.time_unix != 'undefined') $('#status-dialog-repeats-start').show();
        } else {
            $('#status-dialog-repeats-start').hide();
        }

        $('#message-repeats input[name="message-repeats"]').checkboxradio();
        $('#message-repeats-wd').slider();
        try {
            $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
        } catch (e) { }
        try {
            $('#message-repeats-wd').slider('refresh');
        } catch (e) { }

        if (app.reminding) {
            if (app.viewing || app.editing) {
                $('#new-status, #new-schedule').show();
            } else {
                $('#new-status, #new-schedule').hide();
            }
            $('h1').css('overflow', 'visible');
            $('#new-name').addClass('ui-disabled');
        } else {
            $('h1').css('overflow', 'hidden');
            $('#new-name').removeClass('ui-disabled');
        }

        var headerTxt = '';
        if (!app.editing && !app.viewing && !app.reminding) {
            headerTxt = 'New Message';
        } else if (app.reminding) {
            headerTxt = '<span class="page-title"><img src="img/icon_reminder.png" /></span>';
        } else {
            var name = app.editData.content;
            if (app.editData.name != undefined && app.editData.name.length > 0) name = app.editData.name + ' - ' + name;
            headerTxt = name;
        }
        $('[data-role="header"] .ui-title').html(headerTxt);
        app.justSetEditOpts = true;
    },
};