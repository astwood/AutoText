var HelloPlugin = {
callIOS: function(types, success, fail) {
    return Cordova.exec(success, fail, "HelloManager", "print", types);
}
};

HelloPlugin.say = function(){
    HelloPlugin.callIOS(["HelloWorld"], function(result) {
                            alert("Success: \r\n"+result);
                        },
                        function(error) {
                            alert("Error: \r\n"+error);
                        });
};