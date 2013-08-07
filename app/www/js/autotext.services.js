if(window.autotext == undefined) {
    window.autotext = { };
}
if(autotext.services == undefined) {
    autotext.services = { };
}

autotext.services.contacts = {
    
};

autotext.services.contacts.parseContactItems = function(numbers, phoneContacts) {
    var me = this;
    var items = [];
    var customNumbers = me.getCustomNumbers(numbers, phoneContacts);
    for (var i = 0; i < customNumbers.length; i++) {
        items.push(me.createContactItem(null, customNumbers[i], true));
    }
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
            var checked = autotext.services.system.isInArray(number, numbers);
            var name = me.getContactName(contact);
            items.push(me.createContactItem(name, number, checked));
        }
    }
    return items;
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

autotext.services.contacts.isNumberInContact = function(number, contact) {
    var me = this;
    if (contact.phoneNumbers == undefined || contact.phoneNumbers.length == 0) {
        return false;
    }
    for (var i = 0; i < contact.phoneNumbers.length; i++) {
        if (contact.phoneNumbers[i].value == number) {
            return true;
        }
    }
    return false;
};

autotext.services.contacts.createContactItem = function (name, number, checked) {
    return {
        name: name,
        number: number,
        checked: checked,
        isCustom: function() {
            return this.name == undefined || this.name == null || this.name == "";
        }
    };
};

autotext.services.contacts.getCustomNumbers = function(numbers, phoneContacts) {
    var me = this;
    var customNumbers = [];
    for (var i = 0; i < numbers.length; i++) {
        var number = numbers[i];
        var found = false;
        if (number == "") {
            break;
        }
        for (var j = 0; j < phoneContacts.length; j++) {
            var contact = phoneContacts[j];
            if (me.isNumberInContact(number, contact)) {
                found = true;
                break;
            }
        }
        if (!found) {
            customNumbers.push(number);
        }
    }
    return customNumbers;
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
    }
};
