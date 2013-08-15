if(window.autotext == undefined) {
    window.autotext = {
        app: null
    };
}
if(autotext.services == undefined) {
    autotext.services = { };
}

autotext.services.contacts = {
    items: []
};

autotext.services.contacts.init = function(successCallback) {
    var me = this;
    var options = {
        filter: "",
        multiple: true,
    };
    var fields = ['*'];
    navigator.contacts.find(fields, function (phoneContacts) {
        try {
            me.sort(phoneContacts);
            me.parseContactItems(phoneContacts);
            successCallback(me.items);
        }
        catch(ex) {
            alert('init contacts error: ' + ex);
        }
    }, function (er) {
        autotext.app.ajaxAlert('login', 'Your phone book seems unavaiable at present please trying reaccessing.');
    }, options);
};

autotext.services.contacts.parseContactItems = function(phoneContacts) {
    var me = this;
    me.items = [];
    for (var j = 0; j < phoneContacts.length; j++) {
        var contact = phoneContacts[j];
        if (contact.phoneNumbers == undefined || contact.phoneNumbers.length == 0) {
            continue;
        }
        for (var n = 0; n < contact.phoneNumbers.length; n++) {
            var number = contact.phoneNumbers[n].value;
            if (number == undefined || number == null || number == "") {
                continue;
            }
            var name = me.getContactName(contact);
            me.items.push(me.createContactItem(name, number));
        }
    }
};

autotext.services.contacts.getContactNumber = function (contact) {
    if (contact.phoneNumbers == undefined || contact.phoneNumbers.length == 0) {
        return "";
    }
    var number = contact.phoneNumbers[0].value;
    for (var i = 0; i < contact.phoneNumbers.length; i++)
    {
        if (contact.phoneNumbers[i].pref) {
            number = contact.phoneNumbers[i].value;
            break;
        }
    }
    return number;
};

autotext.services.contacts.getContactName = function(contact) {
    if (contact.name && contact.name.formatted) {
        return contact.name.formatted;
    }
    if (contact.displayName != undefined) {
        return contact.displayName;
    }
    return "";
};

autotext.services.contacts.createContactItem = function (name, number) {
    return {
        id: number,
        name: name,
        number: number,
        isCustom: function() {
            return this.name == undefined || this.name == null || this.name == "";
        }
    };
};

autotext.services.contacts.sort = function(phoneContacts) {
    phoneContacts.sort(function(a, b) {
        if (a.name == undefined || b.name == undefined) {
            return 1;
        }
        var a_name = null !== a.name.familyName ? a.name.familyName : a.name.formatted,
            b_name = null !== b.name.familyName ? b.name.familyName : b.name.formatted;

        if (a_name != b_name) {
            a_name = a.name.formatted;
            b_name = b.name.formatted;
        }

        return a_name > b_name ? 1 : -1;
    });
    return phoneContacts;
};

/* end contacts */

/* pages */

if(autotext.pages == undefined) {
    autotext.pages = { };
}

