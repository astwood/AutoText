app.pages.messageName = {    
    init:function() {
        /**
         * Bind message name page back button to save draft
         */
        $('#message-name .back').live('click', function (e) {
            e.preventDefault();
            if (!app.viewing) {
                var data = {
                    'name': $('#new-name').val(),
                    'part': 'name'
                };
                $.extend(app.newData, data);
                $.extend(app.editData, data);
                if (!app.unsyncEdit) {
                    var service = new app.services.MessageService();
                    service.validate('message-name', $.param(data), function() {
                        $.mobile.changePage('#schedule-options', { reverse: true });
                    }, function() {
                        app.ajaxAlert('message-name', 'Please ensure that you have entered a valid message name then try again.');
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
        });
        
        /**
         * Bind message name field to save draft
         */
        $('#new-name').live('keyup', function () {
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');

            if (!app.stopDraftAddEdit && app.draftId == null) {
                app.draftId = app.generateUUID();
            }
            app.updateDrafts('view', app.draftId);
            app.updateDrafts('edit', app.draftId);
        });
    }
};