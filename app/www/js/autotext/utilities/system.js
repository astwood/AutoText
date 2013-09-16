app.system = {
    serialize: function (obj, name) {
        var result = "";

        function serializeInternal(o, path) {
            for (p in o) {
                var value = o[p];
                if (typeof value == "object") {
                    if (p * 1 >= 0) {
                        serializeInternal(value, path + '[' + p + ']');
                    } else {
                        serializeInternal(value, path + '.' + p);
                    }
                }
                else if (typeof value != "function") {
                    result += "\n" + path + "." + p + " = " + value;
                }
            }
        }

        serializeInternal(obj, name);
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

