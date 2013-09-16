
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