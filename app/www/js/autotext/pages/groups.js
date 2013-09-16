app.pages.groups = {    
    init:function() {
        $('#groups').live('pagebeforeshow', function () { app.pages.groups.onLoaded(); });
        /**
         * Bind main nav groups button
         */
        $('#groups .new').live('click', function () {
            $('#newgroup').removeClass('just-loaded');
            $.mobile.changePage('#newgroup');
        });
        /**
         * Bind groups page group row link
         */
        $('#groups-list .view-group').live('click', function (e) {
            e.preventDefault();
            if ($('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            } else {
                app.groupEditing = true;
                app.lastPageBeforeNew = 'groups';
                $('#newgroup .edit-id').val($(this).parents('li').attr('data-id'));
                $('#newgroup').removeClass('just-loaded');
                $.mobile.changePage('#newgroup');
            }
        });
        /**
         * Bind groups schedule buttons
         */
        $('#groups-list .view-group .groups-schedule-link').live('click', function () {
            var id = $(this).parents('li').attr('data-id');
            var service = new app.services.GroupService();
            service.getGroup(id, function(allData) {
                var tmp = [];
                $.each(allData['GroupContact'], function (contact) {
                    var data = allData['GroupContact'][contact];
                    tmp.push(data.phone_number_user);
                });
                app.editData = {};
                app.newPageResetFields();
                app.lastPageBeforeNew = 'groups';
                app.newDraft = true;
                $('#new-recipient').val(tmp.join(','));
                $.mobile.changePage('#new');
            });
            return false;
        });
    },
    onLoaded: function () {
        var me = this;
        app.groupEditing = false;
        var service = new app.services.GroupService();
        service.getAll(function(allData) {
            $('#groups-list li').not('#groups-group-template').remove();
            $.each(allData, function (row) {
                var data = allData[row];
                var newRow = $('#groups-group-template').clone();
                newRow.find('.group-name').text(data.name);
                newRow.find('.group-contacts').text(data.members);
                newRow.attr('data-id', data.id);
                newRow.removeAttr('id');
                newRow.show();
                $('#groups-list').append(newRow);
            });
            $('#groups-list').listview('refresh');
            $('#groups-list li').swipeDelete({
                click: function (e) {
                    me._delete(e);
                }
            });
        });
        
        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .groups-link').addClass('ui-btn-active');
    },
    _delete:function(e) {
        e.preventDefault();
        var currentRow = $(e.currentTarget).parents('li');
        var id = currentRow.attr('data-id');

        var service = new app.services.GroupService();
        service.delete(id, function() {
            $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                $(this).parents('.delete-btn-container').remove();
            });
            currentRow.slideUp(400, function () {
                app.pages[$.mobile.activePage.attr('id')].onLoaded();
            });
        });
    }
};