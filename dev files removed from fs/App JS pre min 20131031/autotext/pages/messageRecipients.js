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