app.services.ContactService = function() {

};

app.services.ContactService.prototype.getAllContacts = function (successCallback) {
    var me = this;
    var options = {
        filter: "",
        multiple: true,
    };
    var fields = ['*'];
    navigator.contacts.find(fields, function (phoneContacts) {
        try {
            me._sort(phoneContacts);
            var items = me._parseContactItems(phoneContacts);
            successCallback(items);
        }
        catch (ex) {
            app.alert('init contacts error: ' + ex, "Error");
        }
    }, function () {
        app.ajaxAlert('login', 'Your phone book seems unavaiable at present please trying reaccessing.');
    }, options);
};

app.services.ContactService.prototype._sort = function (phoneContacts) {
    phoneContacts.sort(function (a, b) {
        if (a.name == undefined || b.name == undefined) {
            return 1;
        }
        var aName = null !== a.name.familyName ? a.name.familyName : a.name.formatted,
            bName = null !== b.name.familyName ? b.name.familyName : b.name.formatted;

        if (aName != bName) {
            aName = a.name.formatted;
            bName = b.name.formatted;
        }

        return aName > bName ? 1 : -1;
    });
    return phoneContacts;
};

app.services.ContactService.prototype._parseContactItems = function (phoneContacts) {
    var me = this;
    var items = [];
    for (var j = 0; j < phoneContacts.length; j++) {
        var contact = phoneContacts[j];
        if (contact.phoneNumbers == undefined || contact.phoneNumbers.length == 0) {
            continue;
        }
        for (var n = 0; n < contact.phoneNumbers.length; n++) {
            var number = contact.phoneNumbers[n].value;
            if (typeof number == 'undefined' || number == null || number == "") {
                continue;
            }
            var name = me._getContactName(contact);
            items.push(me._createContactItem(name, number));
        }
    }
    return items;
};

app.services.ContactService.prototype._getContactName = function (contact) {
    if (contact.name && contact.name.formatted) {
        return contact.name.formatted;
    }
    if (contact.displayName != undefined) {
        return contact.displayName;
    }
    return "";
};

app.services.ContactService.prototype._createContactItem = function (name, number) {
    return {
        id: number,
        name: name,
        number: number,
        isCustom: function () {
            return this.name == undefined || this.name == null || this.name == "";
        }
    };
};