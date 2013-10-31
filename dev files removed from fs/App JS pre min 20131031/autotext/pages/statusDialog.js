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