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
        var checked = false;
        for (var k = 0; k < numbers.length; k++) {
            var number = numbers[k];
            if (me.isNumberInContact(number, contact)) {
                checked = true;
                break;
            }
        }
        try {
            var contactNumber = me.getContactNumber(contact);
            var name = "";
            if (contact.displayName == undefined) {
                name = contact.name.formatted;
            } else {
                name = contact.displayName;
            }
            if (contactNumber != null && contactNumber != "") {
                items.push(me.createContactItem(name, contactNumber, checked));
            }
        }
        catch (ex) {

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

autotext.services.contacts.isNumberInContact = function(number, contact) {
    var me = this;
    var phonenumber = me.getContactNumber(contact);
    return number == phonenumber;
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
    }
};
