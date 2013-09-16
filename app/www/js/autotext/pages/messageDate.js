app.pages.messageDate = {    
    init:function() {
        /**
         * Bind message date change to save draft
         */
        $('#new-date').live('change', function () {
            if ($('#new-date-text').text().length > 0) $('#new-date-text, #new-scheduled').text(moment($(this).val()).format('ddd, D MMM YYYY, hh:mm a'));
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');

            if (!app.stopDraftAddEdit && app.draftId == null) {
                app.draftId = app.generateUUID();
            }
            if (!app.stopDraftAddEdit) {
                app.updateDrafts('view', app.draftId);
                app.updateDrafts('edit', app.draftId);
            }
        });
        
        /**
         * Bind message date options back button
         */
        $('#message-date .back').live('click', function () {
            $.mobile.changePage('#schedule-options', { reverse: true });
        });
    }
};