app.pages.newMessage = {    
    init:function() {
        var obj = this;
        $('#new').live('pageshow', function () {
            app.stopDraftAddEdit = false;
            $(this).addClass('ui-page-active');
        });
        $('#new-content').live('keyup', function () {
            app.pages.messageRecipients.saveNewToDraft();
        });
        $('#new .save').live('click', function () {
            var data = {
                'recipient': $('#new-recipient').val(),
                'content': $('#new-content').val(),
                'reminder': app.reminding ? '1' : '0',
                'part': 'recipient_content'
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);
            obj.saveNew();
        });
        $('#addTo-from-contacts').live('click', function () {
            if (app.viewing) {
                $('#btn-add-contact-to-recipients, #btn-add-custom-to-recipients').addClass('ui-disabled');
            } else {
                $('#btn-add-contact-to-recipients, #btn-add-custom-to-recipients').removeClass('ui-disabled');;
            }
        });
        /**
     * Bind new message submit button
     */
        $('#new-submit-button').live('click', function () {
            obj._submit();
        });
        
        $('#new #addTo-from-contacts').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                app.pages.messageRecipients.onLoaded($('#new #new-recipient').val().split(','));
                $.mobile.changePage('#newMessageRecipients');
            }
        });
        /**
     * Bind schedule options link
     */
        $('#edit-schedule-options-link').live('click', function () {
            var data = {
                'recipient': $('#new-recipient').val(),
                'content': $('#new-content').val(),
                'reminder': app.reminding ? '1' : '0'
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);
            $.mobile.changePage('#schedule-options');
        });
    },
    _submit:function() {
        if (!app.viewing) {
            var phoneNumbers = $('#new-recipient').val();
            if (phoneNumbers.length > 0) {
                var tmp = [];
                var dataSplit = phoneNumbers.split(',');
                $.each(dataSplit, function (i) {
                    var phoneNumber = dataSplit[i];
                    if (phoneNumber.substr(0, 1) == '+') {
                        phoneNumber = app.userExitCode + phoneNumber.substr(1);
                    }
                    tmp.push(phoneNumber.replace(/[^0-9]/g, ''));
                });
                phoneNumbers = tmp.join(',');
                $('#new-recipient').val(phoneNumbers);
            }

            var data = {
                'recipient': phoneNumbers,
                'content': $('#new-content').val(),
                'reminder': app.reminding ? '1' : '0',
                'part': 'recipient_content'
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);

            if (!app.unsyncEdit) {
                var service = new app.services.MessageService();
                service.validate("new", $.param(data), function () {
                    $.mobile.changePage('#schedule-options');
                }, function () {
                    var errTxt = 'Please ensure that you have entered your recipient(s) and message correctly then try again.';
                    if (app.reminding) {
                        errTxt = 'Please ensure that you have entered your message correctly then try again.';
                    }
                    app.ajaxAlert('new', errTxt);
                }, function () {
                    app.saveAsUnsynced();
                    $.mobile.changePage('#schedule-options');
                });
            } else {
                $.mobile.changePage('#schedule-options');
            }
        } else {
            app.viewing = false;
            app.copying = true;
            $.mobile.changePage('#new', {
                allowSamePageTransition: true
            });
            $('#new-submit-button').removeClass('ui-disabled');
        }
    },
    /**
     * Show edit repeating message confirmation if necessary and then call newActualSave function
     */
    saveNew: function () {
        app.editType = 'single';
        app.pages.newMessage.newActualSave();
    },
    newActualSave: function () {
        app.loadingTimers.push(setTimeout(function () {
            app.doProgressBar();
        }, 1000));

        var tmp = $('#new .edit-id').val().split('&');

        if (app.editType == 'single') {
            app.editData.oldSchedule = tmp[1];
            if (app.editData.repeatOptionsHasChanged != true) {
                app.editData.repeat_options = JSON.stringify({
                    'D': 0,
                    'W': 0,
                    'M': 0,
                    'Y': 0,
                    'WD': 0
                });
            }
            delete app.editData.id;
        }

        if (app.draftEdit) {
            delete app.editData['id'];
            delete app.editData['is_draft'];
            delete app.editData['recipient_user'];
            delete app.editData['part'];
        }

        if (app.editing && app.editData['time'] == undefined) {
            app.editData['time'] = new Date($('#new-date').val()).getTime() / 1000;
        }

        if (app.draftEdit) {
            var draftData = app.updateDrafts('view', app.draftId);
            var realId = draftData.Sms['real_id'];
            if (realId != undefined && realId.length > 0) {
                tmp = realId.split('&');
            }
        }

        var data = app.editing ? app.editData : app.newData;
        if (data.recipient.length > 0) {
            var tmpRecipients = [];
            var dataSplit = data.recipient.split(',');
            $.each(dataSplit, function (i) {
                var phoneNumber = dataSplit[i];
                if (phoneNumber.substr(0, 1) == '+') {
                    phoneNumber = app.userExitCode + phoneNumber.substr(1);
                }
                tmpRecipients.push(phoneNumber.replace(/[^0-9]/g, ''));
            });
            data.recipient = tmpRecipients.join(',');
            $('#new-recipient').val(data.recipient);
        }

        if (!app.unsyncEdit) {
            if (app.editing && app.editData.schedule_time != undefined) {
                app.editData.time = app.editData.schedule_time;
            }
            var service = new app.services.MessageService();
            service.editOrSchedule(tmp[0], $.param(app.editing ? app.editData : app.newData), function(resp) {
                app.justSetSpam = (resp.data == '1');

                if (app.draftEdit && app.draftId.length > 0) {
                    app.updateDrafts('delete', app.draftId);
                }
                $('#new h1').css('overflow', 'hidden');
                $.mobile.changePage('#scheduled');
            }, function() {
                app.clearTimeouts();
                try {
                    $('#' + $.mobile.activePage.attr('id') + ' .progressbar').progressbar({
                        value: parseInt($('#' + $.mobile.activePage.attr('id') + ' .progressbar').attr('max-value'))
                    });
                } catch(ex) {
                    console.log('new message progressbar error: ' + ex);
                }
                $('#new h1 .progressbar-status, #new h1 .progressbar, #schedule-options h1 .progressbar-status, #schedule-options h1 .progressbar').remove();
                $('#new h1 .page-title, #schedule-options h1 .page-title').show();
                $('#new h1, #schedule-options h1').append('<span class="progressbar-status">Scheduling...</span><span class="progressbar"></span>');
                try {
                    TolitoProgressBar('#new h1 .progressbar, #schedule-options h1 .progressbar')
                    .isMini(true)
                    .showCounter(false)
                    .setInterval(20)
                    .setMax(125)
                    .setOuterTheme('b')
                    .setInnerTheme('c')
                    .build()
                    .init();
                }
                catch (exp) {
                    console.log('progress bar 1782 error: ' + exp);
                }
                $.mobile.loading('hide');
            });

        } else {
            $.mobile.changePage('#scheduled');
        }
    }
};