autotext.pages.contactList = {
    tobeAdded:[],
    fromGroup: true,
    _busy:false,
    init: function () {
        var me = this;
        $('#txtFilterContacts').live('keyup', function() {
            me.filterContacts();
        });
        $('#contact-list>li').live('click', function() {
            if(me._busy) {
                return;
            }
            me._busy = true;
            var $li = $(this);
            var phoneNumber = $.trim($li.find('.contact-item-number').text());
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = autotext.app.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

            var data = {
                'name': $.trim($li.find('.contact-item-name').text()),
                'phone_number': phoneNumber,
                'part': 'contact',
                'custom': false,
                'id': $li.attr('data-id')
            };

            var url = autotext.app.protocol + autotext.app.url + '/groups/validates?u=' + autotext.app.fullPhoneNumber + '&p=' + autotext.app.password;
            autotext.app.ajaxPost(url, data, 'addcontactfromcontact', function() {
                data['phone_number_user'] = data['phone_number'];
                me.tobeAdded.push(data);
                $li.addClass('contact-selected');
                autotext.services.system.toast(phoneNumber + ' was added.');
                me._busy = false;
            }, 'Cannot add from Contacts - please try again',function () {
                me._busy = false;
            });
        });
        $('#addcontactfromcontact a.back').live('click', function () {
            $('#txtFilterContacts').val('');
            if (me.fromGroup) {
                for (var i = 0; i < me.tobeAdded.length; i++) {
                    autotext.app.groupData['contacts'].push(me.tobeAdded[i]);
                }
                autotext.app.updateNewGroupPage.call(autotext.app);
                $.mobile.changePage('#newgroup', { reverse: false });
            }
            else {
                var numbers = autotext.pages.messageRecipients.numbers;
                for (var i = 0; i < me.tobeAdded.length; i++) {
                    var toAdd = me.tobeAdded[i];
                    numbers.push({
                        name: toAdd.name,
                        number: toAdd.phone_number
                    });
                }
                autotext.pages.messageRecipients.onLoaded(numbers);
                $.mobile.changePage('#newMessageRecipients', { reverse: false });
            }
        });
    },
    renderContactList: function() {
        var html = '';
        var contacts = autotext.services.contacts.items;
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
    filterContacts: function() {
        var key = $('#txtFilterContacts').val();
        $('#contact-list>li').each(function() {
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
        $('#contact-list>li').each(function() {
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

autotext.pages.messageRecipients = {
    _initialized: false,
    numbers: [],
    init: function() {
        var me = this;
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        $('#newMessageRecipients .back').live('click', function() {
            me.onBack();
        });
        $('#btn-add-contact-to-recipients').live('click', function() {
            autotext.pages.contactList.fromGroup = false;
            autotext.pages.contactList.onLoaded(me.getNumericNumbers());
            $.mobile.changePage('#addcontactfromcontact');
        });
        $('#btn-add-custom-to-recipients').live('click', function() {
            $.mobile.changePage('#addNumber');
        });
        $('#selectedNumbers li').live('click', function() {
            var $li = $(this);
            if ($('.aSwipeBtn').css('overflow') == 'visible' && $('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                    $li.find('.ui-li-heading').css('max-width', '50%');
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            }
        });
    },
    onLoaded: function(numbers) {
        var me = this;
        me.numbers = [];
        for (var i = 0; i < numbers.length; i++) {
            var num = numbers[i];
            if (num != null && num != "") {
                me.numbers.push(num);
            }
        }
        if (me.numbers.length > 0 && typeof me.numbers[0] != "object") {
            me.fixNumberNames();
        }
        $('#totalNumbers').html(me.numbers.length);
        $('#selectedNumbers li').not('#list-template').remove();
        $.each(me.numbers, function(index, number) {
            var newRow = $('#list-template').clone();
            var name = number.name == undefined || number.name == '' ? '' : number.name;
            newRow.find('.contact-name').html(name);
            newRow.find('.contact-number').html(number.number);
            newRow.removeAttr('id');
            newRow.show();
            $('#selectedNumbers').append(newRow);
        });
        try {
            $('#selectedNumbers').listview('refresh');
        } catch(ex) {

        }
        $('#selectedNumbers li').swipeDelete({
            click: function(e) {
                me.onDelete(this);
            }
        });
    },
    onDelete: function(sender) {
        var me = this;
        var $li = $(sender).closest('li');
        $li.slideUp(400, function() {
            var index = $li.prevAll().length - 1;
            me.numbers.splice(index, 1);
            $li.remove();
            $('#totalNumbers').html(me.numbers.length);
        });
    },
    onBack: function() {
        var me = this;
        $("#new-recipient").val(me.getNumericNumbers());
        if (autotext.app.newDraft == false || autotext.app.draftId == null || me.numbers.length > 0) {
            autotext.app.stopDraftAddEdit = false;
            autotext.app.saveNewToDraft();
        }
        $.mobile.changePage('#new', { reverse: false });
    },
    getNumericNumbers: function() {
        var nums = [];
        for (var i = 0; i < this.numbers.length; i++) {
            nums.push(this.numbers[i].number);
        }
        return nums;
    },
    fixNumberNames: function() {
        var objs = [];
        for (var i = 0; i < this.numbers.length; i++) {
            var num = this.numbers[i];
            var contact = autotext.services.system.getFirstOrDefault(autotext.services.contacts.items, function(x) {
                return x.number == num;
            });
            objs.push({
                name: contact == null ? '' : contact.name,
                number: num
            });
        }
        this.numbers = objs;
    }
};

autotext.pages.addNumber = {
    init:function () {
        var me = this;
        $('#addNumber .back').live('click', function () {
            var number = $('#addNumber-number').val();
            if (number == '') {
                $.mobile.changePage('#newMessageRecipients', { reverse: false });
                return;
            }
            if(me.exist(number)) {
                autotext.services.system.toastError('The number was already added.');
                return;
            }
            me._validate(number, function() {
                $('#addNumber-number').val('');
                var numbers = autotext.pages.messageRecipients.numbers;
                numbers.push({
                    name: '',
                    number: number
                });
                autotext.pages.messageRecipients.onLoaded(numbers);
                $.mobile.changePage('#newMessageRecipients', { reverse: false });
            });
        });
    },
    _validate:function (number, success) {
        var data = {
            'name': 'temp name',
            'phone_number': number,
            'part': 'contact',
            'custom': true
        };
        var ap = autotext.app;
        var url = ap.protocol + ap.url + '/groups/validates?u=' + ap.fullPhoneNumber + '&p=' + ap.password;
        autotext.app.ajaxPost(url, data, 'addNumber', function(resp) {
            success();
        }, 'Please ensure that you have entered your contact\'s name and phone number correctly then try again.');
    },
    exist:function (number) {
        return autotext.services.system.getFirstOrDefault(autotext.pages.messageRecipients.numbers, function(item) {
            return  item.number == number;
        }) != null;
    }
};

/* end pages */
autotext.services.system = {
    serialize: function(obj, name) {
        var result = "";

        function serializeInternal(o, path) {
            for (p in o) {
                var value = o[p];
                if (typeof value == "object") {
                    if (p * 1 >= 0) {
                        serializeInternal(value, path + '[' + p + ']');
                    } else {
                        serializeInternal(value, path + '.' + p);
                    }
                }
                else if(typeof value != "function") {
                    result += "\n" + path + "." + p + " = " + value;
                }
            }
        }

        serializeInternal(obj, name);
        return result;
    },
    isInArray: function (item, arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == item) {
                return true;
            }
        }
        return false;
    },
    toast: function (message, css) {
        var obj = {
            message: message,
            showDuration: 500,
            displayDuration: 2000,
            hideDuration: 500,
            css: css == undefined ? '' : css,
        };
        var $toast = $("<div class='toast'>" + obj.message + "</div>");
        if (obj.css != "") {
            $toast.addClass(obj.css);
        }
        $toast.appendTo("body");
        var centerX = $(window).width() / 2;
        var left = centerX - $toast.width() / 2;
        var bottom = $(window).height() / 10;
        $toast.css("bottom", 0 + "px");
        $toast.css("left", left + "px");
        $toast.animate({
            bottom: "+=" + bottom,
            opacity: 1
        }, {
            duration: obj.showDuration,
            complete: function () {
                setTimeout(function () {
                    $toast.animate({
                        opacity: 0
                    }, {
                        duration: obj.hideDuration,
                        complete: function () {
                            $toast.remove();
                        }
                    });
                }, obj.displayDuration);
            }
        });
    },
    toastError: function (message) {
        this.toast(message, 'error');
    },
    fixPhoneNumber: function (number) {
        if (number.substr(0, 1) == '+') {
            number = autotext.app.userExitCode + number.substr(1);
        }
        number = number.replace(/[^0-9]/g, '');
        return number;
    },
    getFirstOrDefault: function (array, match) {
        if (array == null || array.length == 0) {
            return null;
        }
        for (var i = 0; i < array.length; i++) {
            if (match(array[i])) {
                return array[i];
            }
        }
        return null;
    }
};
