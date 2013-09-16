app.pages.contactList = {
    tobeAdded: [],
    fromGroup: true,
    _busy: false,
    initOnContactsLoaded: function () {
        var me = this;
        $('#txtFilterContacts').live('keyup', function () {
            me.filterContacts();
        });
        $('#contact-list>li').live('click', function () {
            if (me._busy) {
                return;
            }
            me._busy = true;
            var $li = $(this);
            var phoneNumber = $.trim($li.find('.contact-item-number').text());
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = app.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

            var data = {
                'name': $.trim($li.find('.contact-item-name').text()),
                'phone_number': phoneNumber,
                'part': 'contact',
                'custom': false,
                'id': $li.attr('data-id')
            };
            var service = new app.services.GroupService();
            service.validate(data, 'addcontactfromcontact', 'Cannot add from Contacts - please try again', function () {
                data['phone_number_user'] = data['phone_number'];
                me.tobeAdded.push(data);
                $li.addClass('contact-selected');
                app.system.toast(phoneNumber + ' was added.');
                me._busy = false;
            }, function() {
                me._busy = false;
            });
        });
        $('#addcontactfromcontact a.back').live('click', function () {
            $('#txtFilterContacts').val('');
            if (me.fromGroup) {
                for (var i = 0; i < me.tobeAdded.length; i++) {
                    app.groupData['contacts'].push(me.tobeAdded[i]);
                }
                app.pages.newGroup.update();
                $.mobile.changePage('#newgroup', { reverse: true });
            }
            else {
                var numbers = app.pages.messageRecipients.numbers;
                for (var j = 0; j < me.tobeAdded.length; j++) {
                    var toAdd = me.tobeAdded[j];
                    numbers.push({
                        name: toAdd.name,
                        number: toAdd.phone_number
                    });
                }
                app.pages.messageRecipients.onLoaded(numbers);
                $.mobile.changePage('#newMessageRecipients', { reverse: true });
            }
        });
    },
    renderContactList: function () {
        var html = '';
        var contacts = app.caches.contacts;
        for (var i = 0; i < contacts.length; i++) {
            var contact = contacts[i];
            html += '<li data-id="' + contact.id + '" class="">\
                        <div class="contact-item-name">' + contact.name + '</div>\
                        <div class="contact-item-number">' + contact.number + '</div>\
                    </li>';
        }
        $('#contact-list').html(html);
    },
    onLoaded: function (selectedIds) {
        this._busy = false;
        this.tobeAdded = [];
        this._updateSelected(selectedIds);
    },
    filterContacts: function () {
        var key = $('#txtFilterContacts').val();
        $('#contact-list>li').each(function () {
            var $li = $(this);
            if ($li.text().indexOf(key) > -1) {
                $li.removeClass('hidden');
            } else {
                $li.addClass('hidden');
            }
        });
    },
    _updateSelected: function (selectedIds) {
        selectedIds = selectedIds == null ? [] : selectedIds;
        $('#contact-list>li').each(function () {
            var $li = $(this);
            var id = $li.attr('data-id');
            var selected = false;
            for (var i = 0; i < selectedIds.length; i++) {
                if (selectedIds[i] == id) {
                    selected = true;
                    break;
                }
            }
            if (selected) {
                $li.addClass('contact-selected');
            } else {
                $li.removeClass('contact-selected');
            }
        });
    }
};