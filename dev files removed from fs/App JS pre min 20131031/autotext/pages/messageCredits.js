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