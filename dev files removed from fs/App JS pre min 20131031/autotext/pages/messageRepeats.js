app.pages.messageRepeats = {    
    _loadedRepeatOptions:'',
    init: function () {
        var me = this;
        $('#message-repeats').live('pagebeforeshow', function () { app.pages.messageRepeats.onLoaded(); });
        /**
         * Bind message repeat options Weekly option to disable the Week Days Only option. Also saves draft
         */
        $('#message-repeats-w').live('change', function () {
            if (!app.stopDraftAddEdit && app.draftId == null) {
                app.draftId = app.generateUUID();
            }
            app.updateDrafts('view', app.draftId);
            app.updateDrafts('edit', app.draftId);

            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
            $('#message-repeats-wd option').removeAttr('selected');
            $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
            $('#message-repeats-wd').slider('refresh').slider('disable');
        });
        /**
         * Bind all message repeat options other than Weekly option to enable the Week Days Only option. Also saves draft
         */
        $('#message-repeats-none, #message-repeats-d, #message-repeats-m, #message-repeats-y').live('change', function () {
            if (!app.stopDraftAddEdit && app.draftId == null) {
                app.draftId = app.generateUUID();
            }
            app.updateDrafts('view', app.draftId);
            app.updateDrafts('edit', app.draftId);

            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
            $('#message-repeats-wd').slider('enable');
        });
        /**
         * Bind message repeat options Weekly Days Only option to save draft
         */
        $('#message-repeats-wd').live('change', function () {
            if (!app.stopDraftAddEdit && app.draftId == null) {
                app.draftId = app.generateUUID();
            }
            app.updateDrafts('view', app.draftId);
            app.updateDrafts('edit', app.draftId);

            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
        });
        /**
         * Bind message repeat options back button
         */
        $('#message-repeats .back').live('click', function (e) {
            me._onBack(e);
        });
    },
    onLoaded: function () {
        if ($('#message-repeats input[name="message-repeats"]:checked').length < 1) {
            $('#message-repeats-none').attr('checked', 'checked');
            $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
        }
        this._loadedRepeatOptions = app.editData.repeat_options;
        var repeatOpts = JSON.parse(app.editData['repeat_options']);
        if (repeatOpts.W != undefined && repeatOpts.W == '1') {
            $('#message-repeats-wd').slider('disable');
        } else {
            $('#message-repeats-wd').slider('enable');
        }
    },
    _onBack:function(e) {
        if (!app.viewing) {
            e.preventDefault();
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

            var data = {
                'repeat_options': JSON.stringify(repeatOptions),
                'part': 'repeat_options'
            };
            if (data.repeat_options != this._loadedRepeatOptions) {
                app.newData.repeatOptionsHasChanged = true;
                app.editData.repeatOptionsHasChanged = true;
            }
            $.extend(app.newData, data);
            $.extend(app.editData, data);
            if (!app.unsyncEdit) {
                var service = new app.services.MessageService();
                service.validate("message-repeats", $.param(data), function() {
                    $.mobile.changePage('#schedule-options', { reverse: true });
                }, function() {
                    app.ajaxAlert('message-repeats', 'Please ensure that you have entered valid repeat options then try again.');
                }, function() {
                    app.saveAsUnsynced();
                    $.mobile.changePage('#schedule-options', { reverse: true });
                });
            } else {
                $.mobile.changePage('#schedule-options', { reverse: true });
            }
        } else {
            $.mobile.changePage('#schedule-options', { reverse: true });
        }
    }
};