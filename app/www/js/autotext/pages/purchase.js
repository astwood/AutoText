app.pages.purchase = {    
    init:function() {
        var obj = this;
        $('#purchase').live('pagebeforeshow', function () { app.pages.purchase.onLoaded(); });
        $('.product-btn').live('click', function () {
            var id = $(this).attr('id').replace('product-btn-', '');
            var credits = $(this).attr('data-value') * 1;
            logger.log(id + ':' + credits);
            try {
                purchaseManager.requestProductData(id, function (result) {
                    purchaseManager.makePurchase(result.id, 1);
                }, function (errr) {
                    alert("purchase callback error: " + errr);
                });
            } catch (expurchange) {
                alert("purchase error: " + expurchange);
            }
        });
        $(document).bind('purchaseManagerLoaded', function () {
            obj._initPurchaseManager();
        });
    },
    onLoaded: function () {
        var service = new app.services.BillingService();
        service.getProducts(function(data) {
            $('#purchase-product-list').html('');
            $.each(data, function(i) {
                var value = data[i];
                var newRow = $('<a href="#" class="product-btn" data-role="button" id="product-btn-' + i + '" data-value="' + value + '">' + value + ' Credit Bundle <span class="price-value"></span></a>');
                $('#purchase-product-list').append(newRow);
            });
            $('#purchase-product-list .product-btn').button();
        });
    },
    _initPurchaseManager: function() {
        try {
            window.purchaseManager = window.plugins.inAppPurchaseManager;
            window.plugins.inAppPurchaseManager.onPurchased = function (transactionIdentifier, productId, transactionReceipt) {
                logger.log('purchased: ' + productId);
                var service = new app.services.BillingService();
                service.verify(transactionIdentifier, productId, transactionReceipt, function () {
                    alert('Thanks. Your purchase has been completed and balance updated.');
                    $.mobile.changePage('#account');
                });
            };

            // Failed to purchase an item
            window.plugins.inAppPurchaseManager.onFailed = function (errno, errtext) {
                logger.log('error: ' + errtext);
                app.ajaxAlert('purchase', 'The purchase was unsuccessful. Please try again.');
            };
        }
        catch (exini) {
            console.log('init plugin err: ' + exini);
        }
    }
};