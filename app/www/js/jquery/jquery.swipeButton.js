/*
	Name: jquery.swipeButton.js
	Author: Andy andyMatthews
	Website: http://andyMatthews.net
	Version: 1.2.1
*/
(function($){

        $.fn.swipeDeleteType = '';
        $.fn.currentRow = null;
        $.fn.swipeOptions = {};

	$.fn.swipeDelete = function(args){

		$(this).attr("data-swipeurl",""); //setting data-swipeurl on the li --Added: 2012/12/15
		
                $.fn.swipeOptions = $.extend( $.fn.swipeDelete.defaults, $.fn.swipeOptions, args || {} );
                
                return this.filter('[data-swipeurl]').each(function(i, el){
			var $e = $(el);

			$e.on('swiperight', $.fn.swipeFunction);
                        $e.on('swipeleft', $.fn.swipeFunction);

		});
	};
        
        $.fn.swipeFunction = function ( e ) {
                // reference the current item
                var $li = $.fn.currentRow = $(this);
                var $parent = $(this).parent('ul');
                var cnt = $('.aSwipeBtn', $li).not(".ui-btn-icon-notext").length;
                var totalCnt = $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass, $parent).length;

                // remove all currently displayed buttons
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass, $parent).animate({ width: 'toggle' }, 200, function(e) {
                    var parentId = $parent.attr('id');
                    if (parentId == 'newgroup-contacts-list' || parentId == 'selectedNumbers') {
                            $li.find('.ui-li-heading').css('max-width', '50%');
                        }
                        $li.parents('ul').find('.ui-li-aside, .ui-icon-arrow-r').show();
                        $(this).parents('.delete-btn-container').remove();
                });

                // if there's an existing button we simply delete it, then stop
                if (!cnt && !totalCnt) {
                        // create button
                        var $swipeBtn = $('<a>' + $.fn.swipeOptions.btnLabel + '</a>').attr({
                                                                'data-role': 'button',
                                                                'data-inline': 'true',
                                                                'class': ($.fn.swipeOptions.btnClass === 'aSwipeBtn') ? $.fn.swipeOptions.btnClass : $.fn.swipeOptions.btnClass + ' aSwipeBtn',
                                                                'data-theme': $.fn.swipeOptions.btnTheme,
                                                                'href': $li.data('swipeurl')
                                                        })
                                                        .on('click tap', $.fn.swipeOptions.click);
                        var $div = $('<div class="delete-btn-container"></div>').append($swipeBtn);

                        // slide insert button into list item
                        $div.prependTo($li.find('.edit-message, .view-group, .group-contact'));
                        $swipeBtn.button();
                        $li.find('.aSwipeBtn').hide().animate({ width: 'toggle' }, 200);
                        if ($parent.attr('id') == 'newgroup-contacts-list' || $parent.attr('id') == 'selectedNumbers') {
                            $li.find('.ui-li-heading').css('max-width', '25%');
                        }
                        
                        $li.find('.ui-li-aside, .ui-icon-arrow-r').hide();
                        
                        // override row click
                        $('div a:not(' + $.fn.swipeOptions.btnClass + ')', $li).on('click.swipe', function(e){
                                e.stopPropagation();
                                e.preventDefault();
                                $(this).off('click.swipe');
                                $li.removeClass('ui-btn-active').find('div.aSwipeBtn').remove();
                        });

                }


        };

	$.fn.swipeDelete.defaults = {
		btnLabel: 'Delete',
		btnTheme: 'e',
		btnClass: 'aSwipeBtn',
                click: function(e){
                    e.preventDefault();
                }
	};
        
        $.fn.swipeDoDelete = function() {
            var me = $.fn.currentRow;
            var id = me.attr('data-id');
            var scheduleId = me.attr('data-schedule-id');
            var single = ($.fn.swipeDeleteType == 'single');
            var draft = typeof me.attr('data-draft') == 'string';
            
            if (!draft) {
                $.ajax({
                    url: app.protocol+app.url+'/sms/delete/'+id+(single ? '/'+scheduleId : '')+'?u='+app.fullPhoneNumber+'&p='+app.password,
                    type: 'GET',
                    beforeSend: function() {
                        app.loadingTimers.push(setTimeout(function() {
                            $.mobile.loading('show');
                        }, 1000));
                    },
                    complete: function() {
                        $.fn.swipeDeleteType = '';
                        app.clearTimeouts();
                        $.mobile.loading('hide');
                    },
                    success: function(resp) {
                        resp = JSON.parse(resp);
                        if (resp.status == 'OK') {
                            $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                                $(this).parents('.delete-btn-container').remove();
                            });

                            var id = '';
                            if (!single) {
                                id = me.attr('data-id');
                                me.parents('ul').find('[data-id="'+id+'"]').slideUp(400, function() {
                                    app[$.mobile.activePage.attr('id')+'Page'].call(app);
                                });
                            } else {
                                id = me.attr('data-schedule-id');
                                me.parents('ul').find('[data-schedule-id="'+id+'"]').slideUp(400, function() {
                                    app[$.mobile.activePage.attr('id')+'Page'].call(app);
                                });
                            }
                        } else {
                            app.ajaxAlert('scheduled');
                        }
                    },
                    error: function() {
                        app.ajaxAlert('scheduled');
                    }
                });
            } else {
                app.updateDrafts('delete', me.attr('data-draft'));
                
                $.fn.swipeDeleteType = '';
                app.clearTimeouts();
                $.mobile.loading('hide');
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                    $(this).parents('.delete-btn-container').remove();
                });
                me.parents('ul').find('[data-schedule-id="'+scheduleId+'"]').slideUp(400, function() {
                    $(this).remove();
                });
            }
        };

}(jQuery));
