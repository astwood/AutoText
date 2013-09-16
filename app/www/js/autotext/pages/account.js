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