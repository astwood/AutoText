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

