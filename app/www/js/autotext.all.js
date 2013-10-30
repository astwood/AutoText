// last build: 20130929.1038

window.app = {
    protocol: 'https://',
    url: 'app.autotext.co/api',
    loadingTimers: [],
    unsyncedTimer: null,
    listUpdateTimers: [],
    userExitCode: null,
    fullPhoneNumber: null,
    verificationType: null,
    country: null,
    phoneNumber: null,
    editing: false,
    viewing: false,
    reminding: false,
    copying: false,
    groupEditing: false,
    unsyncEdit: false,
    draftEdit: false,
    draftId: null,
    newDraft: false,
    newData: {
        'name': '',
        'recipient': '',
        'content': '',
        'time': '',
        'reminder': '',
        'repeat_options': ''
    },
    canResetNewPage: false,
    editData: {},
    groupData: {
        'name': '',
        'contacts': []
    },
    oldEditData: {},
    justSetEditOpts: false,
    stopDraftAddEdit: false,
    editViewStatus: '',
    editType: '',
    lastPageBeforeNew: '',
    lastPageBeforeSettings: '',
    lastPageBeforeTerms: '',
    lastPageBeforeMessageCredits: '',
    repeats: false,
    draftDeleteType: 'single',
    dataId: null,
    dataScheduleId: null,
    dataSingle: null,
    stopCountryChange: true,
    ajaxAlertCallback: null,
    justSetSpam: false,
    justSetUnsynced: false,
    showingSpamFailNotification: false
};

app.services = {    
    
};

app.pages = {    
    
};

app.caches = {
    contacts: []
};

app.initialize = function() {
    var me = this;
    $.mobile.loader.prototype.options.text = 'Loading...';
    $.mobile.defaultPageTransition = 'slide';
    
    $.ajaxSetup({
        timeout: 20000
    });

    me.doBinds();

    for (pi in app.pages) {
        var page = app.pages[pi];
        if (typeof page.init != "undefined") {
            page.init();
        }
    }

    var countryService = new app.services.CountryService();
    countryService.load();

    $('body').show();
};


app.pages.account = {
    init:function() {
        $('#account').live('pagebeforeshow', function () { app.pages.account.onLoaded(); });
        $('.purchase-link').live('click', function () {
            app.lastPageBeforePurchase = $.mobile.activePage.attr('id');
            $.mobile.changePage('#purchase');
        });
    },
    onLoaded: function () {
        var service = new app.services.AccountService();
        service.getCredits(function(data) {
            $('#account-creds-balance').text(Math.floor(data.balance));
            $('#account-creds-allocated').text(Math.floor(data.allocated));
            $('#account-creds-remaining').text(Math.floor(data.remaining));
        });
    }
};
app.pages.addContactFromNumber = {    
    init:function() {
        $('#addcontactfromnumber .save').live('click', function () {
            var phoneNumber = $('#addcontactfromnumber-number').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = app.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            $('#addcontactfromnumber-number').val(phoneNumber);

            var data = {
                'name': $('#addcontactfromnumber-name').val(),
                'phone_number': phoneNumber,
                'part': 'contact',
                'custom': true
            };
            var service = new app.services.GroupService();
            service.validate($.param(data), "addcontactfromnumber", null, function() {
                data['phone_number_user'] = data['phone_number'];
                app.groupData['contacts'].push(data);
                app.pages.newGroup.update();
                $('#addcontactfromnumber-name, #addcontactfromnumber-number').val('');
                $.mobile.changePage('#newgroup', { reverse: false });
            }, function() {
                app.ajaxAlert('addcontactfromnumber', 'Please ensure that you have entered your contact\'s name and phone number correctly then try again.');
            });
        });
        
        $('#addcontactfromnumber .back').live('click', function () {
            $('#addcontactfromnumber-name').val("");
            $('#addcontactfromnumber-number').val("");
        });
    }
};

