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