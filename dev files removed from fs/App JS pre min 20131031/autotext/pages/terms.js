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