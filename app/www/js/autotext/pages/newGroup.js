app.pages.newGroup = {    
    init:function() {
        var me = this;
        $('#newgroup').live('pagebeforeshow', function () { app.pages.newGroup.onLoaded(); });
        $('#add-from-contact').live('click', function () {
            app.groupData['name'] = $('#newgroup-name').val();
            me._addFromContact();
            $.mobile.changePage('#addcontactfromcontact');
        });
        $('#add-from-number').live('click', function () {
            app.groupData['name'] = $('#newgroup-name').val();
            $.mobile.changePage('#addcontactfromnumber');
        });
        /**
         * Bind group contacts list to hide delete buttons if any are shown
         */
        $('#newgroup-contacts-list li').live('click', function () {
            var $li = $(this);
            if ($('.aSwipeBtn').css('overflow') == 'visible' && $('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                    $li.find('.ui-li-heading').css('max-width', '50%');
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            }
        });
        /**
         * Bind group save button
         */
        $('#newgroup .save').live('click', function () {
            app.groupData['name'] = $('#newgroup-name').val();
            var service = new app.services.GroupService();
            service.addEdit(app.groupEditing, $.param(app.groupData), function() {
                $.mobile.changePage('#groups', { reverse: false });
            }, function() {
                app.ajaxAlert('newgroup', 'Please ensure that you have entered your group\'s name correctly then try again.');
            });
        });
        
    },
    onLoaded: function () {
        var me = this;
        if (!$('#newgroup').hasClass('just-loaded')) {
            if (!app.groupEditing) {
                $('#newgroup-name, #addcontactfromnumber-name, #addcontactfromnumber-number').val('');
                app.groupData = {
                    'name': '',
                    'contacts': []
                };
                me.update();
            } else {
                var editId = $('#newgroup .edit-id').val();
                var service = new app.services.GroupService();
                service.getGroup(editId, function(data) {
                    app.groupData = {
                        'name': data.Group.name,
                        'contacts': data.GroupContact
                    };
                    me.update();
                });
            }
            $('#newgroup').addClass('just-loaded');
        }
    },
    update:function() {
        var me = this;
        $('#newgroup-name').val(app.groupData.name);

        $('#newgroup-total').text(app.groupData.contacts.length);

        $('#newgroup-contacts-list li').not('#newgroup-contact-template').remove();
        $.each(app.groupData.contacts, function (contact) {
            var data = app.groupData.contacts[contact];
            var newRow = $('#newgroup-contact-template').clone();
            newRow.find('.contact-name').text(data.name);
            newRow.find('.contact-number').text(data.phone_number_user);
            newRow.removeAttr('id');
            newRow.show();
            $('#newgroup-contacts-list').append(newRow);
        });
        $('#newgroup-contacts-list').listview('refresh');
        $('#newgroup-contacts-list li').swipeDelete({
            click: function (e) {
                me.deleteContact(e);
            }
        });
    },
    deleteContact:function(e) {
        e.preventDefault();
        var currentRow = $(e.currentTarget).parents('li');
        var index = currentRow.prevAll().length - 1;
        currentRow.slideUp(400, function () {
            currentRow.remove();
            app.groupData.contacts.splice(index, 1);
            $('#newgroup-total').text(app.groupData.contacts.length);

            if (app.groupEditing) {
                var editId = $('#newgroup .edit-id').val();
                var service = new app.services.GroupService();
                service.editGroup(editId);
            }
        });
    },
    _addFromContact: function () {
        var selectedIds = [];
        var contacts = app.groupData['contacts'];
        if (contacts != undefined) {
            for (var i = 0; i < contacts.length; i++) {
                var contact = contacts[i];
                if (contact.custom == false) {
                    selectedIds.push(contact.id);
                }
            }
        }
        app.pages.contactList.fromGroup = true;
        app.pages.contactList.onLoaded(selectedIds);
    }
};