app.pages.addNumber = {
    init: function () {
        var me = this;
        $('#addNumber .back').live('click', function () {
            var number = $('#addNumber-number').val();
            if (number == '') {
                $.mobile.changePage('#newMessageRecipients', { reverse: true });
                return;
            }
            if (me.exist(number)) {
                app.system.toastError('The number was already added.');
                return;
            }
            me._validate(number, function () {
                $('#addNumber-number').val('');
                var numbers = app.pages.messageRecipients.numbers;
                numbers.push({
                    name: '',
                    number: number
                });
                app.pages.messageRecipients.onLoaded(numbers);
                $.mobile.changePage('#newMessageRecipients', { reverse: true });
            });
        });
    },
    _validate: function (number, success) {
        var data = {
            'name': 'temp name',
            'phone_number': number,
            'part': 'contact',
            'custom': true
        };
        var service = new app.services.GroupService();
        service.validate(data, 'addNumber', 'Please ensure that you have entered your contact\'s name and phone number correctly then try again.', function() {
            success();
        });
    },
    exist: function (number) {
        return app.system.getFirstOrDefault(app.pages.messageRecipients.numbers, function (item) {
            return item.number == number;
        }) != null;
    }
};
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
        this.filterContacts();
    },
    filterContacts: function () {
        var key = $('#txtFilterContacts').val().toLowerCase();
        if (key == '') {
            $('#contact-list>li').removeClass('hidden');
        } else {
            $('#contact-list>li').each(function() {
                var $li = $(this);
                if ($li.text().toLowerCase().indexOf(key) > -1) {
                    $li.removeClass('hidden');
                } else {
                    $li.addClass('hidden');
                }
            });
        }
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
app.pages.forgotten = {    
    init:function() {
        $('#forgotten-submit-button').live('click', function () {
            app.pages.forgotten.forgottenSubmit();
        });
    },
    forgottenSubmit: function () {
        var country = $('#forgotten-country').val();
        var phoneNumber = $('#forgotten-phone_number').val();
        if (phoneNumber.substr(0, 1) == '+') {
            phoneNumber = app.userExitCode + phoneNumber.substr(1);
        }
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        $('#forgotten-phone_number').val(phoneNumber);
        var service = new app.services.AccountService();
        service.forgotten(country, phoneNumber, function () {
            app.country = country;
            app.phoneNumber = phoneNumber;
            app.verificationType = 'forgotten';
            $.mobile.changePage('#verification');
        }, function() {
            app.ajaxAlert('forgotten', 'We couldn\'t find your phone number - please review.');
        });
    }
};
/**
* Update page title and back button text. Also has code for message schedule options and new/edit message pages
*/
app.pages.global = {
    init:function() {
        $('[data-role="page"]').live('pagebeforeshow', function () { app.pages.global.onLoaded(); });
        $('[data-role="page"]').live('pageshow', function () { app.pages.global.onPageShow(); });
        $('[data-role="page"]').live('pagebeforehide', function () { app.pages.global.onPageBeforeHide(); });
    },
    onPageShow:function() {
        $('[data-role="page"] .ui-content').addClass('vHidden');
        $('#' + $.mobile.activePage.attr('id') + ' .vHidden').removeClass('vHidden');
        $(' h1 .page-title').css({ "visibility": "visible" });
        $('.ui-header .ui-title').css({ "visibility": "visible" });
    },
    onPageBeforeHide:function() {
        $('h1 .page-title').css({ "visibility": "hidden" });
        $('.ui-header .ui-title').css({ "visibility": "hidden" });
    },
    onLoaded: function () {
        var obj = this;
        $('body').attr('id', $.mobile.activePage.attr('id') + '-body');
        var backTxt = 'Back';
        var headerTxt = '';
        $('h1').css('overflow', 'hidden');
        switch ($.mobile.activePage.attr('id')) {
            case 'schedule-options':
                backTxt = app.editData['content'];
                if (typeof app.editData['name'] != 'undefined' && app.editData['name'].length > 0) backTxt = app.editData['name'] + ' - ' + backTxt;
                if (app.reminding) backTxt = 'RemindMe';

                headerTxt = '<span class="page-title">Schedule SMS</span><span class="progressbar-status">Scheduling...</span><span class="progressbar"></span>';

                if (app.editing) {
                    $('.save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
                }

                if (app.viewing) {
                    $('#new-name-link, #new-repeats-link, #new-date-link').addClass('link-disabled');
                    $('.save').hide();
                } else {
                    $('#new-name-link, #new-repeats-link, #new-date-link').removeClass('link-disabled');
                    $('.save').show();
                }
                break;

            case 'scheduled':
                headerTxt = 'Scheduled';
                break;

            case 'history':
                headerTxt = 'History';
                break;

            case 'groups':
                headerTxt = 'Groups';
                break;

            case 'register':
                backTxt = 'Login';
                headerTxt = 'Register';
                break;

            case 'forgotten':
                backTxt = 'Login';
                headerTxt = 'Reset Password';
                break;

            case 'newgroup':
                backTxt = 'Groups';
                headerTxt = 'Add Group';
                $('.save').show();
                if (app.groupEditing) headerTxt = 'Edit Group';

                break;

            case 'message-name':
                backTxt = 'Schedule SMS';
                headerTxt = 'Message Name';
                break;

            case 'message-date':
                backTxt = 'Schedule SMS';
                headerTxt = 'Message Date';
                break;

            case 'message-repeats':
                backTxt = 'Schedule SMS';
                headerTxt = 'Repeats';
                break;

            case 'account':
                backTxt = 'Settings';
                headerTxt = 'Settings';
                break;

            case 'purchase':
                backTxt = 'Settings';
                if (app.lastPageBeforePurchase == 'status-dialog') backTxt = 'Message Status';
                headerTxt = 'Purchase';
                break;

            case 'help':
                backTxt = 'Settings';
                headerTxt = 'Help';
                break;

            case 'help-1':
                backTxt = 'Help';
                headerTxt = 'Welcome';
                break;

            case 'help-2':
                backTxt = 'Welcome';
                headerTxt = 'Scheduled';
                break;

            case 'help-3':
                backTxt = 'Scheduled';
                headerTxt = 'History';
                break;

            case 'help-4':
                backTxt = 'History';
                headerTxt = 'New Message';
                break;

            case 'help-5':
                backTxt = 'New Message';
                headerTxt = 'Contact Groups';
                break;

            case 'help-6':
                backTxt = 'Contact Groups';
                headerTxt = 'RemindMe';
                break;

            case 'help-7':
                backTxt = 'RemindMe';
                headerTxt = 'Close';
                break;

            case 'terms':
                backTxt = 'Help';
                if (app.lastPageBeforeTerms == 'verification') {
                    backTxt = 'Input Verification Code';
                } else if (app.lastPageBeforeTerms == 'status-dialog') {
                    backTxt = 'Message Status';
                }
                headerTxt = 'Terms of Use';
                break;

            case 'verification':
                backTxt = 'Register';
                if (app.verificationType != 'register') backTxt = 'Reset Your Password';
                headerTxt = 'Verification';
                break;

            case 'status-dialog':
                backTxt = app.editData['content'];
                if (typeof app.editData['name'] != 'undefined' && app.editData['name'].length > 0) backTxt = app.editData['name'] + ' - ' + backTxt;
                if (app.reminding) backTxt = 'RemindMe';
                headerTxt = 'Message Status';
                break;

            case 'settings':
                backTxt = 'Scheduled';
                if (app.lastPageBeforeSettings == 'history') backTxt = 'History';
                headerTxt = 'Settings';
                break;

            case 'new':
                backTxt = 'Scheduled';
                if (app.lastPageBeforeNew == 'history') backTxt = 'History';
                if (app.lastPageBeforeNew == 'groups') backTxt = 'Groups';


                if (app.reminding) {
                    $('#addTo-from-contacts, #addTo-from-contacts-wrapper').hide();
                } else {
                    $('#addTo-from-contacts, #addTo-from-contacts-wrapper').show();
                };


                app.canResetNewPage = true;
                var data = $('#new .edit-id').val().split('&');
                if (!app.editing && !app.viewing) {
                    $('#new-status, #new-schedule').hide();
                    $('#new .edit-id').val('');

                    if (app.reminding) {
                        $('#new-status, #new-schedule').hide();
                        $('#new-recipient').parents('.fieldcontain').hide();
                        $('#new .ui-content').addClass('no-to');
                        $('#new-content').removeClass('bigger-max-height biggest-no-to-max-height');
                        $('#new-content').addClass('biggest-max-height');
                    }
                } else if (!app.draftEdit && (app.editing || app.viewing) && $('#new-recipient').val().length < 1) {
                    $.ajax({
                        url: app.protocol + app.url + '/sms/view/' + data[0] + '/' + data[1] + '?u=' + app.fullPhoneNumber + '&p=' + app.password,
                        type: 'GET',
                        beforeSend: function () {
                            app.loadingTimers.push(setTimeout(function () {
                                $.mobile.loading('show');
                            }, 1000));
                        },
                        complete: function () {
                            app.clearTimeouts();
                            $.mobile.loading('hide');
                        },
                        success: function (resp) {
                            resp = JSON.parse(resp);
                            if (resp.status == 'OK') {
                                obj._updateSmsFields(resp.data);
                            } else {
                                app.ajaxAlert('new');
                            }
                        },
                        error: function () {
                            app.ajaxAlert('new');
                        }
                    });
                } else if (app.draftEdit && $('#new-recipient').val().length < 1) {
                    var drafts = app.updateDrafts('list');
                    data = {};
                    $(drafts).each(function (draft) {
                        if (drafts[draft].Sms['id'] == app.draftId) {
                            data = drafts[draft];
                            return false;
                        }
                        return undefined;
                    });
                    obj._updateSmsFields(data);
                }

                if (!app.editing && !app.viewing && !app.copying && !app.reminding) {
                    $('#new .ui-content').removeClass('no-to');
                    $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height bigger-max-height');
                }
                if (!app.reminding) {
                    $('#new-to-field').show();
                } else {
                    $('#new-recipient').val(app.phoneNumber);
                }

                var saveEl = $('#schedule-options [data-id="header-nav"] .save .ui-btn-text');
                if (saveEl.length < 1) saveEl = $('#schedule-options [data-id="header-nav"] .save');
                if (app.viewing) {
                    saveEl.text('Cancel');
                    $('#new-submit-button').addClass('full-width');
                    $('#new-submit-button .ui-btn-text').text('Re-schedule');
                    $('#new-submit-button').css('width', '97%');
                    $('#new-recipient, #new-content, #new-date, #new-name').addClass('ui-disabled');
                    $('#message-repeats-none').parents('fieldset').addClass('ui-disabled');
                } else {
                    saveEl.text('Save');
                    $('#new-submit-button').removeClass('full-width');
                    $('#new-submit-button .ui-btn-text').text('Schedule');
                    $('#new-submit-button').css('width', 'auto');
                    $('#new-recipient, #new-content, #new-date, #new-name').removeClass('ui-disabled');
                    $('#message-repeats-none').parents('fieldset').removeClass('ui-disabled');
                }

                if (!app.reminding && (app.editing || app.viewing)) {
                    $('#new-to-field').addClass('grey-bottom');
                    $('#new-content').removeClass('bigger-max-height biggest-max-height biggest-no-to-max-height');
                } else if (!app.reminding) {
                    $('#new-to-field').removeClass('grey-bottom');
                    $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height');
                    $('#new-content').addClass('bigger-max-height');
                }

                if (app.viewing && !app.editing) {
                    $('#new-content-bubble').show();
                    $('#new-content').hide();
                    $('#new-submit-button').css('min-width', '12em');
                } else {
                    $('#new-content').show();
                    $('#new-content-bubble').hide();
                    $('#new-submit-button').css('min-width', '0');
                }

                if (app.editing) {
                    $('#new-content').css('width', '99.7%');
                    $('#new-submit-button').hide();
                } else {
                    $('#new-content').css('width', '12.9em');
                    $('#new-submit-button').show();
                }

                if (app.viewing) {
                    $('#message-repeats-wd').slider();
                    $('#message-repeats-wd').slider('disable');
                } else {
                    $('#message-repeats-wd').next().removeClass('ui-disabled');
                }

                if (app.reminding) {
                    $('#new-name').val('Remember To');
                    $('h1').css('overflow', 'visible');
                    $('#new-name').addClass('ui-disabled');
                } else {
                    $('h1').css('overflow', 'hidden');
                    $('#new-name').removeClass('ui-disabled');
                }

                if (app.editing) {
                    $('.save').show();
                } else {
                    $('.save').removeClass('cancel-state').hide();
                }

                if (app.viewing) {
                    $('#new-submit-button').removeClass('ui-disabled');
                } else {
                    $('#new-submit-button').addClass('ui-disabled');
                }

                if (app.viewing || app.editing) {
                    $('#new-status, #new-schedule').show();
                }

                if (!app.viewing) {
                    var anyEmpty = false;
                    $('#new-recipient, #new-content').each(function () {
                        if ($(this).val().length < 1) anyEmpty = true;
                    });

                    if (!anyEmpty) {
                        $('#new-submit-button').removeClass('ui-disabled');
                    } else {
                        $('#new-submit-button').addClass('ui-disabled');
                    }
                }

                if (app.editing && app.draftEdit) {
                    $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
                }

                if (app.copying) {
                    $('#new-date').val('');
                    $('#new-date-text').text(moment().format('ddd, D MMM YYYY, hh:mm a'));
                    $('#new-repeats-text').text('Never');
                    $('#message-repeats input[name="message-repeats"]').removeAttr('checked');
                    $('#message-repeats-none').attr('checked', 'checked');
                    $('#message-repeats-wd option:selected').removeAttr('selected');
                    $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
                    $('#new-submit-button').css('min-width', '0');
                    $('#new-content-bubble').hide();
                    try {
                        $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
                    } catch (e) { }
                    try {
                        $('#message-repeats-wd').slider('enable');
                    } catch (e) { }
                    app.copying = false;
                }

                app.stopDraftAddEdit = true;

                if (!app.editing && !app.viewing && !app.reminding) {
                    headerTxt = 'New Message';
                } else if (app.reminding) {
                    headerTxt = '<span class="page-title"><img src="img/icon_reminder.png" /></span>';
                } else {
                    var name = app.editData.content;
                    if (app.editData.name != undefined && app.editData.name.length > 0) name = app.editData.name + ' - ' + name;
                    headerTxt = name;
                }
                break;

            case 'messagecredits':
                backTxt = 'Help';
                if (app.lastPageBeforeMessageCredits == 'status-dialog') {
                    backTxt = 'Message Status';
                } else if (app.lastPageBeforeMessageCredits == 'purchase') {
                    backTxt = 'Purchase';
                }
                headerTxt = 'Message Credits';
                break;

            case 'addcontactfromnumber':
                backTxt = 'Back';
                headerTxt = 'Add a Number';
                break;
            case 'addcontactfromcontact':
                backTxt = 'Back';
                headerTxt = 'Add a Contact';
                break;
            case 'addNumber':
                backTxt = 'OK';
                headerTxt = 'Add a Number';
                break;
            case 'newMessageRecipients':
                backTxt = 'Back';
                headerTxt = 'Recipients';
                break;
        }

        $('.back .ui-btn-text').text(backTxt);
        $('[data-role="header"] .ui-title').html(headerTxt);
    },
    _updateSmsFields: function (data) {
        app.stopDraftAddEdit = true;
        app.editData = data.Sms;
        $.extend(app.oldEditData, app.editData);
        app.editViewStatus = data.Schedule.status;
        if (app.editData.reminder == false) {
            app.editData.reminder = 0;
        } else {
            app.editData.reminder = 1;
        }
        app.editData.time = app.editData.time_unix;
        app.editData.schedule_time = data.Schedule.send_time;
        if (data.Sms.reminder) {
            app.reminding = true;
            $('#new-status, #new-schedule').hide();
            $('#new-recipient').parents('.fieldcontain').hide();
            $('#new .ui-content').addClass('no-to');
            $('#new-content').removeClass('biggest-max-height bigger-max-height');
            $('#new-content').addClass('biggest-no-to-max-height');
        } else {
            $('#new .ui-content').removeClass('no-to');
            $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height bigger-max-height');
        }
        var statusColour = data.Schedule.status_colour;
        var statusText = data.Schedule.status_text;
        var statusIconColour = '';
        if (!app.viewing) {
            statusIconColour = 'black';
            switch (data.Schedule.status_colour) {
                case '92d050': // green
                    statusIconColour = 'green';
                    break;
                case 'f0b05f': // amber
                    statusIconColour = 'amber';
                    break;
                case 'c80408': // red
                    statusIconColour = 'red';
                    break;
            }
        } else {
            statusColour = 'b60c76';
            statusIconColour = 'cross';
            switch (data.Schedule.status) {
                case 'delivered':
                case 'pending': // tick
                    statusIconColour = 'tick';
                    break;
            }
        }
        statusText += ' <img src="img/icon_' + statusIconColour + '.png" class="status-icon" />';
        $('#new-recipient').val(data.Sms.recipient_user);
        $('#new-content').val(data.Sms.content);
        $('#new-content-bubble').html(data.Sms.content.replace(/\n/g, '<br />'));
        $('#new-status-text').html(statusText)
            .attr('style', 'color: #' + statusColour + ' !important');
        $('#new-scheduled').text(moment(data.Schedule.send_time * 1000).format('ddd, D MMM YYYY, hh:mm a'));
        app.stopDraftAddEdit = true;
        $('#new-name').val(data.Sms.name);
        $('#new-name-text').text(data.Sms.name);
        $('#status-dialog-cost').text(data.Sms.cost);
        if (typeof data.Sms.cost != 'undefined') {
            $('#status-dialog-cost-p').show();
        } else {
            $('#status-dialog-cost-p').hide();
        }

        if (!app.draftEdit && !app.viewing) {
            $('#delete-to-draft').show();
        } else {
            $('#delete-to-draft').hide();
        }

        var scrollEl = $('#new-date');
        if (app.viewing || scrollEl.hasClass('scrollified')) {
            scrollEl.scroller('destroy').removeClass('scrollified');
        }
        if (!app.viewing) {
            app.stopDraftAddEdit = true;
            var scrollerDate = moment(new Date(data.Schedule.send_time * 1000).toUTCString()).format('MM/DD/YYYY hh:mm A');
            scrollEl.val(scrollerDate)
                .scroller({
                    preset: 'calendar',
                    theme: 'ios',
                    mode: 'scroller',
                    display: 'inline',
                    lang: 'en'
                }).addClass('scrollified').trigger('change');
        }
        $('#new-date-text').text(moment(new Date(data.Schedule.send_time * 1000).toUTCString()).format('ddd, D MMM YYYY, hh:mm a'));

        var repeats = false;
        var repeatsTxt = 'Never';
        if (data.Sms.repeat_options.length > 0) {
            var tmp = JSON.parse(data.Sms.repeat_options);
            if (typeof tmp == 'object') {
                $('#message-repeats input[name="message-repeats"]').removeAttr('checked');

                if (tmp.D == '1') {
                    repeats = true;
                    repeatsTxt = 'Daily';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-d').attr('checked', 'checked');
                } else if (tmp.W == '1') {
                    repeats = true;
                    repeatsTxt = 'Weekly';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-w').attr('checked', 'checked');
                } else if (tmp.M == '1') {
                    repeats = true;
                    repeatsTxt = 'Monthly';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-m').attr('checked', 'checked');
                } else if (tmp.Y == '1') {
                    repeats = true;
                    repeatsTxt = 'Annually';
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-y').attr('checked', 'checked');
                } else {
                    app.stopDraftAddEdit = true;
                    $('#message-repeats-none').attr('checked', 'checked');
                }

                if (repeats && tmp.WD == '1' && tmp.W != '1') {
                    repeatsTxt += ', week days only';
                }

                app.stopDraftAddEdit = true;
                $('#message-repeats-wd option:selected').removeAttr('selected');
                $('#message-repeats-wd option[value="' + (tmp.WD == '1' ? 'on' : 'off') + '"]').attr('selected', 'selected');
            }
        }
        $('#new-repeats-text, #status-dialog-repeats-text').text(repeatsTxt);

        if (repeats && data.Sms.time_unix != data.Schedule.send_time) {
            $('#status-dialog-repeats-startdate').text(moment(new Date(data.Sms.time_unix * 1000).toUTCString()).format('DD/MM/YYYY hh:mm A'));

            if (typeof data.Sms.end_date != 'undefined' && data.Sms.end_date != '0') {
                $('#status-dialog-repeats-enddate').text(moment(new Date(data.Sms.end_date * 1000).toUTCString()).format('DD/MM/YYYY hh:mm A'));
                $('#status-dialog-repeats-end').show();
            } else {
                $('#status-dialog-repeats-end').hide();
            }
            if (typeof data.Sms.time_unix != 'undefined') $('#status-dialog-repeats-start').show();
        } else {
            $('#status-dialog-repeats-start').hide();
        }

        $('#message-repeats input[name="message-repeats"]').checkboxradio();
        $('#message-repeats-wd').slider();
        try {
            $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
        } catch (e) { }
        try {
            $('#message-repeats-wd').slider('refresh');
        } catch (e) { }

        if (app.reminding) {
            if (app.viewing || app.editing) {
                $('#new-status, #new-schedule').show();
            } else {
                $('#new-status, #new-schedule').hide();
            }
            $('h1').css('overflow', 'visible');
            $('#new-name').addClass('ui-disabled');
        } else {
            $('h1').css('overflow', 'hidden');
            $('#new-name').removeClass('ui-disabled');
        }

        var headerTxt = '';
        if (!app.editing && !app.viewing && !app.reminding) {
            headerTxt = 'New Message';
        } else if (app.reminding) {
            headerTxt = '<span class="page-title"><img src="img/icon_reminder.png" /></span>';
        } else {
            var name = app.editData.content;
            if (app.editData.name != undefined && app.editData.name.length > 0) name = app.editData.name + ' - ' + name;
            headerTxt = name;
        }
        $('[data-role="header"] .ui-title').html(headerTxt);
        app.justSetEditOpts = true;
    },
};
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
app.pages.history = {    
    init:function() {
        $('#history').live('pagebeforeshow', function () { app.pages.history.onLoaded(); });
        $('#history').live('pageshow', function () { app.pages.history.onShow(); });
        $('#history-message-list a.view-message').live('click', function (e) {
            e.preventDefault();
            app.viewing = true;
            app.newPageResetFields();
            var smsId = $(this).parents('li').attr('data-id');
            var scheduleId = $(this).parents('li').attr('data-schedule-id');
            $('#new .edit-id').val(smsId + '&' + scheduleId);
            app.lastPageBeforeNew = $.mobile.activePage.attr('id');
            $.mobile.changePage('#new');
        });
    },
    onLoaded: function () {
        app.viewing = false;
        app.repeats = false;
        app.editing = false;
        app.reminding = false;
        app.draftEdit = false;
        app.unsyncEdit = false;
        app.lastPageBeforeNew = app.lastPageBeforeSettings = 'history';

        var service = new app.services.MessageService();
        service.getSent(function(allData) {
            $('#history-message-list li').not('#history-message-template').remove();
            if (allData['schedules'].length > 0) {
                $.each(allData['schedules'], function (row) {
                    var data = allData['schedules'][row];
                    var newRow = $('#history-message-template').clone();
                    var sendTime = new Date(data['Schedule'].send_time * 1000);
                    var content = data['Sms'].content;
                    if (data['Sms'].name.length > 0) content = data['Sms'].name + ' - ' + content;
                    newRow.attr('data-id', data['Sms'].id);
                    newRow.attr('data-schedule-id', data['Schedule'].id);
                    newRow.find('.message-recipients').text(data['Sms'].recipient_user);
                    newRow.find('.message-content').text(content);
                    newRow.find('.message-status').text(data['Schedule'].status_text);
                    newRow.find('.message-date').text(app.formatDate(sendTime));
                    newRow.find('.message-time').text(app.formatTime(sendTime));
                    newRow.find('.ui-li-aside').addClass('colour-' + data['Schedule'].status_colour);
                    switch (data['Schedule'].status) {
                        case 'delivered':
                        case 'pending': // tick
                            newRow.find('.status-icon').attr('src', 'img/icon_tick.png');
                            break;
                        default: // cross
                            newRow.find('.status-icon').attr('src', 'img/icon_cross.png');
                            break;
                    }
                    newRow.removeAttr('id');
                    newRow.show();
                    $('#history-message-list').append(newRow);

                    app.formatNumbersWithContactNames(data['Sms'].recipient_user, $('#history-message-list li[data-id="' + data['Sms'].id + '"] .message-recipients'));
                });
            }
        });

        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .history-link').addClass('ui-btn-active');
    },
    onShow:function() {
        $.each(app.listUpdateTimers, function (timeout) {
            clearTimeout(app.listUpdateTimers[timeout]);
        });

        app.refreshList('history');
    }
};
app.pages.login = {    
    init:function() {
        $('#login').live('pagebeforeshow', function () { app.pages.login.onLoaded(); });
        $('#login-submit-button').live('click', function () {
            var country = $('#login-country').val();
            var phoneNumber = $('#login-phone_number').val();
            var password = $('#login-password').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = app.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            $('#login-phone_number').val(phoneNumber);
            var accountService = new app.services.AccountService();
            accountService.login(country, phoneNumber, password, function(resp) {
                app.fullPhoneNumber = resp.data['phone_number'];
                app.userExitCode = resp.data['exit_code'];
                app.phoneNumber = phoneNumber;
                app.country = country;
                app.password = password;
                $.cookie('logins', JSON.stringify({
                    'country': app.country,
                    'phone_number': app.phoneNumber,
                    'password': app.password
                }), { expires: 7300 });
                $.mobile.changePage('#scheduled');
                $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
            }, function() {
                app.ajaxAlert('login', 'Your login details are wrong - please review.');
            });
        });
    },
    onLoaded: function () {
        app.stopCountryChange = false;
        $("#login-phone_number").val("");
        $("#login-password").val("");
    }
};
app.pages.messageCredits = {
    init:function() {
        $('#messagecredits').live('pagebeforeshow', function () { app.pages.messageCredits.onLoaded(); });
    },
    onLoaded: function () {
        
        $('#messagecredits .ui-input-search .ui-input-text').val('');
        var service = new app.services.CreditService();
        service.getInternationalCredits(function(data) {
            $('#messagecredits-list li').remove();
            $.each(data, function (row) {
                var currData = data[row];
                var newRow = $('<li></li>');
                newRow.html('<div class="country-name floatL">' + currData.name + '</div><div class="account-creds ui-li-desc">' + currData.credits + '</div>');
                $('#messagecredits-list').append(newRow);

                if (row == app.country) {
                    $('#messagecredits-country_name').text(currData.name);
                    $('#messagecredits-credits').text(currData.credits);
                }
            });
            $('#messagecredits-list').listview('refresh');
        });
    }
};
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
app.pages.messageRecipients = {
    _initialized: false,
    numbers: [],
    init: function () {
        var me = this;
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        $('#newMessageRecipients .back').live('click', function () {
            me.onBack();
        });
        $('#btn-add-contact-to-recipients').live('click', function () {
            app.pages.contactList.fromGroup = false;
            app.pages.contactList.onLoaded(me.getNumericNumbers());
            $.mobile.changePage('#addcontactfromcontact');
        });
        $('#btn-add-custom-to-recipients').live('click', function () {
            $.mobile.changePage('#addNumber');
        });
        $('#selectedNumbers li').live('click', function () {
            var $li = $(this);
            if ($('.aSwipeBtn').css('overflow') == 'visible' && $('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                    $li.find('.ui-li-heading').css('max-width', '50%');
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            }
        });
    },
    onLoaded: function (numbers) {
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
        $.each(me.numbers, function (index, number) {
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
        } catch (ex) {

        }
        $('#selectedNumbers li').swipeDelete({
            click: function () {
                me.onDelete(this);
            }
        });
    },
    onDelete: function (sender) {
        var me = this;
        var $li = $(sender).closest('li');
        $li.slideUp(400, function () {
            var index = $li.prevAll().length - 1;
            me.numbers.splice(index, 1);
            $li.remove();
            $('#totalNumbers').html(me.numbers.length);
        });
    },
    onBack: function () {
        var me = this;
        $("#new-recipient").val(me.getNumericNumbers());
        if (app.newDraft == false || app.draftId == null || me.numbers.length > 0) {
            app.stopDraftAddEdit = false;
            me.saveNewToDraft();
        }
        $.mobile.changePage('#new', { reverse: true });
    },
    getNumericNumbers: function () {
        var nums = [];
        for (var i = 0; i < this.numbers.length; i++) {
            nums.push(this.numbers[i].number);
        }
        return nums;
    },
    fixNumberNames: function () {
        var objs = [];
        for (var i = 0; i < this.numbers.length; i++) {
            var num = this.numbers[i];
            var contact = app.system.getFirstOrDefault(app.caches.contacts, function (x) {
                return x.number == num;
            });
            objs.push({
                name: contact == null ? '' : contact.name,
                number: num
            });
        }
        this.numbers = objs;
    },
    saveNewToDraft: function () {
        var anyEmpty = false;
        $('#new-recipient, #new-content').each(function () {
            if ($.trim($(this).val()).length < 1) anyEmpty = true;
        });

        if (!anyEmpty) {
            $('#new-submit-button').removeClass('ui-disabled');
        } else {
            $('#new-submit-button').addClass('ui-disabled');
        }

        if (app.editing && $('#new .save').text() != 'Save' && !app.stopDraftAddEdit) {
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
        }

        if (!app.stopDraftAddEdit && (app.draftId == null || app.newDraft)) {
            app.draftId = app.generateUUID();
            app.newDraft = false;
        }
        if (!app.stopDraftAddEdit) {
            app.updateDrafts('view', app.draftId);
            app.updateDrafts('edit', app.draftId);
        } else {
            app.stopDraftAddEdit = false;
        }
    }
};
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
app.pages.newMessage = {    
    init:function() {
        var obj = this;
        $('#new').live('pageshow', function () {
            app.stopDraftAddEdit = false;
            $(this).addClass('ui-page-active');
        });
        $('#new-content').live('keyup', function () {
            app.pages.messageRecipients.saveNewToDraft();
        });
        $('#new .save').live('click', function () {
            var data = {
                'recipient': $('#new-recipient').val(),
                'content': $('#new-content').val(),
                'reminder': app.reminding ? '1' : '0',
                'part': 'recipient_content'
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);
            obj.saveNew();
        });
        $('#addTo-from-contacts').live('click', function () {
            if (app.viewing) {
                $('#btn-add-contact-to-recipients, #btn-add-custom-to-recipients').addClass('ui-disabled');
            } else {
                $('#btn-add-contact-to-recipients, #btn-add-custom-to-recipients').removeClass('ui-disabled');;
            }
        });
        /**
     * Bind new message submit button
     */
        $('#new-submit-button').live('click', function () {
            obj._submit();
        });
        
        $('#new #addTo-from-contacts').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                app.pages.messageRecipients.onLoaded($('#new #new-recipient').val().split(','));
                $.mobile.changePage('#newMessageRecipients');
            }
        });
        /**
     * Bind schedule options link
     */
        $('#edit-schedule-options-link').live('click', function () {
            var data = {
                'recipient': $('#new-recipient').val(),
                'content': $('#new-content').val(),
                'reminder': app.reminding ? '1' : '0'
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);
            $.mobile.changePage('#schedule-options');
        });
    },
    _submit:function() {
        if (!app.viewing) {
            var phoneNumbers = $('#new-recipient').val();
            if (phoneNumbers.length > 0) {
                var tmp = [];
                var dataSplit = phoneNumbers.split(',');
                $.each(dataSplit, function (i) {
                    var phoneNumber = dataSplit[i];
                    if (phoneNumber.substr(0, 1) == '+') {
                        phoneNumber = app.userExitCode + phoneNumber.substr(1);
                    }
                    tmp.push(phoneNumber.replace(/[^0-9]/g, ''));
                });
                phoneNumbers = tmp.join(',');
                $('#new-recipient').val(phoneNumbers);
            }

            var data = {
                'recipient': phoneNumbers,
                'content': $('#new-content').val(),
                'reminder': app.reminding ? '1' : '0',
                'part': 'recipient_content'
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);

            if (!app.unsyncEdit) {
                var service = new app.services.MessageService();
                service.validate("new", $.param(data), function () {
                    $.mobile.changePage('#schedule-options');
                }, function () {
                    var errTxt = 'Please ensure that you have entered your recipient(s) and message correctly then try again.';
                    if (app.reminding) {
                        errTxt = 'Please ensure that you have entered your message correctly then try again.';
                    }
                    app.ajaxAlert('new', errTxt);
                }, function () {
                    app.saveAsUnsynced();
                    $.mobile.changePage('#schedule-options');
                });
            } else {
                $.mobile.changePage('#schedule-options');
            }
        } else {
            app.viewing = false;
            app.copying = true;
            $.mobile.changePage('#new', {
                allowSamePageTransition: true
            });
            $('#new-submit-button').removeClass('ui-disabled');
        }
    },
    /**
     * Show edit repeating message confirmation if necessary and then call newActualSave function
     */
    saveNew: function () {
        app.editType = 'single';
        app.pages.newMessage.newActualSave();
    },
    newActualSave: function () {
        app.loadingTimers.push(setTimeout(function () {
            app.doProgressBar();
        }, 1000));

        var tmp = $('#new .edit-id').val().split('&');

        if (app.editType == 'single') {
            app.editData.oldSchedule = tmp[1];
            if (app.editData.repeatOptionsHasChanged != true) {
                app.editData.repeat_options = JSON.stringify({
                    'D': 0,
                    'W': 0,
                    'M': 0,
                    'Y': 0,
                    'WD': 0
                });
            }
            delete app.editData.id;
        }

        if (app.draftEdit) {
            delete app.editData['id'];
            delete app.editData['is_draft'];
            delete app.editData['recipient_user'];
            delete app.editData['part'];
        }

        if (app.editing && app.editData['time'] == undefined) {
            app.editData['time'] = new Date($('#new-date').val()).getTime() / 1000;
        }

        if (app.draftEdit) {
            var draftData = app.updateDrafts('view', app.draftId);
            var realId = draftData.Sms['real_id'];
            if (realId != undefined && realId.length > 0) {
                tmp = realId.split('&');
            }
        }

        var data = app.editing ? app.editData : app.newData;
        if (data.recipient.length > 0) {
            var tmpRecipients = [];
            var dataSplit = data.recipient.split(',');
            $.each(dataSplit, function (i) {
                var phoneNumber = dataSplit[i];
                if (phoneNumber.substr(0, 1) == '+') {
                    phoneNumber = app.userExitCode + phoneNumber.substr(1);
                }
                tmpRecipients.push(phoneNumber.replace(/[^0-9]/g, ''));
            });
            data.recipient = tmpRecipients.join(',');
            $('#new-recipient').val(data.recipient);
        }

        if (!app.unsyncEdit) {
            if (app.editing && app.editData.schedule_time != undefined) {
                app.editData.time = app.editData.schedule_time;
            }
            var service = new app.services.MessageService();
            service.editOrSchedule(tmp[0], $.param(app.editing ? app.editData : app.newData), function(resp) {
                app.justSetSpam = (resp.data == '1');

                if (app.draftEdit && app.draftId.length > 0) {
                    app.updateDrafts('delete', app.draftId);
                }
                $('#new h1').css('overflow', 'hidden');
                $.mobile.changePage('#scheduled');
            }, function() {
                app.clearTimeouts();
                try {
                    $('#' + $.mobile.activePage.attr('id') + ' .progressbar').progressbar({
                        value: parseInt($('#' + $.mobile.activePage.attr('id') + ' .progressbar').attr('max-value'))
                    });
                } catch(ex) {
                    console.log('new message progressbar error: ' + ex);
                }
                $('#new h1 .progressbar-status, #new h1 .progressbar, #schedule-options h1 .progressbar-status, #schedule-options h1 .progressbar').remove();
                $('#new h1 .page-title, #schedule-options h1 .page-title').show();
                $('#new h1, #schedule-options h1').append('<span class="progressbar-status">Scheduling...</span><span class="progressbar"></span>');
                try {
                    TolitoProgressBar('#new h1 .progressbar, #schedule-options h1 .progressbar')
                    .isMini(true)
                    .showCounter(false)
                    .setInterval(20)
                    .setMax(125)
                    .setOuterTheme('b')
                    .setInnerTheme('c')
                    .build()
                    .init();
                }
                catch (exp) {
                    console.log('progress bar 1782 error: ' + exp);
                }
                $.mobile.loading('hide');
            });

        } else {
            $.mobile.changePage('#scheduled');
        }
    }
};
app.pages.purchase = {    
    init:function() {
        var obj = this;
        $('#purchase').live('pagebeforeshow', function () { app.pages.purchase.onLoaded(); });
        $('.product-btn').live('click', function () {
            var id = $(this).attr('id').replace('product-btn-', '');
            var credits = $(this).attr('data-value') * 1;
            logger.log(id + ':' + credits);
            try {
                purchaseManager.requestProductData(id, function (result) {
                    purchaseManager.makePurchase(result.id, 1);
                }, function (errr) {
                    alert("purchase callback error: " + errr);
                });
            } catch (expurchange) {
                alert("purchase error: " + expurchange);
            }
        });
        $(document).bind('purchaseManagerLoaded', function () {
            obj._initPurchaseManager();
        });
    },
    onLoaded: function () {
        var service = new app.services.BillingService();
        service.getProducts(function(data) {
            $('#purchase-product-list').html('');
            $.each(data, function(i) {
                var value = data[i];
                var newRow = $('<a href="#" class="product-btn" data-role="button" id="product-btn-' + i + '" data-value="' + value + '">' + value + ' Credit Bundle <span class="price-value"></span></a>');
                $('#purchase-product-list').append(newRow);
            });
            $('#purchase-product-list .product-btn').button();
        });
    },
    _initPurchaseManager: function() {
        try {
            window.purchaseManager = window.plugins.inAppPurchaseManager;
            window.plugins.inAppPurchaseManager.onPurchased = function (transactionIdentifier, productId, transactionReceipt) {
                logger.log('purchased: ' + productId);
                var service = new app.services.BillingService();
                service.verify(transactionIdentifier, productId, transactionReceipt, function () {
                    alert('Thanks. Your purchase has been completed and balance updated.');
                    $.mobile.changePage('#account');
                });
            };

            // Failed to purchase an item
            window.plugins.inAppPurchaseManager.onFailed = function (errno, errtext) {
                logger.log('error: ' + errtext);
                app.ajaxAlert('purchase', 'The purchase was unsuccessful. Please try again.');
            };
        }
        catch (exini) {
            console.log('init plugin err: ' + exini);
        }
    }
};
app.pages.register = {    
    init:function() {
        $('#register-submit-button').live('click', function () {
            var country = $('#register-country').val();
            var phoneNumber = $('#register-phone_number').val();
            var password = $('#register-password').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                phoneNumber = app.userExitCode + phoneNumber;
            } else {
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            }
            $('#register-phone_number').val(phoneNumber);
            
            var accountService = new app.services.AccountService();
            accountService.register(country, phoneNumber, password, function(resp) {
                app.country = country;
                app.phoneNumber = phoneNumber;
                app.password = password;
                app.verificationType = 'register';
                app.fullPhoneNumber = resp.data['phone_number'];
                app.userExitCode = resp.data['exit_code'];
                $.cookie('logins', JSON.stringify({
                    'country': app.country,
                    'phone_number': app.phoneNumber,
                    'password': app.password
                }));
                $.mobile.changePage('#verification');
            }, function() {
                app.ajaxAlert('register', 'Your registration details are incorrect. If you are having difficulty registering take a look at the <a href="http://autotext.co/support" rel="external" target="_blank">FAQ</a>.');
            });
        });
    }
};
app.pages.scheduled = {    
    init:function() {
        $('#scheduled').live('pagebeforeshow', function () { app.pages.scheduled.onLoaded(); });
        $('#scheduled').live('pageshow', function () { app.pages.scheduled.onShow(); });
        $('.edit-message').live('click', function () {
            $('#new-content').height(250);
        });
        $('.settings').live('click', function () {
            $.mobile.changePage('#settings');
        });
        $('#delete-repeats-confirm .cancel').live('click', function () {
            $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                $(this).parents('.delete-btn-container').remove();
            });
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        $('#delete-repeats-confirm .all').live('click', function () {
            $.fn.swipeDeleteType = 'all';
            $.fn.swipeDoDelete.call(app);//todo: confirm if parameter is app or this?
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        $('#delete-repeats-confirm .single').live('click', function () {
            $.fn.swipeDeleteType = 'single';
            $.fn.swipeDoDelete.call(app);
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        $('#scheduled-message-list a.edit-message').live('click', function (e) {
            e.preventDefault();
            if ($('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function () {
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            } else {
                app.dataSingle = false;//(app.draftDeleteType == 'single');
                app.repeats = typeof $(this).parents('li').attr('data-repeats') != 'undefined';
                app.editing = true;
                app.draftEdit = typeof $(this).parents('li').attr('data-draft') == 'string';
                app.unsyncEdit = typeof $(this).parents('li').attr('data-unsynced') == 'string';
                app.newPageResetFields();
                app.newDraft = false;
                var smsId = app.dataId = $(this).parents('li').attr('data-id');
                var scheduleId = app.dataScheduleId = $(this).parents('li').attr('data-schedule-id');

                if (app.draftEdit) {
                    app.draftId = $(this).parents('li').attr('data-draft');
                } else {
                    app.draftId = app.generateUUID();
                }
                $('#new .edit-id').val(smsId + '&' + scheduleId);
                app.lastPageBeforeNew = $.mobile.activePage.attr('id');
                $.mobile.changePage('#new');
            }
        });
    },
    onLoaded: function () {
        var me = this;
        app.repeats = false;
        app.editing = false;
        app.reminding = false;
        app.draftEdit = false;
        app.unsyncEdit = false;
        app.lastPageBeforeNew = app.lastPageBeforeSettings = 'scheduled';

        var service = new app.services.MessageService();
        service.getScheduled(function(data) {
            me._render(data);
        });
        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .schedule-link').addClass('ui-btn-active');
    },
    onShow:function() {
        $.each(app.listUpdateTimers, function (timeout) {
            clearTimeout(app.listUpdateTimers[timeout]);
        });

        app.refreshList('scheduled');
        app.processUnsynced();
    },
    _render:function(allData) {
        var me = this;
        $('#scheduled-message-list li').not('#scheduled-message-template').remove();

        var drafts = app.updateDrafts('list');
        if (drafts != null && typeof drafts == 'object' && drafts.length > 0) {
            allData['schedules'] = drafts.concat(allData['schedules']);
        }

        var noCreditFound = false;
        if (allData['schedules'].length > 0) {
            $.each(allData['schedules'], function (row) {
                var data = allData['schedules'][row];
                var newRow = $('#scheduled-message-template').clone();
                var sendTime = new Date(data['Schedule'].send_time * 1000);
                var repeats = JSON.parse(data.Sms.repeat_options);
                var content = data['Sms'].content;
                var draft = typeof data['Sms'].is_draft != 'undefined';
                var unsynced = draft && data['Schedule'].status == 'unsynced';
                if (data['Sms'].name.length > 0) content = data['Sms'].name + ' - ' + content;
                if (!draft && (repeats.D == 1 || repeats.W == 1 || repeats.M == 1 || repeats.Y == 1)) {
                    newRow.attr('data-repeats', 'repeats');
                }
                if (data['Schedule'].status == 'no_credit') {
                    newRow.addClass('no_credit');
                }
                if (draft) {
                    newRow.attr('data-draft', data['Sms'].id);
                }
                if (unsynced) {
                    newRow.attr('data-unsynced', data['Sms'].id);
                }

                var rowId = data['Sms'].id;
                if (data['Sms'].real_id != undefined && data['Sms'].real_id.length > 0) {
                    rowId = data['Sms'].real_id.split('&')[0];
                }
                newRow.attr('data-id', rowId);
                newRow.attr('data-schedule-id', data['Schedule'].id);
                newRow.find('.message-recipients').text(data['Sms'].recipient_user);
                newRow.find('.message-content').text(content);
                newRow.find('.message-status').text(data['Schedule'].status_text);
                if (!draft) {
                    newRow.find('.message-date').text(app.formatDate(sendTime));
                    newRow.find('.message-time').text(app.formatTime(sendTime));
                } else {
                    newRow.find('.message-date, .message-time').text('-');
                }
                if (data['Schedule'].status == 'no_credit') noCreditFound = true;
                newRow.find('.ui-li-aside').addClass('colour-' + data['Schedule'].status_colour);
                switch (data['Schedule'].status_colour) {
                    default:
                    case '':
                    case 'a3a3a3': // grey
                        newRow.find('.status-icon').attr('src', 'img/icon_black.png');
                        break;
                    case '92d050': // green
                        newRow.find('.status-icon').attr('src', 'img/icon_green.png');
                        break;
                    case 'f0b05f': // amber
                        newRow.find('.status-icon').attr('src', 'img/icon_amber.png');
                        break;
                    case 'c80408': // red
                        newRow.find('.status-icon').attr('src', 'img/icon_red.png');
                        break;
                }
                newRow.removeAttr('id');
                newRow.show();
                $('#scheduled-message-list').append(newRow);

                app.formatNumbersWithContactNames(data['Sms'].recipient_user, $('#scheduled-message-list li[data-id="' + data['Sms'].id + '"] .message-recipients'));
            });
        }
        $('#scheduled-message-list li:not(".no_credit")').swipeDelete({
            click: function (e) {
                me._delete(e);
            }
        });

        if (app.justSetSpam) {
            app.justSetSpam = false;
            app.ajaxAlert('scheduled', 'Unfortunately this message has been flagged by our system for potential SPAM content and will be reviewed by our team before it is allowed to send.');
        } else if (app.justSetUnsynced) {
            app.justSetUnsynced = false;
            app.ajaxAlert('scheduled', 'We can\'t sync this message with our system. Please connect to a mobile network or internet connection.');
        } else if (allData['show_spam_fail_notification'] == true) {
            app.showingSpamFailNotification = true;
            app.ajaxAlert('scheduled', 'Unfortunately one or more messages have been reviewed and found to have SPAM content within them. This message will be moved to your history folder.');
        }
        else if (noCreditFound) {
            var noCreditShown = $.cookie('noCreditShown');
            if (noCreditShown == undefined) {
                $.cookie('noCreditShown', JSON.stringify(true), { expires: 1 });
                app.ajaxAlert('scheduled', 'You don\'t have enough credits to send one or more messages.');
            }
        }
    },
    _delete:function(e) {
        e.preventDefault();
        var me = $(e.currentTarget);
        var repeats = (typeof me.parents('li').attr('data-repeats') != 'undefined');
        if (repeats) {
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').show();
        } else {
            $.fn.swipeDoDelete.call(me);
        }
    }
};
app.pages.scheduleOptions = {    
    init:function() {
        var obj = this;
        $('#schedule-options').live('pagebeforeshow', function () { app.pages.scheduleOptions.onLoaded(); });
        $('#delete-to-draft-repeats-confirm .cancel').live('click', function () {
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        $('#delete-to-draft-repeats-confirm .all').live('click', function () {
            app.draftDeleteType = 'all';
            obj._doDraftDelete();
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        $('#delete-to-draft-repeats-confirm .single').live('click', function () {
            app.draftDeleteType = 'single';
            obj._doDraftDelete();
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        $('#schedule-options .save').live('click', function () {
            if (!app.viewing) {
                if ($(this).hasClass('cancel-state')) {
                    $.mobile.changePage('#new', { reverse: true });
                } else {
                    var sendTime = $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() : new Date().getTime();
                    sendTime = sendTime / 1000;
                    var data = {
                        'time': sendTime
                    };
                    app.editData.schedule_time = sendTime;
                    $.extend(app.newData, data);
                    $.extend(app.editData, data);
                    delete app.newData['part'];
                    delete app.editData['part'];

                    app.pages.newMessage.saveNew();
                }
            } else {
                $.mobile.changePage('#history');
            }
        });
        /**
         * Bind message schedule options back button
         */
        $('#schedule-options .back').live('click', function () {
            var sendTime = $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() : new Date().getTime();
            sendTime = sendTime / 1000;
            var data = {
                'time': sendTime
            };
            $.extend(app.newData, data);
            $.extend(app.editData, data);
            $.mobile.changePage('#new', { reverse: true });
        });
        /**
     * Bind message name link
     */
        $('#new-name-link').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-name');
            }
        });
        /**
         * Bind message date link
         */
        $('#new-date-link').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-date');
            }
        });
        /**
         * Bind repeat options link
         */
        $('#new-repeats-link').live('click', function () {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-repeats');
            }
        });
        /**
         * Bind delete to draft button
         */
        $('#delete-to-draft-btn').live('click', function () {
            app.draftDeleteType = 'all';
            obj._doDraftDelete();
        });
    },
    onLoaded: function () {
        var scrollEl = $('#new-date');
        if (!app.viewing && !scrollEl.hasClass('scrollified')) {
            scrollEl.scroller({
                preset: 'calendar',
                theme: 'ios',
                mode: 'scroller',
                display: 'inline',
                lang: 'en'
            }).addClass('scrollified');
        }

        app.pages.scheduleOptions._newSmsSetData();

        var repeatsTxt = 'Never';
        if (app.newData.repeat_options.length > 0) {
            var tmp = JSON.parse(app.newData.repeat_options);
            if (typeof tmp == 'object' && tmp != null) {
                var repeats = false;
                if (tmp.D == '1') {
                    repeats = true;
                    repeatsTxt = 'Daily';
                } else if (tmp.W == '1') {
                    repeats = true;
                    repeatsTxt = 'Weekly';
                } else if (tmp.M == '1') {
                    repeats = true;
                    repeatsTxt = 'Monthly';
                } else if (tmp.Y == '1') {
                    repeats = true;
                    repeatsTxt = 'Annually';
                }

                if (repeats && tmp.WD == '1' && tmp.W != '1') {
                    repeatsTxt += ', week days only';
                }
            }
        }

        if (!app.justSetEditOpts) {
            $('#new-name-text').text(app.newData.name);
            if ($('#new-date-text').text().length < 1) $('#new-date-text').text(moment().format('ddd, D MMM YYYY, hh:mm a'));
            $('#new-repeats-text').text(repeatsTxt);
        } else {
            app.justSetEditOpts = false;
        }

        if (app.viewing) {
            $('#schedule-options .bar-link .floatR').css('margin-right', '15px');
            $('#schedule-options .bar-link .arrow').hide();
        } else {
            $('#schedule-options .bar-link .floatR').css('margin-right', '30px');
            $('#schedule-options .bar-link .arrow').show();
        }
    },
    _newSmsSetData: function () {
        var data = {
            'name': $('#new-name').val(),
            'part': 'name'
        };
        $.extend(app.newData, data);
        $.extend(app.editData, data);

        var checkedEl = $('input[name="message-repeats"]:checked');
        if (checkedEl.length < 1) checkedEl = $('#message-repeats-none');
        var value = checkedEl.val().toUpperCase();
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

        data = {
            'repeat_options': JSON.stringify(repeatOptions),
            'part': 'repeat_options'
        };
        $.extend(app.newData, data);
        $.extend(app.editData, data);
    },
    _doDraftDelete: function () {
        $.ajax({
            url: app.protocol + app.url + '/sms/delete/' + app.dataId + (app.dataSingle ? '/' + app.dataScheduleId : '') + '?u=' + app.fullPhoneNumber + '&p=' + app.password,
            type: 'GET',
            beforeSend: function () {
                app.loadingTimers.push(setTimeout(function () {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function () {
                app.draftDeleteType = 'all';
                app.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function (resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    app.updateDrafts('view', app.generateUUID(), null, null, true);
                    $.mobile.changePage('#scheduled', { transition: 'slideup', reverse: true });
                } else {
                    app.ajaxAlert('schedule-options');
                }
            },
            error: function () {
                app.ajaxAlert('schedule-options');
            }
        });
    },
};
app.pages.settings = {    
    init:function() {
        $('#settings').live('pagebeforeshow', function () { app.pages.settings.onLoaded(); });
        $('#settings-account-link').live('click', function () {
            $.mobile.changePage('#account');
        });
        $('#settings-help-link').live('click', function () {
            $.mobile.changePage('#help');
        });
        /**
         * Bind settings page reset password link
         */
        $('#settings .reset-password-link').live('click', function () {
            $('#settings .dialog-overlay, #reset-password-confirm').show();
        });
        /**
         * Bind reset password confirmation ok button
         */
        $('#reset-password-confirm .ok').live('click', function () {
            $.removeCookie('logins');
            $('#forgotten-country option').removeAttr('selected');
            $('#forgotten-country option[value="' + app.country + '"]').attr('selected', 'selected');
            $('#forgotten-phone_number').val(app.phoneNumber);
            $('#settings .dialog-overlay, #reset-password-confirm').hide();
            app.pages.forgotten.forgottenSubmit();
        });
        /**
         * Bind reset password confirmation cancel button
         */
        $('#reset-password-confirm .cancel').live('click', function () {
            $('#settings .dialog-overlay, #reset-password-confirm').hide();
        });

        /**
         * Bind settings page logout link
         */
        $('#settings .logout-link').live('click', function () {
            $('#settings .dialog-overlay, #logout-confirm').show();
        });
        /**
     * Bind logout confirmation ok button
     */
        $('#logout-confirm .ok').live('click', function () {
            $.removeCookie('logins');
            $.removeCookie('noCreditShown');
            $('#login-country option:selected').removeAttr('selected');
            $('#login-country option:first').attr('selected', 'selected');
            try {
                $('#login-country').selectmenu().selectmenu('refresh');
            } catch (e) { }
            $('#login-phone_number, #login-password').val('');
            $('#settings .dialog-overlay, #logout-confirm').hide();
            $('.ui-page, .ui-mobile-viewport').removeClass('ui-page-bg-light');
            $.mobile.changePage('#login');
        });
        /**
         * Bind logout confirmation cancel button
         */
        $('#logout-confirm .cancel').live('click', function () {
            $('#settings .dialog-overlay, #logout-confirm').hide();
        });
    },
    onLoaded: function () {
        $('#settings-full-number').text('+' + app.fullPhoneNumber);
    }
};
app.pages.splash = {    
    init:function() {
        $('#splash').live('pageshow', function () { app.pages.splash.onShow(); });
    },
    onShow: function () {
        app.clearTimeouts();
        var loginCookie = $.cookie('logins');
        var draftCookie = $.cookie('drafts');
        if (typeof draftCookie == 'undefined') {
            $.cookie('drafts', JSON.stringify([]),
                { expires: 7300 });
        }

        if (typeof loginCookie != 'undefined') {
            loginCookie = JSON.parse(loginCookie);
            var service = new app.services.AccountService();
            service.login(loginCookie.country, loginCookie.phone_number, loginCookie.password, function(resp) {
                app.fullPhoneNumber = resp.data['phone_number'];
                app.userExitCode = resp.data['exit_code'];
                app.phoneNumber = loginCookie.phone_number;
                app.country = loginCookie.country;
                app.password = loginCookie.password;
                $.mobile.changePage('#scheduled');
                $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
            }, function() {
                $.removeCookie('logins');
                $.mobile.changePage('#login', { transition: 'fade' });
            });
        } else {
            $.mobile.changePage('#login', { transition: 'fade' });
        }
    }
};
app.pages.statusDialog = {    
    init:function() {
        $('#status-dialog').live('pagebeforeshow', function () { app.pages.statusDialog.onLoaded(); });
    },
    onLoaded: function () {
        if (app.editViewStatus != 'unsynced') {
            var service = new app.services.MessageService();
            service.getStatusDescription(function(description) {
                $('#status-dialog-content').html(description);
            }, function() {
                app.ajaxAlert('terms');
            });
        } else {
            $('#status-dialog-content').html('We can\'t sync this message with our system. Please connect to a mobile network or internet connection.');
        }
    }
};
app.pages.terms = {    
    init:function() {
        $('#terms').live('pagebeforeshow', function () { app.pages.terms.onLoaded(); });
    },
    onLoaded: function () {
        if (app.lastPageBeforeTerms != 'verification') {
            $('#terms').addClass('bg-light');
        } else {
            $('#terms').removeClass('bg-light');
        }
        var service = new app.services.TermsService();
        service.getTerms(function(data) {
            $('#terms-content').html(data);
        });
    }
};
app.pages.verification = {    
    init:function() {
        $('#verification').live('pagebeforeshow', function () { app.pages.verification.onLoaded(); });
        $('#verification-invalid-format').live('click', function () {
            var accountService = new app.services.AccountService();
            accountService.formatting(function() {
                $('#verification form').css('bottom', 0);
                app.ajaxAlert('verification', 'Thanks - we\'ll look in to it right away.');
            });
        });
        $('#verification-submit-button').live('click', function () {
            var verificationCode = $('#verification-pin').val();
            var dataStr = 'country=' + app.country + '&phone_number=' + app.phoneNumber + '&pin=' + verificationCode;
            var password;
            if (app.verificationType == 'forgotten') {
                password = $('#verification-password').val();
                dataStr += '&password=' + password;
            }
            var accountService = new app.services.AccountService();
            accountService.verify(dataStr, function() {
                if (app.verificationType == 'forgotten') {
                    app.ajaxAlert('verification', 'Thanks - your password has been reset.', 'login');
                } else {
                    accountService.login(app.country, app.phoneNumber, app.password, function(resp) {
                        app.fullPhoneNumber = resp.data['phone_number'];
                        app.userExitCode = resp.data['exit_code'];
                        $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
                        $.mobile.changePage('#scheduled');
                    }, function() {
                        app.ajaxAlert('verification');
                    });
                }
            }, function() {
                if (app.verificationType == 'forgotten') {
                    app.ajaxAlert('verification', 'We think there might be an error with the verification code or password that you\'ve entered - please review.');
                } else {
                    app.ajaxAlert('verification', 'We think there might be an error with the verification code that you\'ve entered - please review.');
                }
            });
        });
    },
    onLoaded: function () {
        app.clearTimeouts();
        $('#verification-sent-number').text('+' + app.fullPhoneNumber);

        $('#verification').removeClass('verify-forgotten verify-register');
        $('#verification').addClass('verify-' + app.verificationType);
        if (app.verificationType == 'forgotten') {
            $('#verification-nocode-text').hide();
            $('#verification-password_text').hide();
            $('#verification-password').show();
            $('#verification-firstline').text('You will shortly receive your verification code via text message. Simply enter the code in the box below along with your new password and hit verify.');
        } else {
            $('#verification-nocode-text').show();
            $('#verification-password').hide();
            $('#verification-password_text').show();
            $('#verification-firstline').text('You will shortly receive your verification code via text message. Simply enter the code in the box below and hit Verify.');
        }
        $("#verification-password").val("");
        $("#verification-pin").val("");
    }
};
app.services.AccountService = function() {

};

app.services.AccountService.prototype.login = function(country, phoneNumber, password, successCallback, errorCallback) {
    var url = app.protocol + app.url + '/users/login';
    var data = 'country=' + country + '&phone_number=' + phoneNumber + '&password=' + password;
    app.ajaxPost(url, data, "login", function(resp) {
        successCallback(resp);
    }, null, errorCallback);
};

app.services.AccountService.prototype.getCredits = function(callback) {
    var url = app.protocol + app.url + '/users/getCredits?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.AccountService.prototype.shownSpamFailNotification = function(successCallback, errorCallback) {
    var url = app.protocol + app.url + '/users/shownSpamFailNotification?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, successCallback, errorCallback);
};

app.services.AccountService.prototype.register = function (country, phoneNumber, password, successCallback, errorCallback) {
    var url = app.protocol + app.url + '/users/register';
    var data = 'country=' + country + '&phone_number=' + phoneNumber + '&password=' + password;
    app.ajaxPost(url, data, "register", successCallback, null, errorCallback);
};

app.services.AccountService.prototype.formatting = function(callback) {
    var url = app.protocol + app.url + '/users/formatting';
    var data = 'country=' + app.country + '&phone_number=' + app.phoneNumber;
    app.ajaxPost(url, data, "verification", callback);
};

app.services.AccountService.prototype.verify = function(data, callback) {
    var url = app.protocol + app.url + '/users/verify/' + app.verificationType;
    app.ajaxPost(url, data, "verification", callback);
};

app.services.AccountService.prototype.forgotten = function(country, phoneNumber, callback, errorCallback) {
    var url = app.protocol + app.url + '/users/forgotten';
    var data = 'country=' + country + '&phone_number=' + phoneNumber;
    app.ajaxPost(url, data, "forgotten", callback, null, errorCallback);
};
app.services.BillingService = function() {

};

app.services.BillingService.prototype.getProducts = function(callback) {
    var url = app.protocol + app.url + '/billing/listProducts?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.BillingService.prototype.verify = function (transactionIdentifier, productId, transactionReceipt, successCallback) {
    var url = app.protocol + app.url + '/billing/verify?u=' + app.fullPhoneNumber + '&p=' + app.password;
    var data = {
        productId: productId,
        transactionReceipt: transactionReceipt,
        transactionIdentifier: transactionIdentifier
    };

    var errorMsg = 'Error occurred while processing the purchase. If you are sure you have made the purchase, please contact us.';
    app.ajaxPost(url, data, 'purchase', successCallback, errorMsg, function () {
        app.ajaxAlert('purchase', errorMsg);
    }, function (ajaxError) {
        var err = app.system.serialize(ajaxError, 'error');
        app.ajaxAlert('purchase', 'Network error: ' + err + '. If you are sure you have made the purchase, please contact us.');
    });
};
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
            alert('init contacts error: ' + ex);
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
app.services.CountryService = function() {

};

app.services.CountryService.prototype.load = function() {
    var url = app.protocol + app.url + '/users/countries';
    app.ajaxGet(url, function(resp) {
        $('#forgotten-country option, #login-country option, #register-country option').remove();
        var i = 0;
        $.each(resp.data, function(row) {
            var selectedStr = "";
            if (devSettings.isDebug) {
                if (row == "GB") {
                    selectedStr = ' selected="selected"';
                }
            } else if (i++ < 1) {
                selectedStr = ' selected="selected"';
            }
            $('#forgotten-country, #login-country, #register-country').append('<option value="' + row + '"' + selectedStr + '>' + resp.data[row] + '</option>');
        });

        try {
            $('#forgotten-country, #login-country, #register-country').selectmenu().selectmenu('refresh');
        } catch(e) {
            alert(e);
        }
        $('#login-country').trigger('change');
    });
};
app.services.CreditService = function() {

};

app.services.CreditService.prototype.getInternationalCredits = function(callback) {
    var url = app.protocol + app.url + '/users/getInternationalCredits?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};
app.services.GroupService = function() {

};

app.services.GroupService.prototype.getAll = function(callback) {
    var url = app.protocol + app.url + '/groups/index?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.GroupService.prototype.delete = function(id, callback) {
    var url = app.protocol + app.url + '/groups/delete/' + id + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, callback);
};

app.services.GroupService.prototype.getGroup = function(id, callback) {
    var url = app.protocol + app.url + '/groups/view/' + id + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.GroupService.prototype.editGroup = function(id) {
    var url = app.protocol + app.url + '/groups/edit/' + id + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, {}, "newgroup");
};

app.services.GroupService.prototype.validate = function (data, pageId, errorMessage, successCallback, errorCallback, ajaxErrorCallback) {
    var url = app.protocol + app.url + '/groups/validates?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, data, pageId, successCallback, errorMessage, function() {
        if (errorMessage != null && errorMessage != '') {
            app.ajaxAlert(pageId, errorMessage);
        }
        if (errorCallback != undefined) {
            errorCallback();
        }
    }, ajaxErrorCallback);
};

app.services.GroupService.prototype.addEdit = function(isEditing,data, successCallback, errorCallback) {
    var url = app.protocol + app.url + '/groups/' + (!isEditing ? 'add' : 'edit/' + $('#newgroup .edit-id').val()) + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, data, "newgroup", successCallback, null, errorCallback);
};
app.services.MessageService = function() {

};

app.services.MessageService.prototype.getScheduled = function(callback) {
    var url = app.protocol + app.url + '/sms/index/scheduled?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.MessageService.prototype.getSent = function(callback) {
    var url = app.protocol + app.url + '/sms/index/sent?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};

app.services.MessageService.prototype.getStatusDescription = function(successCallback, errorCallback) {
    var url = app.protocol + app.url + '/sms/getStatusDescription/' + app.editViewStatus + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxGet(url, function(resp) {
        successCallback(resp.data);
    }, errorCallback);
};

app.services.MessageService.prototype.validate = function(pageId, data, successCallback, errorCallback, ajaxErrorCallback) {
    var url = app.protocol + app.url + '/sms/validates?u=' + app.fullPhoneNumber + '&p=' + app.password;
    app.ajaxPost(url, data, pageId, successCallback, null, errorCallback, ajaxErrorCallback);
};

app.services.MessageService.prototype.editOrSchedule = function(editId, data, successCallback, completeCallback) {
    var url = app.protocol + app.url + '/sms/' + (app.editing && app.editType != 'single' ? 'edit/' + editId : 'schedule') + '?u=' + app.fullPhoneNumber + '&p=' + app.password;
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        beforeSend: function() {
            app.loadingTimers.push(setTimeout(function() {
                $.mobile.loading('show');
            }, 1000));
        },
        complete: function() {
            completeCallback();
        },
        success: function(resp) {
            $('#' + $.mobile.activePage.attr('id') + ' .progressbar-status').text('Saved!');
            resp = JSON.parse(resp);
            if (resp.status == 'OK') {
                successCallback(resp);
            } else {
                var errTxt = resp.data[0][0];
                app.ajaxAlert($.mobile.activePage.attr('id'), errTxt);
            }
        },
        error: function() {
            app.saveAsUnsynced();
            $.mobile.changePage('#scheduled');
        }
    });
};
app.services.TermsService = function() {

};

app.services.TermsService.prototype.getTerms = function(callback) {
    var url = app.protocol + app.url + '/pages/terms';
    app.ajaxGet(url, function(resp) {
        callback(resp.data);
    });
};
app.ajaxPost = function (url, data, pageId, success, errorMessage, errorCallback, ajaxErrorCallback, completeCallback) {
    if (typeof pageId == 'undefined' || pageId == null) {
        pageId = $.mobile.activePage.attr('id');
    }
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        beforeSend: function () {
            app.loadingTimers.push(setTimeout(function () {
                $.mobile.loading('show');
            }, 1000));
        },
        complete: function () {
            if (completeCallback == undefined || completeCallback == null) {
                app.clearTimeouts();
                $.mobile.loading('hide');
            } else {
                completeCallback();
            }
        },
        success: function (resp) {
            resp = JSON.parse(resp);
            if (resp.status == 'OK') {
                if (success != undefined && success != null) {
                    success(resp);
                }
            } else {
                if (errorCallback != undefined) {
                    errorCallback();
                } else {
                    app.ajaxAlert(pageId, errorMessage);
                }
            }
        },
        error: function (ajaxError) {
            if (ajaxErrorCallback != undefined) {
                ajaxErrorCallback(ajaxError);
            } else {
                app.ajaxAlert(pageId);
            }
        }
    });
};

app.ajaxGet = function (url, success, errorCallback) {
    $.ajax({
        url: url,
        type: 'GET',
        beforeSend: function () {
            app.loadingTimers.push(setTimeout(function () {
                $.mobile.loading('show');
            }, 1000));
        },
        complete: function () {
            app.clearTimeouts();
            $.mobile.loading('hide');
        },
        success: function (resp) {
            resp = JSON.parse(resp);
            if (resp.status == 'OK') {
                success(resp);
            } else {
                if (errorCallback == undefined || errorCallback == null) {
                    app.ajaxAlert($.mobile.activePage.attr('id'));
                } else {
                    errorCallback();
                }
            }
        },
        error: function () {
            if (errorCallback == undefined || errorCallback == null) {
                app.ajaxAlert($.mobile.activePage.attr('id'));
            } else {
                errorCallback();
            }
        }
    });
};

app.ajaxAlert = function(page, text, callback) {
    var me = this;
    var err = $('#' + page + ' .error');

    if (typeof text == 'undefined' || text == null || text == '') {
        text = 'Something went wrong, please try again.';
    }
    err.find('.inner').html(text);
    if (typeof callback != 'undefined') {
        me.ajaxAlertCallback = callback;
    }
    $('body').append('<div class="error-overlay"><div>');
    err.slideDown();
    $('.error, .error-overlay').bind('click tap', function() {
        if (me.showingSpamFailNotification) {
            me.showingSpamFailNotification = false;
            var accountService = new app.services.AccountService();
            accountService.shownSpamFailNotification(function() {
                $('.error, .error-overlay').slideUp().unbind('click tap');
                if (me.ajaxAlertCallback != null) {
                    callback = me.ajaxAlertCallback;
                    me.ajaxAlertCallback = null;
                    $.mobile.changePage('#' + callback);
                }
            }, function() {
                me.ajaxAlert($.mobile.activePage.attr('id'));
            });
        } else {
            $('.error, .error-overlay').slideUp();
            $(this).unbind('click tap');
            if (me.ajaxAlertCallback != null) {
                callback = me.ajaxAlertCallback;
                me.ajaxAlertCallback = null;
                $.mobile.changePage('#' + callback);
            }
        }
    });
};
app.doBinds = function () {
    var me = this;

    /** Fix to allow rescheduled button to work with same page transistion see 
    http://forum.jquery.com/topic/changepage-allowsamepagetransition-true-displays-blank-page **/


    /** Sets default login details for testing**/
    if (devSettings.isDebug) {
        $("#login-phone_number").val("07960270356");
        $("#login-password").val("autotext");
    }

    /**
     * Opens external links in iOS Safari
     */
    $('a.external-link').live('click', function (e) {
        e.preventDefault();
        window.open($(e.currentTarget).attr('href'), '_system');
    });

    $('.schedule-link, .history-link, .groups-link').live('click', function () {
        var left = false;
        var nextPg = '';
        switch ($.mobile.activePage.attr('id')) {
            case 'scheduled':
                if ($(this).hasClass('history-link')) {
                    nextPg = 'history';
                } else if ($(this).hasClass('groups-link')) {
                    nextPg = 'groups';
                }
                break;

            case 'history':
                if ($(this).hasClass('schedule-link')) {
                    left = true;
                    nextPg = 'scheduled';
                } else if ($(this).hasClass('groups-link')) {
                    nextPg = 'groups';
                }
                break;

            case 'groups':
                left = true;
                if ($(this).hasClass('schedule-link')) {
                    nextPg = 'scheduled';
                } else if ($(this).hasClass('history-link')) {
                    nextPg = 'history';
                }
                break;
        }
        if (nextPg.length > 0) $.mobile.changePage('#' + nextPg, { reverse: left });
    });

    $('input').live('keyup', function (e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key == 13) {
            e.preventDefault();
            var currPg = $.mobile.activePage.attr('id');
            switch (currPg) {
                case 'login':
                    $('#login-submit-button').trigger('click');
                    break;
                case 'register':
                    $('#register-submit-button').trigger('click');
                    break;
                case 'forgotten':
                    $('#forgotten-submit-button').trigger('click');
                    break;
                case 'verification':
                    $('#verification-submit-button').trigger('click');
                    break;
                case 'new':
                    var saveEl = $('#new .save:visible');
                    if (saveEl.length < 1) saveEl = $('#new-submit-button');
                    saveEl.trigger('click');
                    break;
                case 'message-name':
                    $('#message-name .back').trigger('click');
                    break;
                case 'newgroup':
                    $('#newgroup .save').trigger('click');
                    break;
                case 'addcontactfromnumber':
                    $('#addcontactfromnumber .save').trigger('click');
                    break;
                case 'addNumber':
                    $('#addNumber .back').trigger('click');
                    break;
            }
        }
    });

    /**
     * Remove default textarea auto grow behaviour and activate third party plugin
     */
    $('textarea').off('keyup').autoGrowTextArea();

    $('.new-link').live('click', function () {
        $('#new-content').height(28);
    });

    /**
    * Makes sure textarea is at correct height for remind me
    */

    $('.reminder-link').live('click', function () {
        $('#new-content').height(28);
    });

    /**
     * Binds terms link
     */
    $('.terms').live('click', function () {
        me.lastPageBeforeTerms = $.mobile.activePage.attr('id');
        $.mobile.changePage('#terms');
    });

    /**
     * Bind change event on login and forgotten page country selects. Retrieves and stores exit code for selected country (used for later API calls)
     */
    $('#login-country, #forgotten-country').live('change', function () {
        if (!me.stopCountryChange) {
            $.ajax({
                url: me.protocol + me.url + '/users/getExitCode/' + $(this).find('option:selected').val(),
                type: 'GET',
                beforeSend: function () {
                    me.loadingTimers.push(setTimeout(function () {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function () {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function (resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        me.userExitCode = resp.data;
                    } else {
                        me.ajaxAlert($.mobile.activePage.attr('id'));
                    }
                },
                error: function () {
                    me.ajaxAlert($.mobile.activePage.attr('id'));
                }
            });
        }
    });

    /**
     * Bind message credits button
     */
    $('.messagecredits-button').live('click', function () {
        me.lastPageBeforeMessageCredits = $.mobile.activePage.attr('id');
        $.mobile.changePage('#messagecredits');
    });


    /**
     * Bind message name and content fields to change page title
     */
    $('#new-name, #new-content').live('keyup', function () {
        if (!me.reminding) {
            var title = $('#new-name').val();
            if (title.length > 0) title += ' - ';
            title += $('#new-content').val();

            if (title.length < 1 && !me.editing) {
                title = 'New Message';
            } else if (title.length < 1) {
                title = 'Edit Message';
            }
            $('#new .page-title').text(title);
        }
    });

    /**
     * Bind edit repeating message confirmation single message button
     */
    $('.edit-repeats .single').live('click', function () {
        me.editType = 'single';
        $('.dialog-overlay, .edit-repeats').hide();
        app.pages.newMessage.newActualSave();
    });
    /**
     * Bind edit repeating message confirmation all messages button
     */
    $('.edit-repeats .all').live('click', function () {
        me.editType = 'all';
        $('.dialog-overlay, .edit-repeats').hide();
        app.pages.newMessage.newActualSave();
    });
    /**
     * Bind edit repeating message confirmation cancel button
     */
    $('.edit-repeats .cancel').live('click', function () {
        $('.dialog-overlay, .edit-repeats').hide();
    });

    /**
     * Bind main nav new message button
     */
    $('.new-link').live('click', function (e) {
        e.preventDefault();
        me.reminding = false;
        me.editData = {};
        me.newPageResetFields();
        me.lastPageBeforeNew = $.mobile.activePage.attr('id');
        me.newDraft = true;
        $.mobile.changePage('#new', { transition: 'slide' });
    });

    /**
     * Bind main nav reminder button
     */
    $('.reminder-link').live('click', function (e) {
        e.preventDefault();
        me.reminding = true;
        me.newPageResetFields();
        me.lastPageBeforeNew = $.mobile.activePage.attr('id');
        $.mobile.changePage('#new', { transition: 'slide' });
    });

    /**
     * Bind back buttons throughout app
     */
    $('#new .back, #register .back, #forgotten .back, #verification .back, #terms .back, #status-dialog .back, #purchase .back, #settings .back, #account .back, #help .back, #help-1 .back, #help-2 .back, #help-3 .back, #help-4 .back, #help-5 .back, #help-6 .back, #help-7 .back, #messagecredits .back, #newgroup .back, #addcontactfromnumber .back').live('click', function () {
        var currId = $.mobile.activePage.attr('id');
        var prevId = '';
        var prevTransition = $.mobile.defaultPageTransition;
        switch (currId) {
            case 'new':
                prevId = me.lastPageBeforeNew; // scheduled, history or groups
                prevTransition = 'slideup';
                break;
            case 'register':
                prevId = 'login';
                break;
            case 'forgotten':
                prevId = 'login';
                break;
            case 'verification':
                prevId = me.verificationType; // register or forgotten
                break;
            case 'terms':
                prevId = me.lastPageBeforeTerms; // verification, help or status-dialog
                break;
            case 'status-dialog':
                prevId = 'new';
                break;
            case 'purchase':
                prevId = me.lastPageBeforePurchase; // account or status-dialog
                break;
            case 'settings':
                prevId = me.lastPageBeforeSettings; // scheduled or history
                break;
            case 'account':
                prevId = 'settings';
                break;
            case 'help':
                prevId = 'settings';
                break;
            case 'help-1':
                prevId = 'help';
                break;
            case 'help-2':
                prevId = 'help-1';
                break;
            case 'help-3':
                prevId = 'help-2';
                break;
            case 'help-4':
                prevId = 'help-3';
                break;
            case 'help-5':
                prevId = 'help-4';
                break;
            case 'help-6':
                prevId = 'help-5';
                break;
            case 'help-7':
                prevId = 'help-6';
                break;
            case 'messagecredits':
                prevId = me.lastPageBeforeMessageCredits; // help, new or purchase
                break;
            case 'newgroup':
                prevId = 'groups';
                break;
            case 'addcontactfromnumber':
                prevId = 'newgroup';
                break;
            default:
                me.ajaxAlert(currId);
                break;
        }
        if (prevId.length > 0) {
            $.mobile.changePage('#' + prevId, { reverse: true, transition: prevTransition });
        }
    });
};
/**
* Refresh scheduled/history page message lists every 60 seconds
*/
app.refreshList = function (pageId) {
    var me = this;
    setTimeout(function () {
        if ($.mobile.activePage.attr('id') == pageId) {
            me.pages[pageId].onLoaded();
            me.refreshList(pageId);
        }
    }, 60000);
};

/**
* Sets new/edit message pages fields back to their default state
*/
app.newPageResetFields = function() {
    var me = this;
    if (me.canResetNewPage) {
        me.newData = {
            'name': '',
            'recipient': '',
            'content': '',
            'time': '',
            'reminder': '',
            'repeat_options': ''
        };
        $('#new-name, #new-recipient, #new-content').val('');
        $('#message-repeats input[name="message-repeats"]').removeAttr('checked');
        $('#message-repeats-none').attr('checked', 'checked');
        try {
            $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
        } catch(e) {
        }
        $('#message-repeats-wd option:selected').removeAttr('selected');
        $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
        try {
            $('#message-repeats-wd').slider('refresh');
        } catch(e) {
        }
        var scrollEl = $('#new-date');
        scrollEl.val('').scroller('destroy').removeClass('scrollified');

        if (!me.viewing) {
            scrollEl.scroller({
                preset: 'calendar',
                theme: 'ios',
                mode: 'scroller',
                display: 'inline',
                lang: 'en'
            }).addClass('scrollified');
        }
        $('#new-date-text').text('');
    }
};
/**
* Save a message on the local device, flag as unsynced and attempt to process unsynced messages in 60 seconds
*/
app.saveAsUnsynced = function() {
    var me = this;
    me.unsyncEdit = true;
    me.updateDrafts('edit', me.draftId, null, true);
    me.justSetUnsynced = true;
    if (me.unsyncedTimer === null) {
        me.unsyncedTimer = setTimeout(function() {
            me.processUnsynced();
        }, 60000);
    }
};

app.processUnsynced = function() {
    var me = this;
    var messages = me.updateDrafts('unsynced');
    if (messages.length > 0) {
        var messageData = messages[0];
        var data = {
            name: messageData.Sms['name'],
            recipient: messageData.Sms['recipient'],
            content: messageData.Sms['content'],
            time: messageData.Schedule['send_time'],
            repeat_options: messageData.Sms['repeat_options'],
            reminder: messageData.Sms['reminder']
        };
        var now = Math.floor(new Date().getTime() / 1000) + 60;
        if (data.time < now) data.time = now;

        var editing = messageData.Sms['real_id'] != undefined && messageData.Sms['real_id'].length > 0;
        var ids = [];
        if (editing) ids = messageData.Sms['real_id'].split('&');

        $.ajax({
            url: me.protocol + me.url + '/sms/' + (editing ? 'edit/' + ids[0] : 'schedule') + '?u=' + me.fullPhoneNumber + '&p=' + me.password,
            type: 'POST',
            data: $.param(data),
            beforeSend: function() {
                clearTimeout(me.unsyncedTimer);
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    me.updateDrafts('delete', messageData.Sms['id']);
                    if (messages.length > 1) {
                        me.processUnsynced();
                    } else {
                        clearTimeout(me.unsyncedTimer);
                        me.unsyncedTimer = null;
                        app.pages.scheduled.onLoaded();
                        me.refreshList('scheduled');
                    }
                } else {
                    me.unsyncedTimer = setTimeout(function() {
                        me.processUnsynced();
                    }, 60000);
                }
            },
            error: function() {
                me.unsyncedTimer = setTimeout(function() {
                    me.processUnsynced();
                }, 60000);
            }
        });
    } else {
        clearTimeout(me.unsyncedTimer);
        me.unsyncedTimer = null;
    }
};

/**
* Function used to add, edit and retrieve draft/unsynced messages to/from the local device
*/
app.updateDrafts = function(action, id, data, unsynced, addDraft) {
    var me = this;
    if (typeof action != 'string') return false;
    //todo: a bug with $.cookie('drafts')
    var drafts = JSON.parse($.cookie('drafts'));
    switch (action) {
    default:
        return false;
    case 'add':
        if (typeof data != 'object') return false;
        me.draftEdit = true;
        drafts.push(data);
        break;
    case 'edit':
        if (typeof id != 'string') return false;
        me.draftEdit = true;
        $(drafts).each(function(draft) {
            if (drafts[draft].Sms['id'] == id) {
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

                var tmpRealId = null;
                var tmpUnsyncedInEdit = unsynced != undefined ? unsynced : drafts[draft].Sms['unsynced'];
                if (drafts[draft].Sms['real_id'] != undefined) tmpRealId = drafts[draft].Sms['real_id'];
                drafts[draft] = {
                    'Sms': {
                        'content': $('#new-content').val(),
                        'id': id,
                        'is_draft': true,
                        'name': $('#new-name').val(),
                        'recipient': $('#new-recipient').val(),
                        'recipient_user': $('#new-recipient').val(),
                        'reminder': me.reminding ? '1' : '0',
                        'repeat_options': JSON.stringify(repeatOptions),
                        'unsynced': tmpUnsyncedInEdit
                    },
                    'Schedule': {
                        'id': me.generateUUID(),
                        'send_time': $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() / 1000 : new Date().getTime() / 1000,
                        'status': tmpUnsyncedInEdit ? 'unsynced' : 'draft',
                        'status_colour': tmpUnsyncedInEdit ? 'f0b05f' : 'a3a3a3',
                        'status_text': tmpUnsyncedInEdit ? 'Unsynced' : 'Draft'
                    }
                };

                if (tmpRealId != null) drafts[draft].Sms['real_id'] = tmpRealId;
            }
        });
        break;
    case 'view':
        if (typeof id != 'string') return false;
        var ret = null;
        me.draftId = id;
        $(drafts).each(function(draft) {
            if (drafts[draft].Sms['id'] == id) {
                ret = drafts[draft];
            }
        });

        if (ret === null) {
            var tmpUnsynced = unsynced != undefined ? unsynced : false;
            ret = {
                'Sms': {
                    'content': me.editData.content,
                    'id': id,
                    'is_draft': true,
                    'name': me.editData.name,
                    'recipient': me.editData.recipient,
                    'recipient_user': me.editData.recipient_user,
                    'reminder': me.reminding ? '1' : '0',
                    'repeat_options': me.editData.repeat_options,
                    'unsynced': tmpUnsynced
                },
                'Schedule': {
                    'id': me.generateUUID(),
                    'send_time': me.editData.schedule_time,
                    'status': tmpUnsynced ? 'unsynced' : 'draft',
                    'status_colour': 'a3a3a3',
                    'status_text': tmpUnsynced ? 'Unsynced' : 'Draft'
                }
            };
            if (addDraft) {
                me.updateDrafts('add', 0, ret);
            } else {
                var realId = $('#new .edit-id').val();
                if (realId.length > 0) {
                    ret.Sms['real_id'] = realId;
                } else if ($('#new #new-recipient').val() != '' || $('#new #new-content').val() != '' || addDraft) {
                    me.updateDrafts('add', 0, ret);
                }
            }
        }
        return ret;
    case 'delete':
        if (typeof id != 'string') return false;
        var tmpDeleteData = [];
        $(drafts).each(function(draft) {
            if (drafts[draft].Sms['id'] != id) {
                tmpDeleteData.push(drafts[draft]);
            }
        });
        drafts = tmpDeleteData;
        break;
    case 'wipe':
        drafts = [];
        break;
    case 'list':
        var tmp = JSON.parse($.cookie('drafts'));
        var times = [];
        var res = [];
        $.each(tmp, function(draft) {
            times.push(tmp[draft].Schedule.send_time);
        });
        times = me.asort(times);
        for (var ti = 0; ti < times.length; ti++) {
            for (var di = 0; di < tmp.length; di++) {
                if (times[ti] == tmp[di].Schedule.send_time) {
                    res.push(tmp[di]);
                }
            }
        }

        return res;
    case 'unsynced':
        var draftsUnsyncedData = JSON.parse($.cookie('drafts'));
        var tmpUnsyncedData = [];
        $.each(draftsUnsyncedData, function (draft) {
            if (draftsUnsyncedData[draft].Sms['unsynced']) {
                tmpUnsyncedData.push(draftsUnsyncedData[draft]);
            }
        });
        return tmpUnsyncedData;
    }
    $.cookie('drafts', JSON.stringify(drafts),
        { expires: 7300 });

    return true;
};

/**
* Sort an array but leave keys intact
*/
app.asort = function(times) {
    return times.sort(function(a, b) {
        return a - b;
    });
};

/**
* Generate a UUID (used for draft/unsynced messages)
*/
app.generateUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
* Initiate page title progress bar on new/edit message page
*/
app.doProgressBar = function() {
    try {
        if ($('#' + $.mobile.activePage.attr('id') + ' .progressbar:visible').length < 1) {
            $('#' + $.mobile.activePage.attr('id') + ' h1 .page-title').hide();
            $('#' + $.mobile.activePage.attr('id') + ' .progressbar').show();
            $('#' + $.mobile.activePage.attr('id') + ' .progressbar-status').css('display', 'block');

            $('#new h1').css('overflow', 'visible');
            TolitoProgressBar('#' + $.mobile.activePage.attr('id') + ' .progressbar')
                .isMini(true)
                .showCounter(false)
                .setInterval(20)
                .setMax(125)
                .setOuterTheme('b')
                .setInnerTheme('c')
                .build()
                .init();
        }
    } catch(ex) {
        console.log('progressbar error: ' + ex);
    }
};

/**
* Format numbers from user's address book so their names show rather than numbers (needs re-working)
*/
app.formatNumbersWithContactNames = function(numbers, el, button) {
    if (typeof button == 'undefined') button = false;

    numbers = numbers == undefined ? [] : numbers.split(',');
    var recipientStr = '';
    for (var i = 0; i < numbers.length; i++) {
        recipientStr += '<span' + (button ? ' data-role="button" data-mini="true"' : '') + ' data-phone_number="' + numbers[i] + '">';
        recipientStr += numbers[i];
        //            recipientStr += '</span>';
        if (!button && (i + 1) < numbers.length) recipientStr += ', ';
    }
    el.html(recipientStr);
};

/**
* Format timestamp in to day/month/year
*/
app.formatDate = function(time) {
    var day = '' + parseInt(time.getDate());
    var month = '' + parseInt(time.getMonth() + 1);
    var year = '' + parseInt(time.getFullYear());
    day = day > 9 ? day : '0' + day;
    month = month > 9 ? month : '0' + month;
    return day + '/' + month + '/' + year;
};

/**
* Format timestamp in to hours:minutes
*/
app.formatTime = function(time, twelveHr) {
    if (typeof twelveHr == 'undefined') twelveHr = false;
    var hours = '' + time.getHours();
    var minutes = '' + time.getMinutes();
    hours = hours > 9 ? hours : '0' + hours;
    minutes = minutes > 9 ? minutes : '0' + minutes;
    return hours + ':' + minutes;
};

/**
* Clear timeouts that run before loading graphic is shown
*/
app.clearTimeouts = function() {
    var me = this;
    $.each(me.loadingTimers, function(timeout) {
        clearTimeout(me.loadingTimers[timeout]);
    });
};
window.devSettings = {
    isDebug: false
};

// Error Log bar - set display settings in fix.css

window.logger = {
    actions: [],
    log: function (msg) {
        this.actions.push(msg);
        if (this.actions.length <= 1) {
            this._log();
        }
    },
    _log: function () {
        var me = this;
        if (this.actions.length > 0) {
            var firstItem = this.actions[0];
            $("#log").html(firstItem);
            this.actions.splice(0, 1);
        }
        if (this.actions.length > 0) {
            setTimeout(function () {
                me._log();
            }, 5000);
        }
    }
};


app.system = {
    serialize: function (obj, name) {
        var result = "";
        try {
            function serializeInternal(o, path) {
                for (p in o) {
                    var value = o[p];
                    if (typeof value == "object") {
                        if (p * 1 >= 0) {
                            serializeInternal(value, path + '[' + p + ']');
                        } else {
                            serializeInternal(value, path + '.' + p);
                        }
                    } else if (typeof value != "function") {
                        result += "\n" + path + "." + p + " = " + value;
                    }
                }
            }
            serializeInternal(obj, name);
        } catch(ex) {
            
        }
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
            number = app.userExitCode + number.substr(1);
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

