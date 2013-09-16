app.pages.scheduleOptions = {    
    init:function() {
        var obj = this;
        $('#schedule-options').live('pagebeforeshow', function () { app.pages.scheduleOptions.onLoaded(); });
        $('#delete-to-draft-repeats-confirm .cancel').live('click', function () {
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        $('#delete-to-draft-repeats-confirm .all').live('click', function () {
            app.draftDeleteType = 'all';
            obj._doDraftDelete();
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        $('#delete-to-draft-repeats-confirm .single').live('click', function () {
            app.draftDeleteType = 'single';
            obj._doDraftDelete();
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        $('#schedule-options .save').live('click', function () {
            if (!app.viewing) {
                if ($(this).hasClass('cancel-state')) {
                    $.mobile.changePage('#new', { reverse: true });
                } else {
                    var sendTime = $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() : new Date().getTime();
                    sendTime = sendTime / 1000;
                    var data = {
                        'time': sendTime
                    };
                    app.editData.schedule_time = sendTime;
                    $.extend(app.newData, data);
                    $.extend(app.editData, data);
                    delete app.newData['part'];
                    delete app.editData['part'];

                    app.pages.newMessage.saveNew();
                }
            } else {
                $.mobile.changePage('#history');
            }
        });
        /**
         * Bind message schedule options back button
         */
        $('#schedule-options .back').live('click', function () {
            var sendTime = $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() : new Date().getTime();
            sendTime = sendTime / 1000;
            var data = {
                'time': sendTime
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);
            $.mobile.changePage('#new', { reverse: true });
        });
        /**
     * Bind message name link
     */
        $('#new-name-link').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-name');
            }
        });
        /**
         * Bind message date link
         */
        $('#new-date-link').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-date');
            }
        });
        /**
         * Bind repeat options link
         */
        $('#new-repeats-link').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-repeats');
            }
        });
        /**
         * Bind delete to draft button
         */
        $('#delete-to-draft-btn').live('click', function () {
            app.draftDeleteType = 'all';
            obj._doDraftDelete();
        });
    },
    onLoaded: function () {
        var scrollEl = $('#new-date');
        if (!app.viewing && !scrollEl.hasClass('scrollified')) {
            scrollEl.scroller({
                preset: 'calendar',
                theme: 'ios',
                mode: 'scroller',
                display: 'inline',
                lang: 'en'
            }).addClass('scrollified');
        }

        app.pages.scheduleOptions._newSmsSetData();

        var repeatsTxt = 'Never';
        if (app.newData.repeat_options.length > 0) {
            var tmp = JSON.parse(app.newData.repeat_options);
            if (typeof tmp == 'object' && tmp != null) {
                var repeats = false;
                if (tmp.D == '1') {
                    repeats = true;
                    repeatsTxt = 'Daily';
                } else if (tmp.W == '1') {
                    repeats = true;
                    repeatsTxt = 'Weekly';
                } else if (tmp.M == '1') {
                    repeats = true;
                    repeatsTxt = 'Monthly';
                } else if (tmp.Y == '1') {
                    repeats = true;
                    repeatsTxt = 'Annually';
                }

                if (repeats && tmp.WD == '1' && tmp.W != '1') {
                    repeatsTxt += ', week days only';
                }
            }
        }

        if (!app.justSetEditOpts) {
            $('#new-name-text').text(app.newData.name);
            if ($('#new-date-text').text().length < 1) $('#new-date-text').text(moment().format('ddd, D MMM YYYY, hh:mm a'));
            $('#new-repeats-text').text(repeatsTxt);
        } else {
            app.justSetEditOpts = false;
        }

        if (app.viewing) {
            $('#schedule-options .bar-link .floatR').css('margin-right', '15px');
            $('#schedule-options .bar-link .arrow').hide();
        } else {
            $('#schedule-options .bar-link .floatR').css('margin-right', '30px');
            $('#schedule-options .bar-link .arrow').show();
        }
    },
    _newSmsSetData: function () {
        var data = {
            'name': $('#new-name').val(),
            'part': 'name'
        };
        $.extend(app.newData, data);
        $.extend(app.editData, data);

        var checkedEl = $('input[name="message-repeats"]:checked');
        if (checkedEl.length < 1) checkedEl = $('#message-repeats-none');
        var value = checkedEl.val().toUpperCase();
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

        data = {
            'repeat_options': JSON.stringify(repeatOptions),
            'part': 'repeat_options'
        };
        $.extend(app.newData, data);
        $.extend(app.editData, data);
    },
    _doDraftDelete: function () {
        $.ajax({
            url: app.protocol + app.url + '/sms/delete/' + app.dataId + (app.dataSingle ? '/' + app.dataScheduleId : '') + '?u=' + app.fullPhoneNumber + '&p=' + app.password,
            type: 'GET',
            beforeSend: function () {
                app.loadingTimers.push(setTimeout(function () {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function () {
                app.draftDeleteType = 'all';
                app.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function (resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    app.updateDrafts('view', app.generateUUID(), null, null, true);
                    $.mobile.changePage('#scheduled', { transition: 'slideup', reverse: true });
                } else {
                    app.ajaxAlert('schedule-options');
                }
            },
            error: function () {
                app.ajaxAlert('schedule-options');
            }
        });
    },
};