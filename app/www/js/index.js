var app = {
    protocol: 'https://',
    url: 'app.autotext.co/api',
    loadingTimers: [],
    unsyncedTimer: null,
    listUpdateTimers: [],
    userExitCode: null,
    fullPhoneNumber: null,
    verificationType: null,
    country: null,
    phoneNumber: null,
    editing: false,
    viewing: false,
    reminding: false,
    copying: false,
    groupEditing: false,
    unsyncEdit: false,
    draftEdit: false,
    draftId: null,
    newDraft: false,
    newData: {
        'name': '',
        'recipient': '',
        'content': '',
        'time': '',
        'reminder': '',
        'repeat_options': ''
    },
    canResetNewPage: false,
    editData: {},
    groupData: {
        'name': '',
        'contacts': []
    },
    oldEditData: {},
    justSetEditOpts: false,
    stopDraftAddEdit: false,
    editViewStatus: '',
    editType: '',
    lastPageBeforeNew: '',
    lastPageBeforeSettings: '',
    lastPageBeforeTerms: '',
    lastPageBeforeMessageCredits: '',
    repeats: false,
    draftDeleteType: 'single',
    dataId: null,
    dataScheduleId: null,
    dataSingle: null,
    stopCountryChange: true,
    ajaxAlertCallback: null,
    justSetSpam: false,
    justSetUnsynced: false,
    showingSpamFailNotification: false,
    
    
    
    /**
     * Called by page to load JS
     */
    initialize: function() {
        this.loaded();
    },
    /**
     * Binds events for page changes so that we can run our code before/after they show
     */
    loaded: function() {
        var me = this;
        $.mobile.loader.prototype.options.text = 'Loading...';
        $.mobile.defaultPageTransition = 'slide';
        $('[data-role="page"]').live('pageshow', function() {me.globalPageShow.call(me);});
        $('[data-role="page"]').live('pagebeforeshow', function() {me.globalPage.call(me);});
        $('#login').live('pagebeforeshow', function() {me.loginPage.call(me);});
        $('#verification').live('pagebeforeshow', function() {me.verificationPage.call(me);});
        $('#terms').live('pagebeforeshow', function() {me.termsPage.call(me);});
        $('#scheduled').live('pagebeforeshow', function() {me.scheduledPage.call(me);});
        $('#history').live('pagebeforeshow', function() {me.historyPage.call(me);});
        $('#schedule-options').live('pagebeforeshow', function() {me.scheduleOptionsPage.call(me);});
        $('#message-repeats').live('pagebeforeshow', function() {me.messageRepeatsPage.call(me);});
        $('#view').live('pagebeforeshow', function() {me.viewPage.call(me);});
        $('#status-dialog').live('pagebeforeshow', function() {me.statusDialogPage.call(me);});
        $('#purchase').live('pagebeforeshow', function() {me.purchasePage.call(me);});
        $('#settings').live('pagebeforeshow', function() {me.settingsPage.call(me);});
        $('#account').live('pagebeforeshow', function() {me.accountPage.call(me);});
        $('#messagecredits').live('pagebeforeshow', function() {me.messageCreditsPage.call(me);});
        $('#groups').live('pagebeforeshow', function() {me.groupsPage.call(me);});
        $('#newgroup').live('pagebeforeshow', function() {me.newGroupPage.call(me);});
        $('#splash').live('pageshow', function() {me.splashPageShow.call(me);});
        $('#scheduled').live('pageshow', function() {me.scheduledPageShow.call(me);});
        $('#history').live('pageshow', function() {me.historyPageShow.call(me);});
        
        $.ajaxSetup({
            timeout: 20000
        });
        me.doBinds.call(me);
        me.loadCountries.call(me);
        $('body').show();
    },
    
    
    
    /**
     * Loads the available countries and sets the select list options
     */
    loadCountries: function() {
        var me = this;
        $.ajax({
            url: me.protocol+me.url+'/users/countries',
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#forgotten-country option, #login-country option, #register-country option').remove();
                    var i = 0;
                    $.each(resp.data, function(row) {
                       $('#forgotten-country, #login-country, #register-country').append('<option value="'+row+'"'+(i++ < 1 ? ' selected="selected"' : '')+'>'+resp.data[row]+'</option>') 
                    });
                    try {
                        $('#forgotten-country, #login-country, #register-country').selectmenu('refresh');
                    } catch (e) { }
                    $('#login-country').trigger('change');
                } else {
                    me.ajaxAlert($.mobile.activePage.attr('id'));
                }
            },
            error: function() {
                me.ajaxAlert($.mobile.activePage.attr('id'));
            }
        });
    },
    /**
     * Binds user input events (i.e. click, keypres, etc.)
     */
    doBinds: function() {
        var me = this;
        
        /**
         * Opens external links in iOS Safari
         */
        $('a.external-link').live('click', function(e) {
            e.preventDefault();
            window.open($(e.currentTarget).attr('href'), '_system');
        });
        
        /**
         * Binds main nav buttons - scheduled, history, groups
         */
        $('.schedule-link, .history-link, .groups-link').live('click', function() {
            var left = false;
            var nextPg = '';
            switch ($.mobile.activePage.attr('id')) {
                case 'scheduled':
                    if ($(this).hasClass('history-link')) {
                        nextPg = 'history';
                    } else if ($(this).hasClass('groups-link')) {
                        nextPg = 'groups';
                    }
                    break;
                    
                case 'history':
                    if ($(this).hasClass('schedule-link')) {
                        left = true;
                        nextPg = 'scheduled';
                    } else if ($(this).hasClass('groups-link')) {
                        nextPg = 'groups';
                    }
                    break;
                    
                case 'groups':
                    left = true;
                    if ($(this).hasClass('schedule-link')) {
                        nextPg = 'scheduled';
                    } else if ($(this).hasClass('history-link')) {
                        nextPg = 'history';
                    }
                    break;
            }
            if (nextPg.length > 0) $.mobile.changePage('#'+nextPg, {reverse: left});
        });
        
        /**
         * Binds purchase link
         */
        $('.purchase-link').live('click', function() {
            me.lastPageBeforePurchase = $.mobile.activePage.attr('id');
            $.mobile.changePage('#purchase');
        });
        
        /**
         * Binds settings account link
         */
        $('#settings-account-link').live('click', function() {
            $.mobile.changePage('#account');
        });
        /**
         * Binds settings help link
         */
        $('#settings-help-link').live('click', function() {
            $.mobile.changePage('#help');
        });
        
        /**
         * Submits user entered data when enter/return (in desktop) or done (in iOS) is pressed
         */
        $('input').live('keyup', function(e) {
            var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
            if (key == 13) {
                e.preventDefault();
                var currPg = $.mobile.activePage.attr('id');
                switch (currPg) {
                    case 'login':
                        $('#login-submit-button').trigger('click');
                        break;
                    case 'register':
                        $('#register-submit-button').trigger('click');
                        break;
                    case 'forgotten':
                        $('#forgotten-submit-button').trigger('click');
                        break;
                    case 'verification':
                        $('#verification-submit-button').trigger('click');
                        break;
                    case 'new':
                        var saveEl = $('#new .save:visible');
                        if (saveEl.length < 1) saveEl = $('#new-submit-button');
                        saveEl.trigger('click');
                        break;
                    case 'message-name':
                        $('#message-name .back').trigger('click');
                        break;
                    case 'newgroup':
                        $('#newgroup .save').trigger('click');
                        break;
                    case 'addcontactfromnumber':
                        $('#addcontactfromnumber .save').trigger('click');
                        break;
                }
            }
        });
        
        /**
         * Remove default textarea auto grow behaviour and activate third party plugin
         */
        $('textarea').off('keyup').autoGrowTextArea();


        /**
        Binds below make sure that the textarea is default size when page is clicked - previous text/autogrow may have made wrong height

        * Makes sure textarea is at correct height for compose sms
        */

        $('.new-link').live('click', function() {
            $('#new-content').height(28);
        });

        /**
        * Makes sure textarea is at correct height for remind me
        */

        $('.reminder-link').live('click', function() {
            $('#new-content').height(28);
        });
        
        /**
        * Makes sure textarea is at correct height for accessing scheduled message
        */

        $('.edit-message').live('click', function() {
            $('#new-content').height(250);
        });
        


        /**
         * Bind settings link
         */
        $('.settings').live('click', function() {
            $.mobile.changePage('#settings');
        });
        
        /**
         * Binds terms link
         */
        $('.terms').live('click', function() {
            me.lastPageBeforeTerms = $.mobile.activePage.attr('id');
            $.mobile.changePage('#terms');
        });
        
        /**
         * Bind product purchase button
         */
        $('.product-btn').live('click', function() {
            var id = $(this).attr('id').replace('product-btn-', '');
            console.log(id);
        });
        
        /**
         * Bind change event on login and forgotten page country selects. Retrieves and stores exit code for selected country (used for later API calls)
         */
        $('#login-country, #forgotten-country').live('change', function() {
            if (!me.stopCountryChange) {
                $.ajax({
                    url: me.protocol+me.url+'/users/getExitCode/'+$(this).find('option:selected').val(),
                    type: 'GET',
                    beforeSend: function() {
                        me.loadingTimers.push(setTimeout(function() {
                            $.mobile.loading('show');
                        }, 1000));
                    },
                    complete: function() {
                        me.clearTimeouts();
                        $.mobile.loading('hide');
                    },
                    success: function(resp) {
                        resp = JSON.parse(resp);
                        if (resp.status == 'OK') {
                            me.userExitCode = resp.data;
                        } else {
                            me.ajaxAlert($.mobile.activePage.attr('id'));
                        }
                    },
                    error: function() {
                        me.ajaxAlert($.mobile.activePage.attr('id'));
                    }
                });
            }
        });
        
        /**
         * Bind message credits button
         */
        $('.messagecredits-button').live('click', function() {
            me.lastPageBeforeMessageCredits = $.mobile.activePage.attr('id');
            $.mobile.changePage('#messagecredits');
        });
        
        /**
         * Bind login submit button
         */
        $('#login-submit-button').live('click', function(){
            var country = $('#login-country').val();
            var phoneNumber = $('#login-phone_number').val();
            var password = $('#login-password').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = me.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            $('#login-phone_number').val(phoneNumber);
            $.ajax({
                url: me.protocol+me.url+'/users/login',
                type: 'POST',
                data: 'country='+country+'&phone_number='+phoneNumber+'&password='+password,
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        me.fullPhoneNumber = resp.data['phone_number'];
                        me.userExitCode = resp.data['exit_code'];
                        me.phoneNumber = phoneNumber;
                        me.country = country;
                        me.password = password;
                        $.cookie('logins', JSON.stringify({
                            'country': me.country,
                            'phone_number': me.phoneNumber,
                            'password': me.password
                        }), { expires: 7300 });
                        $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
                        $.mobile.changePage('#scheduled');
                    } else {
                        me.ajaxAlert('login', 'Your login details are wrong - please review.');
                    }
                },
                error: function() {
                    me.ajaxAlert('login');
                }
            });
        });
        
        /**
         * Bind register submit button
         */
        $('#register-submit-button').live('click', function(){
            var country = $('#register-country').val();
            var phoneNumber = $('#register-phone_number').val();
            var password = $('#register-password').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                phoneNumber = me.userExitCode + phoneNumber;
            } else {
                phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            }
            $('#register-phone_number').val(phoneNumber);
            $.ajax({
                url: me.protocol+me.url+'/users/register',
                type: 'POST',
                data: 'country='+country+'&phone_number='+phoneNumber+'&password='+password,
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        me.country = country;
                        me.phoneNumber = phoneNumber;
                        me.password = password;
                        me.verificationType = 'register';
                        me.fullPhoneNumber = resp.data['phone_number'];
                        me.userExitCode = resp.data['exit_code'];
                        $.cookie('logins', JSON.stringify({
                            'country': me.country,
                            'phone_number': me.phoneNumber,
                            'password': me.password
                        }));
                        $.mobile.changePage('#verification');
                    } else {
                        me.ajaxAlert('register', 'Your registration details are incorrect. If you are having difficulty registering take a look at the <a href="http://autotext.co/support" rel="external" target="_blank">FAQ</a>.');
                    }
                },
                error: function() {
                    me.ajaxAlert('register');
                }
            });
        });
        
        /**
         * Bind forgotten submit button to call forgottenSubmit function
         */
        $('#forgotten-submit-button').live('click', function() {me.forgottenSubmit.call(me);});
        
        /**
         * Bind verification page invalid number format link
         */
        $('#verification-invalid-format').live('click', function() {
            $.ajax({
                url: me.protocol+me.url+'/users/formatting',
                type: 'POST',
                data: 'country='+me.country+'&phone_number='+me.phoneNumber,
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    $('#verification form').css('bottom', 0);
                    me.ajaxAlert('verification', 'Thanks - we\'ll look in to it right away.');
                },
                error: function() {
                    me.ajaxAlert('verification');
                }
            });
        });
        
        /**
         * Bind verification submit button
         */
        $('#verification-submit-button').live('click', function(){
            var verificationCode = $('#verification-pin').val();
            var dataStr = 'country='+me.country+'&phone_number='+me.phoneNumber+'&pin='+verificationCode;
            var password = '';
            if (me.verificationType == 'forgotten') {
                password = $('#verification-password').val();
                dataStr += '&password='+password;
            }
            $.ajax({
                url: me.protocol+me.url+'/users/verify/'+me.verificationType,
                type: 'POST',
                data: dataStr,
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        if (me.verificationType == 'forgotten') {
                            me.ajaxAlert('verification', 'Thanks - your password has been reset.', 'login');
                        } else {
                            $.ajax({
                                url: me.protocol+me.url+'/users/login',
                                type: 'POST',
                                data: 'country='+me.country+'&phone_number='+me.phoneNumber+'&password='+me.password,
                                beforeSend: function() {
                                    me.loadingTimers.push(setTimeout(function() {
                                        $.mobile.loading('show');
                                    }, 1000));
                                },
                                complete: function() {
                                    me.clearTimeouts();
                                    $.mobile.loading('hide');
                                },
                                success: function(resp) {
                                    resp = JSON.parse(resp);
                                    if (resp.status == 'OK') {
                                        me.fullPhoneNumber = resp.data['phone_number'];
                                        me.userExitCode = resp.data['exit_code'];
                                        $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
                                        $.mobile.changePage('#scheduled');
                                    } else {
                                        me.ajaxAlert('verification');
                                    }
                                },
                                error: function() {
                                    me.ajaxAlert('verification');
                                }
                            });
                        }
                    } else {
                        if (me.verificationType == 'forgotten') {
                            me.ajaxAlert('verification', 'We think there might be an error with the verification code or password that you\'ve entered - please review.');
                        } else {
                            me.ajaxAlert('verification', 'We think there might be an error with the verification code that you\'ve entered - please review.');
                        }
                    }
                },
                error: function() {
                    me.ajaxAlert('verification');
                }
            });
        });
        
        /**
         * Bind scheduled page message row link
         */
        $('#scheduled-message-list a.edit-message').live('click', function(e) {
            e.preventDefault();
            if ($('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            } else {
                me.dataSingle = (me.draftDeleteType == 'single');
                me.repeats = typeof $(this).parents('li').attr('data-repeats') != 'undefined';
                me.editing = true;
                me.draftEdit = typeof $(this).parents('li').attr('data-draft') == 'string';
                me.unsyncEdit = typeof $(this).parents('li').attr('data-unsynced') == 'string';
                me.newPageResetFields();
                var smsId = me.dataId = $(this).parents('li').attr('data-id');
                var scheduleId = me.dataScheduleId = $(this).parents('li').attr('data-schedule-id');
                
                if (me.draftEdit) {
                    me.draftId = $(this).parents('li').attr('data-draft');
                } else {
                    me.draftId = me.generateUUID();
                }
                $('#new .edit-id').val(smsId+'&'+scheduleId);
                me.lastPageBeforeNew = $.mobile.activePage.attr('id');
                $.mobile.changePage('#new', {transition: 'slideup'});
            }
        });
        /**
         * Bind delete repeated message confirmation cancel button
         */
        $('#delete-repeats-confirm .cancel').live('click', function() {
            $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                $(this).parents('.delete-btn-container').remove();
            });
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        /**
         * Bind delete repeated message confirmation all messages button
         */
        $('#delete-repeats-confirm .all').live('click', function() {
            $.fn.swipeDeleteType = 'all';
            $.fn.swipeDoDelete.call(me);
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        /**
         * Bind delete repeated message confirmation single message button
         */
        $('#delete-repeats-confirm .single').live('click', function() {
            $.fn.swipeDeleteType = 'single';
            $.fn.swipeDoDelete.call(me);
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').hide();
        });
        $('#delete-to-draft-repeats-confirm .cancel').live('click', function() {
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        /**
         * Bind delete to draft repeated message confirmation all messages button
         */
        $('#delete-to-draft-repeats-confirm .all').live('click', function() {
            me.draftDeleteType = 'all';
            me.doDraftDelete.call(me);
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        /**
         * Bind delete to draft repeated message confirmation single message button
         */
        $('#delete-to-draft-repeats-confirm .single').live('click', function() {
            me.draftDeleteType = 'single';
            me.doDraftDelete.call(me);
            $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').hide();
        });
        
        /**
         * Bind history page message row link
         */
        $('#history-message-list a.view-message').live('click', function(e) {
            e.preventDefault();
            me.viewing = true;
            me.newPageResetFields();
            var smsId = $(this).parents('li').attr('data-id');
            var scheduleId = $(this).parents('li').attr('data-schedule-id');
            $('#new .edit-id').val(smsId+'&'+scheduleId);
            me.lastPageBeforeNew = $.mobile.activePage.attr('id');
            $.mobile.changePage('#new', {transition: 'slideup'});
        });
        
        /**
         * Bind message edit page save button
         */
        $('#new .save').live('click', function() {
            if ($(this).hasClass('cancel-state')) {
                $.mobile.changePage('#'+me.lastPageBeforeNew, {reverse: true, transition:'slideup'});
            } else {
                var data = {
                    'recipient': $('#new-recipient').val(),
                    'content': $('#new-content').val(),
                    'reminder': me.reminding ? '1' : '0',
                    'part': 'recipient_content'
                };
                $.extend(me.newData, data);
                $.extend(me.editData, data);
                me.saveNew.call(me);
            }
        });
        /**
         * Bind message recipient and content fields to enable/disable submit/save buttons. Also saves draft
         */
        $('#new-recipient, #new-content').live('keyup', function() {
            var anyEmpty = false;
            $('#new-recipient, #new-content').each(function() {
                if ($(this).val().length < 1) anyEmpty = true;
            });
            
            if (!anyEmpty) {
                $('#new-submit-button').removeClass('ui-disabled');
            } else {
                $('#new-submit-button').addClass('ui-disabled');
            }
            
            if (me.editing && $('#new .save').text() != 'Save' && !me.stopDraftAddEdit) {
                $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
            }
            
            if (!me.stopDraftAddEdit && (me.draftId == null || me.newDraft)) {
                me.draftId = me.generateUUID();
                me.newDraft = false;
            }
            if (!me.stopDraftAddEdit) {
                me.updateDrafts('view', me.draftId);
                me.updateDrafts('edit', me.draftId);
            } else {
                me.stopDraftAddEdit = false;
            }
        });
        /**
         * Bind message name and content fields to change page title
         */
        $('#new-name, #new-content').live('keyup', function() {
            if (!me.reminding) {
                var title = $('#new-name').val();
                if (title.length > 0) title += ' - ';
                title += $('#new-content').val();

                if (title.length < 1 && !me.editing) {
                    title = 'New Message';
                } else if (title.length < 1) {
                    title = 'Edit Message';
                }
                $('#new .page-title').text(title);
            }
        });
        /**
         * Bind new message submit button
         */
        $('#new-submit-button').live('click', function(e) {
            if (!me.viewing) {
                var phoneNumbers = $('#new-recipient').val();
                if (phoneNumbers.length > 0) {
                    var tmp = [];
                    var dataSplit = phoneNumbers.split(',');
                    $.each(dataSplit, function(i) {
                        var phoneNumber = dataSplit[i];
                        if (phoneNumber.substr(0, 1) == '+') {
                            phoneNumber = me.userExitCode + phoneNumber.substr(1);
                        }
                        tmp.push(phoneNumber.replace(/[^0-9]/g, ''));
                    });
                    phoneNumbers = tmp.join(',');
                    $('#new-recipient').val(phoneNumbers);
                }
                
                var data = {
                    'recipient': phoneNumbers,
                    'content': $('#new-content').val(),
                    'reminder': me.reminding ? '1' : '0',
                    'part': 'recipient_content'
                };
                $.extend(me.newData, data);
                $.extend(me.editData, data);
                
                if (!me.unsyncEdit) {
                    $.ajax({
                        url: me.protocol+me.url+'/sms/validates?u='+me.fullPhoneNumber+'&p='+me.password,
                        type: 'POST',
                        data: $.param(data),
                        beforeSend: function() {
                            me.loadingTimers.push(setTimeout(function() {
                                $.mobile.loading('show');
                            }, 1000));
                        },
                        complete: function() {
                            me.clearTimeouts();
                            $.mobile.loading('hide');
                        },
                        success: function(resp) {
                            resp = JSON.parse(resp);
                            if (resp.status == 'OK') {
                                $.mobile.changePage('#schedule-options');
                            } else {
                                var errTxt = 'Please ensure that you have entered your recipient(s) and message correctly then try again.';
                                if (me.reminding) errTxt = 'Please ensure that you have entered your message correctly then try again.';
                                me.ajaxAlert('new', errTxt);
                            }
                        },
                        error: function() {
                            me.saveAsUnsynced.call(me);
                            $.mobile.changePage('#schedule-options');
                        }
                    });
                } else {
                    $.mobile.changePage('#schedule-options');
                }
            } else {
                me.viewing = false;
                me.copying = true;
                $.mobile.changePage('#new', {
                    allowSamePageTransition: true,
                    transition: 'slideup'
                });
            }
        });
        
        /**
         * Bind message schedule options save button
         */
        $('#schedule-options .save').live('click', function() {
            if (!me.viewing) {
                if ($(this).hasClass('cancel-state')) {
                    $.mobile.changePage('#new', {reverse: true});
                } else {
                    var sendTime = $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() : new Date().getTime();
                    sendTime = sendTime / 1000;
                    var data = {
                        'time': sendTime
                    };
                    $.extend(me.newData, data);
                    $.extend(me.editData, data);
                    delete me.newData['part'];
                    delete me.editData['part'];

                    me.saveNew.call(me);
                }
            } else {
                $.mobile.changePage('#history');
            }
        });
        /**
         * Bind message schedule options back button
         */
        $('#schedule-options .back').live('click', function() {
            var sendTime = $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() : new Date().getTime();
            sendTime = sendTime / 1000;
            var data = {
                'time': sendTime
            };
            $.extend(me.newData, data);
            $.extend(me.editData, data);
            $.mobile.changePage('#new', {reverse: true});
        });
        /**
         * Bind message name link
         */
        $('#new-name-link').live('click', function() {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-name');
            }
        });
        /**
         * Bind message date link
         */
        $('#new-date-link').live('click', function() {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-date');
            }
        });
        /**
         * Bind repeat options link
         */
        $('#new-repeats-link').live('click', function() {
            if (!$(this).hasClass('link-disabled')) {
                $.mobile.changePage('#message-repeats');
            }
        });
        /**
         * Bind delete to draft button
         */
        $('#delete-to-draft-btn').live('click', function() {
            if (me.repeats) {
                $('#schedule-options .dialog-overlay, #delete-to-draft-repeats-confirm').show();
            } else {
                me.doDraftDelete(me);
            }
        });
        
        /**
         * Bind message date change to save draft
         */
        $('#new-date').live('change', function() {
            if ($('#new-date-text').text().length > 0) $('#new-date-text, #new-scheduled').text(moment($(this).val()).format('ddd, D MMM YYYY, hh:mm a'));
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
            
            if (!me.stopDraftAddEdit && me.draftId == null) {
                me.draftId = me.generateUUID();
            }
            if (!me.stopDraftAddEdit) {
                me.updateDrafts('view', me.draftId);
                me.updateDrafts('edit', me.draftId);
            }
        });
        
        /**
         * Bind message name page back button to save draft
         */
        $('#message-name .back').live('click', function(e) {
            e.preventDefault();
            if (!me.viewing) {
                var data = {
                    'name': $('#new-name').val(),
                    'part': 'name'
                };
                $.extend(me.newData, data);
                $.extend(me.editData, data);
                if (!me.unsyncEdit) {
                    $.ajax({
                        url: me.protocol+me.url+'/sms/validates?u='+me.fullPhoneNumber+'&p='+me.password,
                        type: 'POST',
                        data: $.param(data),
                        beforeSend: function() {
                            me.loadingTimers.push(setTimeout(function() {
                                $.mobile.loading('show');
                            }, 1000));
                        },
                        complete: function() {
                            me.clearTimeouts();
                            $.mobile.loading('hide');
                        },
                        success: function(resp) {
                            resp = JSON.parse(resp);
                            if (resp.status == 'OK') {
                                $.mobile.changePage('#schedule-options', {reverse: true});
                            } else {
                                me.ajaxAlert('message-name', 'Please ensure that you have entered a valid message name then try again.');
                            }
                        },
                        error: function() {
                            me.saveAsUnsynced.call(me);
                            $.mobile.changePage('#schedule-options', {reverse: true});
                        }
                    });
                } else {
                    $.mobile.changePage('#schedule-options', {reverse: true});
                }
            } else {
                $.mobile.changePage('#schedule-options', {reverse: true});
            }
        });
        /**
         * Bind message name field to save draft
         */
        $('#new-name').live('keyup', function() {
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
            
            if (!me.stopDraftAddEdit && me.draftId == null) {
                me.draftId = me.generateUUID();
            }
            me.updateDrafts('view', me.draftId);
            me.updateDrafts('edit', me.draftId);
        });
        /**
         * Bind edit repeating message confirmation single message button
         */
        $('.edit-repeats .single').live('click', function() {
            me.editType = 'single';
            $('.dialog-overlay, .edit-repeats').hide();
            me.newActualSave.call(me);
        });
        /**
         * Bind edit repeating message confirmation all messages button
         */
        $('.edit-repeats .all').live('click', function() {
            me.editType = 'all';
            $('.dialog-overlay, .edit-repeats').hide();
            me.newActualSave.call(me);
        });
        /**
         * Bind edit repeating message confirmation cancel button
         */
        $('.edit-repeats .cancel').live('click', function() {
            $('.dialog-overlay, .edit-repeats').hide();
        });
        
        /**
         * Bind message repeat options Weekly option to disable the Week Days Only option. Also saves draft
         */
        $('#message-repeats-w').live('change', function() {
            if (!me.stopDraftAddEdit && me.draftId == null) {
                me.draftId = me.generateUUID();
            }
            me.updateDrafts('view', me.draftId);
            me.updateDrafts('edit', me.draftId);
            
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
            $('#message-repeats-wd option').removeAttr('selected');
            $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
            $('#message-repeats-wd').slider('refresh').slider('disable');
        });
        /**
         * Bind all message repeat options other than Weekly option to enable the Week Days Only option. Also saves draft
         */
        $('#message-repeats-none, #message-repeats-d, #message-repeats-m, #message-repeats-y').live('change', function() {
            if (!me.stopDraftAddEdit && me.draftId == null) {
                me.draftId = me.generateUUID();
            }
            me.updateDrafts('view', me.draftId);
            me.updateDrafts('edit', me.draftId);
            
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
            $('#message-repeats-wd').slider('enable');
        });
        /**
         * Bind message repeat options Weekly Days Only option to save draft
         */
        $('#message-repeats-wd').live('change', function() {
            if (!me.stopDraftAddEdit && me.draftId == null) {
                me.draftId = me.generateUUID();
            }
            me.updateDrafts('view', me.draftId);
            me.updateDrafts('edit', me.draftId);
            
            $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
        });
        /**
         * Bind message repeat options back button
         */
        $('#message-repeats .back').live('click', function(e) {
            if (!me.viewing) {
                e.preventDefault();
                var value = $('input[name="message-repeats"]:checked').val().toUpperCase();
                var weekDays = $('#message-repeats-wd option:selected').val() == 'on';
                var repeat_options = {
                    'D':0,
                    'W':0,
                    'M':0,
                    'Y':0,
                    'WD':0
                };
                if (typeof repeat_options[value] != 'undefined') repeat_options[value] = 1;
                if (weekDays) repeat_options['WD'] = 1;

                var data = {
                    'repeat_options': JSON.stringify(repeat_options),
                    'part': 'repeat_options'
                };
                $.extend(me.newData, data);
                $.extend(me.editData, data);
                if (!me.unsyncEdit) {
                    $.ajax({
                        url: me.protocol+me.url+'/sms/validates?u='+me.fullPhoneNumber+'&p='+me.password,
                        type: 'POST',
                        data: $.param(data),
                        beforeSend: function() {
                            me.loadingTimers.push(setTimeout(function() {
                                $.mobile.loading('show');
                            }, 1000));
                        },
                        complete: function() {
                            me.clearTimeouts();
                            $.mobile.loading('hide');
                        },
                        success: function(resp) {
                            resp = JSON.parse(resp);
                            if (resp.status == 'OK') {
                                $.mobile.changePage('#schedule-options', {reverse: true});
                            } else {
                                me.ajaxAlert('message-repeats', 'Please ensure that you have entered valid repeat options then try again.');
                            }
                        },
                        error: function() {
                            me.saveAsUnsynced.call(me);
                            $.mobile.changePage('#schedule-options', {reverse: true});
                        }
                    });
                } else {
                    $.mobile.changePage('#schedule-options', {reverse: true});
                }
            } else {
                $.mobile.changePage('#schedule-options', {reverse: true});
            }
        });

        /**
         * Bind message date options back button
         */
        $('#message-date .back').live('click', function() {
            $.mobile.changePage('#schedule-options', {reverse: true});
        });
        
        /**
         * Bind main nav new message button
         */
        $('.new-link').live('click', function(e) {
            e.preventDefault();
            me.editData = {};
            me.newPageResetFields();
            me.lastPageBeforeNew = $.mobile.activePage.attr('id');
            me.newDraft = true;
            $.mobile.changePage('#new', {transition: 'slideup'});
        });
        
        /**
         * Bind main nav reminder button
         */
        $('.reminder-link').live('click', function(e) {
            e.preventDefault();
            me.reminding = true;
            me.newPageResetFields();
            me.lastPageBeforeNew = $.mobile.activePage.attr('id');
            $.mobile.changePage('#new', {transition: 'slideup'});
        });
        
        /**
         * Bind main nav groups button
         */
        $('#groups .new').live('click', function() {
            $('#newgroup').removeClass('just-loaded');
            $.mobile.changePage('#newgroup');
        });
        /**
         * Bind groups page group row link
         */
        $('#groups-list .view-group').live('click', function(e) {
            e.preventDefault();
            if ($('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            } else {
                me.groupEditing = true;
                me.lastPageBeforeNew = 'groups';
                $('#newgroup .edit-id').val($(this).parents('li').attr('data-id'));
                $('#newgroup').removeClass('just-loaded');
                $.mobile.changePage('#newgroup');
            }
        });
        /**
         * Bind groups schedule buttons
         */
        $('#groups-list .view-group .groups-schedule-link').live('click', function(e) {
            var id = $(this).parents('li').attr('data-id');
            $.ajax({
                url: me.protocol+me.url+'/groups/view/'+id+'?u='+me.fullPhoneNumber+'&p='+me.password,
                type: 'GET',
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        var tmp = [];
                        $.each(resp.data['GroupContact'], function(contact) {
                            var data = resp.data['GroupContact'][contact];
                            tmp.push(data.phone_number_user);
                        });
                        me.editData = {};
                        me.newPageResetFields();
                        me.lastPageBeforeNew = 'groups';
                        me.newDraft = true;
                        $('#new-recipient').val(tmp.join(','));
                        $.mobile.changePage('#new', {transition:'slideup'});
                    } else {
                        me.ajaxAlert('groups');
                    }
                },
                error: function() {
                    me.ajaxAlert('groups');
                }
            });
            return false;
        });
        /**
         * Bind group contacts list to hide delete buttons if any are shown
         */
        $('#newgroup-contacts-list li').live('click', function() {
            var $li = $(this);
            if ($('.aSwipeBtn').css('overflow') == 'visible' && $('.aSwipeBtn').length > 0) {
                $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                    $li.find('.ui-li-heading').css('max-width', '50%');
                    $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                    $(this).parents('.delete-btn-container').remove();
                });
            }
        });
        
        /**
         * Bind settings page reset password link
         */
        $('#settings .reset-password-link').live('click', function() {
            $('#settings .dialog-overlay, #reset-password-confirm').show();
        });
        /**
         * Bind reset password confirmation ok button
         */
        $('#reset-password-confirm .ok').live('click', function() {
            $.removeCookie('logins');
            $('#forgotten-country option').removeAttr('selected');
            $('#forgotten-country option[value="'+me.country+'"]').attr('selected', 'selected');
            $('#forgotten-phone_number').val(me.phoneNumber);
            $('#settings .dialog-overlay, #reset-password-confirm').hide();
            me.forgottenSubmit.call(me);
        });
        /**
         * Bind reset password confirmation cancel button
         */
        $('#reset-password-confirm .cancel').live('click', function() {
            $('#settings .dialog-overlay, #reset-password-confirm').hide();
        });
        
        /**
         * Bind settings page logout link
         */
        $('#settings .logout-link').live('click', function() {
            $('#settings .dialog-overlay, #logout-confirm').show();
        });
        /**
         * Bind logout confirmation ok button
         */
        $('#logout-confirm .ok').live('click', function() {
            $.removeCookie('logins');
            $.removeCookie('noCreditShown');
            $('#login-country option:selected').removeAttr('selected');
            $('#login-country option:first').attr('selected', 'selected');
            try {
                $('#login-country').selectmenu('refresh');
            } catch (e) { }
            $('#login-phone_number, #login-password').val('');
            $('#settings .dialog-overlay, #logout-confirm').hide();
            $('.ui-page, .ui-mobile-viewport').removeClass('ui-page-bg-light');
            $.mobile.changePage('#login');
        });
        /**
         * Bind logout confirmation cancel button
         */
        $('#logout-confirm .cancel').live('click', function() {
            $('#settings .dialog-overlay, #logout-confirm').hide();
        });
        
        /**
         * Bind schedule options link
         */
        $('#edit-schedule-options-link').live('click', function() {
            var data = {
                'recipient': $('#new-recipient').val(),
                'content': $('#new-content').val(),
                'reminder': me.reminding ? '1' : '0'
            };
            $.extend(me.newData, data);
            $.extend(me.editData, data);
            $.mobile.changePage('#schedule-options');
        });
        
        /**
         * Bind group save button
         */
        $('#newgroup .save').live('click', function() {
            me.groupData['name'] = $('#newgroup-name').val();
            $.ajax({
                url: me.protocol+me.url+'/groups/'+(!me.groupEditing ? 'add' : 'edit/'+$('#newgroup .edit-id').val())+'?u='+me.fullPhoneNumber+'&p='+me.password,
                type: 'POST',
                data: $.param(me.groupData),
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        $.mobile.changePage('#groups', {reverse: true});
                    } else {
                        me.ajaxAlert('newgroup', 'Please ensure that you have entered your group\'s name correctly then try again.');
                    }
                },
                error: function() {
                    me.ajaxAlert('newgroup');
                }
            });
        });
        
        /**
         * Bind groups page add from contact button
         */
        $('.add-from-contact').live('click', function() {
            if (typeof navigator.contacts != 'undefined') {
                navigator.contacts.chooseContact(function(id, data) {
                    console.log(data);
                }, {
                    fields: ['name.formatted', 'phoneNumbers']
                });
            }
        });
        /**
         * Bind groups page add number button
         */
        $('#add-from-number').live('click', function() {
            me.groupData['name'] = $('#newgroup-name').val();
            $.mobile.changePage('#addcontactfromnumber');
        });
        /**
         * Bind groups page add number save button
         */
        $('#addcontactfromnumber .save').live('click', function() {
            var phoneNumber = $('#addcontactfromnumber-number').val();
            if (phoneNumber.substr(0, 1) == '+') {
                phoneNumber = me.userExitCode + phoneNumber.substr(1);
            }
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
            $('#addcontactfromnumber-number').val(phoneNumber);
            
            var data = {
                'name': $('#addcontactfromnumber-name').val(),
                'phone_number': phoneNumber,
                'part': 'contact'
            };
            $.ajax({
                url: me.protocol+me.url+'/groups/validates?u='+me.fullPhoneNumber+'&p='+me.password,
                type: 'POST',
                data: $.param(data),
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        data['phone_number_user'] = data['phone_number'];
                        me.groupData['contacts'].push(data);
                        me.updateNewGroupPage.call(me);
                        $('#addcontactfromnumber-name, #addcontactfromnumber-number').val('');
                        $.mobile.changePage('#newgroup', {reverse: true});
                    } else {
                        me.ajaxAlert('addcontactfromnumber', 'Please ensure that you have entered your contact\'s name and phone number correctly then try again.');
                    }
                },
                error: function() {
                    me.ajaxAlert('addcontactfromnumber');
                }
            });
        });
        
        /**
         * Bind back buttons throughout app
         */
        $('#new .back, #register .back, #forgotten .back, #verification .back, #terms .back, #status-dialog .back, #purchase .back, #settings .back, #account .back, #help .back, #help-1 .back, #help-2 .back, #help-3 .back, #help-4 .back, #help-5 .back, #help-6 .back, #help-7 .back, #messagecredits .back, #newgroup .back, #addcontactfromnumber .back').live('click', function() {
            var currId = $.mobile.activePage.attr('id');
            var prevId = '';
            var prevTransition = $.mobile.defaultPageTransition;
            switch (currId) {
                case 'new':
                    prevId = me.lastPageBeforeNew; // scheduled, history or groups
                    prevTransition = 'slideup';
                    break;
                case 'register':
                    prevId = 'login';
                    break;
                case 'forgotten':
                    prevId = 'login';
                    break;
                case 'verification':
                    prevId = me.verificationType; // register or forgotten
                    break;
                case 'terms':
                    prevId = me.lastPageBeforeTerms; // verification, help or status-dialog
                    break;
                case 'status-dialog':
                    prevId = 'new';
                    break;
                case 'purchase':
                    prevId = me.lastPageBeforePurchase; // account or status-dialog
                    break;
                case 'settings':
                    prevId = me.lastPageBeforeSettings; // scheduled or history
                    break;
                case 'account':
                    prevId = 'settings';
                    break;
                case 'help':
                    prevId = 'settings';
                    break;
                case 'help-1':
                    prevId = 'help'
                    break;
                case 'help-2':
                    prevId = 'help-1'
                    break;
                case 'help-3':
                    prevId = 'help-2'
                    break;
                case 'help-4':
                    prevId = 'help-3'
                    break;
                case 'help-5':
                    prevId = 'help-4'
                    break;
                case 'help-6':
                    prevId = 'help-5'
                    break;
                case 'help-7':
                    prevId = 'help-6'
                    break;
                case 'messagecredits':
                    prevId = me.lastPageBeforeMessageCredits; // help, new or purchase
                    break;
                case 'newgroup':
                    prevId = 'groups';
                    break;
                case 'addcontactfromnumber':
                    prevId = 'newgroup';
                    break;
                default:
                    me.ajaxAlert(currId);
                    break;
            }
            if (prevId.length > 0) {
                $.mobile.changePage('#'+prevId, {reverse: true, transition: prevTransition});
            }
        });
    },
    /**
     * Show edit repeating message confirmation if necessary and then call newActualSave function
     */
    saveNew: function() {
        var me = this;
        
        if (typeof me.oldEditData.repeat_options != 'undefined') {
            var repeats = JSON.parse(me.oldEditData.repeat_options);
            if (me.editing && !me.draftEdit && (repeats.D == 1 || repeats.W == 1 || repeats.M == 1 || repeats.Y == 1)) {
                var currPg = '#'+$.mobile.activePage.attr('id');
                $(currPg+' .dialog-overlay, '+currPg+' .edit-repeats').show();
            } else {
                me.newActualSave.call(me);
            }
        } else {
            me.newActualSave.call(me);
        }
    },
    /**
     * Schedule/edit message
     */
    newActualSave: function() {
        var me = this;
        
        me.loadingTimers.push(setTimeout(function() {
            me.doProgressBar();
        }, 1000));
        
        var tmp = $('#new .edit-id').val().split('&');
        
        if (me.editType == 'single') {
            me.editData.oldSchedule = tmp[1];
            me.editData.repeat_options = JSON.stringify({
                'D': 0,
                'W': 0,
                'M': 0,
                'Y': 0,
                'WD': 0
            });
            delete me.editData.id;
        }
        
        if (me.draftEdit) {
            delete me.editData['id'];
            delete me.editData['is_draft'];
            delete me.editData['recipient_user'];
            delete me.editData['part'];
        }
        
        if (me.editing && me.editData['time'] == undefined) {
            me.editData['time'] = new Date($('#new-date').val()).getTime() / 1000;
        }
        
        if (me.draftEdit) {
            var draftData = me.updateDrafts('view', me.draftId);
            var realId = draftData.Sms['real_id'];
            if (realId != undefined && realId.length > 0) {
                tmp = realId.split('&');
            }
        }
        
        var data = me.editing ? me.editData : me.newData;
        if (data.recipient.length > 0) {
            var tmp = [];
            var dataSplit = data.recipient.split(',');
            $.each(dataSplit, function(i) {
                var phoneNumber = dataSplit[i];
                if (phoneNumber.substr(0, 1) == '+') {
                    phoneNumber = me.userExitCode + phoneNumber.substr(1);
                }
                tmp.push(phoneNumber.replace(/[^0-9]/g, ''));
            });
            data.recipient = tmp.join(',');
            $('#new-recipient').val(data.recipient);
        }
        
        if (!me.unsyncEdit) {
            if (me.editing && me.editData.schedule_time != undefined) {
                me.editData.time = me.editData.schedule_time;
            }
            
            $.ajax({
                url: me.protocol+me.url+'/sms/'+(me.editing && me.editType != 'single' ? 'edit/'+tmp[0] : 'schedule')+'?u='+me.fullPhoneNumber+'&p='+me.password,
                type: 'POST',
                data: $.param(me.editing ? me.editData : me.newData),
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $('#'+$.mobile.activePage.attr('id')+' .progressbar').progressbar({
                        value: parseInt($('#'+$.mobile.activePage.attr('id')+' .progressbar').attr('max-value'))
                    });
                    $('#new h1 .progressbar-status, #new h1 .progressbar, #schedule-options h1 .progressbar-status, #schedule-options h1 .progressbar').remove();
                    $('#new h1 .page-title, #schedule-options h1 .page-title').show();
                    $('#new h1, #schedule-options h1').append('<span class="progressbar-status">Scheduling...</span><span class="progressbar"></span>');
                    TolitoProgressBar('#new h1 .progressbar, #schedule-options h1 .progressbar')
                        .isMini(true)
                        .showCounter(false)
                        .setInterval(20)
                        .setMax(125)
                        .setOuterTheme('b')
                        .setInnerTheme('c')
                        .build();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    $('#'+$.mobile.activePage.attr('id')+' .progressbar-status').text('Saved!')
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        me.justSetSpam = (resp.data == '1');
                        
                        if (me.draftEdit && me.draftId.length > 0) {
                            me.updateDrafts('delete', me.draftId);
                        }
                        $('#new h1').css('overflow', 'hidden');
                        $.mobile.changePage('#scheduled');
                    } else {
                        var errTxt = resp.data[0][0];
                        me.ajaxAlert($.mobile.activePage.attr('id'), errTxt);
                    }
                },
                error: function() {
                    me.saveAsUnsynced.call(me);
                    $.mobile.changePage('#scheduled');
                }
            });
        } else {
            $.mobile.changePage('#scheduled');
        }
    },
    /**
     * Submit forgotten page fields
     */
    forgottenSubmit: function() {
        var me = this;
        
        var country = $('#forgotten-country').val();
        var phoneNumber = $('#forgotten-phone_number').val();
        if (phoneNumber.substr(0, 1) == '+') {
            phoneNumber = me.userExitCode + phoneNumber.substr(1);
        }
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        $('#forgotten-phone_number').val(phoneNumber);
        $.ajax({
            url: me.protocol+me.url+'/users/forgotten',
            type: 'POST',
            data: 'country='+country+'&phone_number='+phoneNumber,
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    me.country = country;
                    me.phoneNumber = phoneNumber;
                    me.verificationType = 'forgotten';
                    $.mobile.changePage('#verification');
                } else {
                    me.ajaxAlert('forgotten', 'We couldn\'t find your phone number - please review.');
                }
            },
            error: function() {
                me.ajaxAlert('forgotten');
            }
        });
    },
    /**
     * Refresh scheduled/history page message lists every 60 seconds
     */
    refreshList: function(pageId) {
        var me = this;
        setTimeout(function() {
            if ($.mobile.activePage.attr('id') == pageId) {
                me[pageId+'Page'].call(me);
                me.refreshList(pageId);
            }
        }, 60000);
    },
    /**
     * Load content for message credits cost page
     */
    messageCreditsPage: function() {
        var me = this;
        $('#messagecredits .ui-input-search .ui-input-text').val('');
        $.ajax({
            url: me.protocol+me.url+'/users/getInternationalCredits?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#messagecredits-list li').remove();
                    $.each(resp.data, function (row) {
                        var currData = resp.data[row];
                        var newRow = $('<li></li>');
                        newRow.html('<div class="country-name floatL">'+currData.name+'</div><div class="account-creds ui-li-desc">'+currData.credits+'</div>');
                        $('#messagecredits-list').append(newRow);
                        
                        if (row == me.country) {
                            $('#messagecredits-country_name').text(currData.name);
                            $('#messagecredits-credits').text(currData.credits);
                        }
                    });
                    $('#messagecredits-list').listview('refresh');
                } else {
                    me.ajaxAlert('messagecredits');
                }
            },
            error: function() {
                me.ajaxAlert('messagecredits');
            }
        });
    },
    /**
     * Load content for groups listing
     */
    groupsPage: function() {
        var me = this;
        me.groupEditing = false;
        $.ajax({
            url: me.protocol+me.url+'/groups/index?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#groups-list li').not('#groups-group-template').remove();
                    $.each(resp.data, function (row) {
                        var data = resp.data[row];
                        var newRow = $('#groups-group-template').clone();
                        newRow.find('.group-name').text(data.name);
                        newRow.find('.group-contacts').text(data.members);
                        newRow.attr('data-id', data.id);
                        newRow.removeAttr('id');
                        newRow.show();
                        $('#groups-list').append(newRow);
                    });
                    $('#groups-list').listview('refresh');
                    $('#groups-list li').swipeDelete({
                        click: function(e) {
                            me.groupDelete.call(me, e);
                        }
                    });
                } else {
                    me.ajaxAlert('groups');
                }
            },
            error: function() {
                me.ajaxAlert('groups');
            }
        });
        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .groups-link').addClass('ui-btn-active');
    },
    /**
     * Submit delete group request
     */
    groupDelete: function(e) {
        var me = this;
        e.preventDefault();
        
        var currentRow = $(e.currentTarget).parents('li');
        var id = currentRow.attr('data-id');

        $.ajax({
            url: me.protocol+me.url+'/groups/delete/'+id+'?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('div.aSwipeBtn, .' + $.fn.swipeOptions.btnClass).animate({ width: 'toggle' }, 200, function(e) {
                        $(this).parents('li').find('.ui-li-aside, .ui-icon-arrow-r').show();
                        $(this).parents('.delete-btn-container').remove();
                    });
                    currentRow.slideUp(400, function() {
                        me[$.mobile.activePage.attr('id')+'Page'].call(me);
                    });
                } else {
                    me.ajaxAlert('groups');
                }
            },
            error: function() {
                me.ajaxAlert('groups');
            }
        });
    },
    /**
     * Load content for new/edit group pages
     */
    newGroupPage: function() {
        var me = this;
        
        if (!$('#newgroup').hasClass('just-loaded')) {
            if (!me.groupEditing) {
                $('#newgroup-name, #addcontactfromnumber-name, #addcontactfromnumber-number').val('');
                me.groupData = {
                    'name': '',
                    'contacts': []
                };
                me.updateNewGroupPage.call(me);
            } else {
                $.ajax({
                    url: me.protocol+me.url+'/groups/view/'+$('#newgroup .edit-id').val()+'?u='+me.fullPhoneNumber+'&p='+me.password,
                    type: 'GET',
                    beforeSend: function() {
                        me.loadingTimers.push(setTimeout(function() {
                            $.mobile.loading('show');
                        }, 1000));
                    },
                    complete: function() {
                        me.clearTimeouts();
                        $.mobile.loading('hide');
                    },
                    success: function(resp) {
                        resp = JSON.parse(resp);
                        if (resp.status == 'OK') {
                            me.groupData = {
                                'name': resp.data['Group'].name,
                                'contacts': resp.data['GroupContact']
                            };
                            me.updateNewGroupPage.call(me);
                        } else {
                            me.ajaxAlert('newgroup');
                        }
                    },
                    error: function() {
                        me.ajaxAlert('newgroup');
                    }
                });
            }
            $('#newgroup').addClass('just-loaded');
        }
    },
    /**
     * Update edit group page fields with data
     */
    updateNewGroupPage: function() {
        var me = this;
        $('#newgroup-name').val(me.groupData['name']);
        
        $('#newgroup-total').text(me.groupData['contacts'].length);
        
        $('#newgroup-contacts-list li').not('#newgroup-contact-template').remove();
        $.each(me.groupData['contacts'], function(contact) {
            var data = me.groupData['contacts'][contact];
            var newRow = $('#newgroup-contact-template').clone();
            newRow.find('.contact-name').text(data.name);
            newRow.find('.contact-number').text(data.phone_number_user);
            newRow.removeAttr('id');
            newRow.show();
            $('#newgroup-contacts-list').append(newRow);
        });
        $('#newgroup-contacts-list').listview('refresh');
        $('#newgroup-contacts-list li').swipeDelete({
            click: function(e) {
                me.groupContactDelete.call(me, e);
            }
        });
    },
    /**
     * Submit delete group contact request
     */
    groupContactDelete: function(e) {
        var me = this;
        e.preventDefault();
        
        var currentRow = $(e.currentTarget).parents('li');
        currentRow.slideUp(400, function() {
            currentRow.remove();
            $('#newgroup-contacts-list').listview('refresh');
            me.groupData.contacts = [];
            $('#newgroup-contacts-list li:not("#newgroup-contact-template")').each(function() {
                me.groupData.contacts.push({
                    'name': $(this).find('.contact-name').text(),
                    'phone_number': $(this).find('.contact-number').text(),
                    'phone_number_user': $(this).find('.contact-number').text()
                });
            });
            $('#newgroup-total').text(me.groupData.contacts.length);
            
            if (me.groupEditing) {
                $.ajax({
                    url: me.protocol+me.url+'/groups/edit/'+$('#newgroup .edit-id').val()+'?u='+me.fullPhoneNumber+'&p='+me.password,
                    type: 'POST',
                    data: $.param(me.groupData),
                    beforeSend: function() {
                        me.loadingTimers.push(setTimeout(function() {
                            $.mobile.loading('show');
                        }, 1000));
                    },
                    complete: function() {
                        me.clearTimeouts();
                        $.mobile.loading('hide');
                    },
                    success: function(resp) {
                        resp = JSON.parse(resp);
                        if (resp.status != 'OK') {
                            me.ajaxAlert('newgroup');
                        }
                    },
                    error: function() {
                        me.ajaxAlert('newgroup');
                    }
                });
            }
        });
    },
    
    
    
    /**
     * Attempt to auto login during splash page
     */
    splashPageShow: function() {
        var me = this;
        me.clearTimeouts();
        var loginCookie = $.cookie('logins');
        var draftCookie = $.cookie('drafts');
        if (typeof draftCookie == 'undefined') {
            $.cookie('drafts', JSON.stringify([]),
                { expires: 7300 });
        }

        if (typeof loginCookie != 'undefined') {
            loginCookie = JSON.parse(loginCookie);
            $.ajax({
                url: me.protocol+me.url+'/users/login',
                type: 'POST',
                data: 'country='+loginCookie.country+'&phone_number='+loginCookie.phone_number+'&password='+loginCookie.password,
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        me.fullPhoneNumber = resp.data['phone_number']
                        me.userExitCode = resp.data['exit_code'];
                        me.phoneNumber = loginCookie.phone_number;
                        me.country = loginCookie.country;
                        me.password = loginCookie.password;
                        $('.ui-page, .ui-mobile-viewport').addClass('ui-page-bg-light');
                        $.mobile.changePage('#scheduled');
                    } else {
                        $.removeCookie('logins');
                        $.mobile.changePage('#login', {transition: 'fade'});
                    }
                },
                error: function() {
                    $.removeCookie('logins');
                    $.mobile.changePage('#login', {transition: 'fade'});
                }
            });
        } else {
            $.mobile.changePage('#login', {transition: 'fade'});
        }
    },
    /**
     * Show page content once it has fully loaded for the first time
     */
    globalPageShow: function() {
        var me = this;
        $('[data-role="page"] .ui-content').addClass('vHidden');
        $('#'+$.mobile.activePage.attr('id')+' .vHidden').removeClass('vHidden');
    },
    /**
     * Update page title and back button text. Also has code for message schedule options and new/edit message pages
     */
    globalPage: function() {
        var me = this;
        $('body').attr('id', $.mobile.activePage.attr('id')+'-body');
        
        var backTxt = 'Back';
        var headerTxt = '';
        $('h1').css('overflow', 'hidden');
        switch ($.mobile.activePage.attr('id')) {
            case 'schedule-options':
                backTxt = me.editData['content'];
                if (typeof me.editData['name'] != 'undefined' && me.editData['name'].length > 0) backTxt = me.editData['name']+' - '+backTxt;
                if (me.reminding) backTxt = 'RemindMe';
                
                headerTxt = '<span class="page-title">Schedule SMS</span><span class="progressbar-status">Scheduling...</span><span class="progressbar"></span>';
                
                if (me.editing) {
                    if (!$('.save').hasClass('cancel-state')) {
                        $('.save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
                    } else {
                        $('.save').addClass('cancel-state').find('.ui-btn-text').text('Cancel');
                    }
                    $('.save').show();
                } else {
                    $('.save').removeClass('cancel-state');
                }

                if (me.viewing) {
                    $('#new-name-link, #new-repeats-link').addClass('link-disabled');
                    $('.save').hide();
                } else {
                    $('#new-name-link, #new-repeats-link').removeClass('link-disabled');
                    $('.save').show();
                }
                break;
            
            case 'scheduled':
                headerTxt = 'Scheduled';
                break;
                
            case 'history':
                headerTxt = 'History';
                break;
                
            case 'groups':
                headerTxt = 'Groups';
                break;
            
            case 'register':
                backTxt = 'Login';
                headerTxt = 'Register';
                break;
            
            case 'forgotten':
                backTxt = 'Login';
                headerTxt = 'Reset Password';
                break;
            
            case 'newgroup':
                backTxt = 'Groups';
                headerTxt = 'Add Group';
                if (me.groupEditing) headerTxt = 'Edit Group';
                break;
            
            case 'message-name':
                backTxt = 'Schedule SMS';
                headerTxt = 'Message Name';
                break;

            case 'message-date':
                backTxt = 'Schedule SMS';
                headerTxt = 'Message Date';
                break;
            
            case 'message-repeats':
                backTxt = 'Schedule SMS';
                headerTxt = 'Repeats';
                break;
            
            case 'account':
                backTxt = 'Settings';
                headerTxt = 'Settings';
                break;
            
            case 'purchase':
                backTxt = 'Settings';
                if (me.lastPageBeforePurchase == 'status-dialog') backTxt = 'Message Status';
                headerTxt = 'Purchase';
                break;
            
            case 'help':
                backTxt = 'Settings';
                headerTxt = 'Help';
                break;
            
            case 'help-1':
                backTxt = 'Help';
                headerTxt = 'Welcome';
                break;
            
            case 'help-2':
                backTxt = 'Welcome';
                headerTxt = 'Scheduled';
                break;
            
            case 'help-3':
                backTxt = 'Scheduled';
                headerTxt = 'History';
                break;
            
            case 'help-4':
                backTxt = 'History';
                headerTxt = 'New Message';
                break;
            
            case 'help-5':
                backTxt = 'New Message';
                headerTxt = 'Contact Groups';
                break;
            
            case 'help-6':
                backTxt = 'Contact Groups';
                headerTxt = 'RemindMe';
                break;
            
            case 'help-7':
                backTxt = 'RemindMe';
                headerTxt = 'Close';
                break;
            
            case 'terms':
                backTxt = 'Help';
                if (me.lastPageBeforeTerms == 'verification')  {
                    backTxt = 'Input Verification Code';
                } else if (me.lastPageBeforeTerms == 'status-dialog') {
                    backTxt = 'Message Status';
                }
                headerTxt = 'Terms of Use';
                break;
                
            case 'verification':
                backTxt = 'Register';
                if (me.verificationType != 'register') backTxt = 'Reset Your Password'
                headerTxt = 'Verification';
                break;
                
            case 'status-dialog':
                backTxt = me.editData['content'];
                if (typeof me.editData['name'] != 'undefined' && me.editData['name'].length > 0) backTxt = me.editData['name']+' - '+backTxt;
                if (me.reminding) backTxt = 'RemindMe';
                headerTxt = 'Message Status';
                break;
                
            case 'settings':
                backTxt = 'Scheduled';
                if (me.lastPageBeforeSettings == 'history') backTxt = 'History';
                headerTxt = 'Settings';
                break;
                
            case 'new':
                backTxt = 'Scheduled';
                if (me.lastPageBeforeNew == 'history') backTxt = 'History';
                if (me.lastPageBeforeNew == 'groups') backTxt = 'Groups';
                
                me.canResetNewPage = true;
                var data = $('#new .edit-id').val().split('&');
                if (!me.editing && !me.viewing) {
                    $('#new-status, #new-schedule').hide();
                    $('#new .edit-id').val('');

                    if (me.reminding) {
                        $('#new-status, #new-schedule').hide();
                        $('#new-recipient').parents('.fieldcontain').hide();
                        $('#new .ui-content').addClass('no-to');
                        $('#new-content').removeClass('bigger-max-height biggest-no-to-max-height');
                        $('#new-content').addClass('biggest-max-height');
                    }
                } else if (!me.draftEdit && (me.editing || me.viewing) && $('#new-recipient').val().length < 1) {
                    $.ajax({
                        url: me.protocol+me.url+'/sms/view/'+data[0]+'/'+data[1]+'?u='+me.fullPhoneNumber+'&p='+me.password,
                        type: 'GET',
                        beforeSend: function() {
                            me.loadingTimers.push(setTimeout(function() {
                                $.mobile.loading('show');
                            }, 1000));
                        },
                        complete: function() {
                            me.clearTimeouts();
                            $.mobile.loading('hide');
                        },
                        success: function(resp) {
                            resp = JSON.parse(resp);
                            if (resp.status == 'OK') {
                                me.updateSmsFields(resp.data);
                            } else {
                                me.ajaxAlert('new');
                            }
                        },
                        error: function() {
                            me.ajaxAlert('new');
                        }
                    });
                } else if (me.draftEdit && $('#new-recipient').val().length < 1) {
                    var drafts = me.updateDrafts('list');
                    data = {};
                    $(drafts).each(function(draft) {
                        if (drafts[draft].Sms['id'] == me.draftId) {
                            data = drafts[draft];
                            return false;
                        }
                    });
                    me.updateSmsFields(data);
                }

                if (!me.editing && !me.viewing && !me.copying && !me.reminding) {
                    $('#new .ui-content').removeClass('no-to');
                    $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height bigger-max-height');
                }
                if (!me.reminding)  {
                    $('#new-to-field').show();
                } else {
                    $('#new-recipient').val(me.phoneNumber);
                }

                var saveEl = $('#schedule-options [data-id="header-nav"] .save .ui-btn-text');
                if (saveEl.length < 1) saveEl = $('#schedule-options [data-id="header-nav"] .save');
                if (me.viewing) {
                    saveEl.text('Cancel');
                    $('#new-submit-button').addClass('full-width');
                    $('#new-submit-button .ui-btn-text').text('Re-schedule');
                    $('#new-submit-button').css('width', '97%');
                    $('#new-recipient, #new-content, #new-date, #new-name').addClass('ui-disabled');
                    $('#message-repeats-none').parents('fieldset').addClass('ui-disabled');
                } else {
                    saveEl.text('Save');
                    $('#new-submit-button').removeClass('full-width');
                    $('#new-submit-button .ui-btn-text').text('Schedule');
                    $('#new-submit-button').css('width', 'auto');
                    $('#new-recipient, #new-content, #new-date, #new-name').removeClass('ui-disabled');
                    $('#message-repeats-none').parents('fieldset').removeClass('ui-disabled');
                }

                if (!me.reminding && (me.editing || me.viewing)) {
                    $('#new-to-field').addClass('grey-bottom');
                    $('#new-content').removeClass('bigger-max-height biggest-max-height biggest-no-to-max-height');
                } else if (!me.reminding) {
                    $('#new-to-field').removeClass('grey-bottom');
                    $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height');
                    $('#new-content').addClass('bigger-max-height');
                }

                if (me.viewing && !me.editing) {
                    $('#new-content-bubble').show();
                    $('#new-content').hide();
                    $('#new-submit-button').css('min-width', '12em');
                } else {
                    $('#new-content').show();
                    $('#new-content-bubble').hide();
                    $('#new-submit-button').css('min-width', '0');
                }

                if (me.editing) {
                    $('#new-content').css('width', '99.7%');
                    $('#new-submit-button').hide();
                } else {
                    $('#new-content').css('width', '12.9em');
                    $('#new-submit-button').show();
                }

                if (me.viewing) {
                    $('#message-repeats-wd').slider();
                    $('#message-repeats-wd').slider('disable');
                } else {
                    $('#message-repeats-wd').next().removeClass('ui-disabled');
                }

                if (me.reminding) {
                    $('#new-name').val('Remember To')
                    $('h1').css('overflow', 'visible');
                    $('#new-name').addClass('ui-disabled');
                } else {
                    $('h1').css('overflow', 'hidden');
                    $('#new-name').removeClass('ui-disabled');
                }
                
                if (me.editing) {
                    $('.save').show();
                } else {
                    $('.save').removeClass('cancel-state').hide();
                }

                if (me.viewing) {
                    $('#new-submit-button').removeClass('ui-disabled');
                } else {
                    $('#new-submit-button').addClass('ui-disabled');
                }

                if (me.viewing || me.editing) {
                    $('#new-status, #new-schedule').show();
                }

                if (!me.viewing) {
                    var anyEmpty = false;
                    $('#new-recipient, #new-content').each(function() {
                        if ($(this).val().length < 1) anyEmpty = true;
                    });

                    if (!anyEmpty) {
                        $('#new-submit-button').removeClass('ui-disabled');
                    } else {
                        $('#new-submit-button').addClass('ui-disabled');
                    }
                }

                if (me.editing && me.draftEdit) {
                    $('#new .save, #schedule-options .save').removeClass('cancel-state').find('.ui-btn-text').text('Save');
                } else if (me.editing) {
                    $('#new .save, #schedule-options .save').addClass('cancel-state').find('.ui-btn-text').text('Cancel');
                }

                if (me.copying) {
                    $('#new-date').val('');
                    $('#new-date-text').text(moment().format('ddd, D MMM YYYY, hh:mm a'));
                    $('#new-repeats-text').text('Never');
                    $('#message-repeats input[name="message-repeats"]').removeAttr('checked');
                    $('#message-repeats-none').attr('checked', 'checked');
                    $('#message-repeats-wd option:selected').removeAttr('selected');
                    $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
                    $('#new-submit-button').css('min-width', '0');
                    $('#new-content-bubble').hide();
                    try {
                        $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
                    } catch (e) { }
                    try {
                        $('#message-repeats-wd').slider('enable');
                    } catch (e) { }
                    me.copying = false;
                }

                me.stopDraftAddEdit = true;
                
                if (!me.editing && !me.viewing && !me.reminding) {
                    headerTxt = 'New Message';
                } else if (me.reminding) {
                    headerTxt = '<span class="page-title"><img src="img/icon_reminder.png" /></span>';
                } else {
                    var name = me.editData.content;
                    if (me.editData.name != undefined && me.editData.name.length > 0) name = me.editData.name+' - '+name;
                    headerTxt = name;
                }
                break;
                
            case 'messagecredits':
                backTxt = 'Help';
                if (me.lastPageBeforeMessageCredits == 'status-dialog') {
                    backTxt = 'Message Status';
                } else if (me.lastPageBeforeMessageCredits == 'purchase') {
                    backTxt = 'Purchase';
                }
                headerTxt = 'Message Credits';
                break;
                
            case 'addcontactfromnumber':
                backTxt = $('#newgroup [data-role="header"] .ui-title').text();
                headerTxt = 'Add to Group';
                break;
        }
        
        $('.back .ui-btn-text').text(backTxt);
        $('[data-role="header"] .ui-title').html(headerTxt);
    },
    /**
     * Allows country list change event to fire and run our code
     */
    loginPage: function() {
        var me = this;
        me.stopCountryChange = false;
    },
    /**
     * Load content for verification page
     */
    verificationPage: function() {
        var me = this;
        me.clearTimeouts();
        $('#verification-sent-number').text('+'+me.fullPhoneNumber);
        
        $('#verification').removeClass('verify-forgotten verify-register');
        $('#verification').addClass('verify-'+me.verificationType);
        if (me.verificationType == 'forgotten') {
            $('#verification-nocode-text').hide();
            $('#verification-password_text').hide();
            $('#verification-password').show();
            $('#verification-firstline').text('You will shortly receive your verification code via text message. Simply enter the code in the box below along with your new password and hit verify.');
        } else {
            $('#verification-nocode-text').show();
            $('#verification-password').hide();
            $('#verification-password_text').show();
            $('#verification-firstline').text('You will shortly receive your verification code via text message. Simply enter the code in the box below and hit Verify.');
        }
    },
    /**
     * Load content for terms page
     */
    termsPage: function() {
        var me = this;
        
        if (me.lastPageBeforeTerms != 'verification') {
            $('#terms').addClass('bg-light');
        } else {
            $('#terms').removeClass('bg-light');
        }
        $.ajax({
            url: me.protocol+me.url+'/pages/terms',
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#terms-content').html(resp.data);
                } else {
                    me.ajaxAlert('terms');
                }
            },
            error: function() {
                me.ajaxAlert('terms');
            }
        });
    },
    /**
     * Load content for scheduled page
     */
    scheduledPage: function() {
        var me = this;
        me.repeats = false;
        me.editing = false;
        me.reminding = false;
        me.draftEdit = false;
        me.unsyncEdit = false;
        me.lastPageBeforeNew = me.lastPageBeforeSettings = 'scheduled';
        $('#new .save, #schedule-options .save').addClass('cancel-state').find('.ui-btn-text').text('Cancel');
        $.ajax({
            url: me.protocol+me.url+'/sms/index/scheduled?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#scheduled-message-list li').not('#scheduled-message-template').remove();
                    
                    var drafts = me.updateDrafts('list');
                    if (typeof drafts == 'object' && drafts.length > 0) {
                        resp.data['schedules'] = drafts.concat(resp.data['schedules']);
                    }
                    
                    var noCreditFound = false;
                    if (resp.data['schedules'].length > 0) {
                        $.each(resp.data['schedules'], function(row) {
                            var data = resp.data['schedules'][row];
                            var newRow = $('#scheduled-message-template').clone();
                            var sendTime = new Date(data['Schedule'].send_time * 1000);
                            var repeats = JSON.parse(data.Sms.repeat_options);
                            var content = data['Sms'].content;
                            var draft = typeof data['Sms'].is_draft != 'undefined';
                            var unsynced = draft && data['Schedule'].status == 'unsynced';
                            if (data['Sms'].name.length > 0) content = data['Sms'].name+' - '+content;
                            if (!draft && (repeats.D == 1 || repeats.W == 1 || repeats.M == 1 || repeats.Y == 1)) {
                                newRow.attr('data-repeats', 'repeats');
                            }
                            if (data['Schedule'].status == 'no_credit') {
                                newRow.addClass('no_credit');
                            }
                            if (draft) {
                                newRow.attr('data-draft', data['Sms'].id);
                            }
                            if (unsynced) {
                                newRow.attr('data-unsynced', data['Sms'].id);
                            }

                            var rowId = data['Sms'].id;
                            if (data['Sms'].real_id != undefined && data['Sms'].real_id.length > 0) {
                                rowId = data['Sms'].real_id.split('&')[0];
                            }
                            newRow.attr('data-id', rowId);
                            newRow.attr('data-schedule-id', data['Schedule'].id);
                            newRow.find('.message-recipients').text(data['Sms'].recipient_user);
                            newRow.find('.message-content').text(content);
                            newRow.find('.message-status').text(data['Schedule'].status_text);
                            if (!draft) {
                                newRow.find('.message-date').text(me.formatDate(sendTime));
                                newRow.find('.message-time').text(me.formatTime(sendTime));
                            } else {
                                newRow.find('.message-date, .message-time').text('-');
                            }
                            if (data['Schedule'].status == 'no_credit') noCreditFound = true;
                            newRow.find('.ui-li-aside').addClass('colour-'+data['Schedule'].status_colour);
                            switch (data['Schedule'].status_colour) {
                                default:
                                case '':
                                case 'a3a3a3': // grey
                                    newRow.find('.status-icon').attr('src', 'img/icon_black.png');
                                    break;
                                case '92d050': // green
                                    newRow.find('.status-icon').attr('src', 'img/icon_green.png');
                                    break;
                                case 'f0b05f': // amber
                                    newRow.find('.status-icon').attr('src', 'img/icon_amber.png');
                                    break;
                                case 'c80408': // red
                                    newRow.find('.status-icon').attr('src', 'img/icon_red.png');
                                    break;
                            }
                            newRow.removeAttr('id');
                            newRow.show();
                            $('#scheduled-message-list').append(newRow);

                            me.formatNumbersWithContactNames(data['Sms'].recipient_user, $('#scheduled-message-list li[data-id="'+data['Sms'].id+'"] .message-recipients'));
                        });
                    }

                    $('#scheduled-message-list li:not(".no_credit")').swipeDelete({
                        click: function(e) {
                            me.scheduledDelete.call(me, e);
                        }
                    });
                    
                    if (me.justSetSpam) {
                        me.justSetSpam = false;
                        me.ajaxAlert('scheduled', 'Unfortunately this message has been flagged by our system for potential SPAM content and will be reviewed by our team before it is allowed to send.');
                    } else if (me.justSetUnsynced) {
                        me.justSetUnsynced = false;
                        me.ajaxAlert('scheduled', 'We can\'t sync this message with our system. Please connect to a mobile network or internet connection.');
                    } else if (resp.data['show_spam_fail_notification'] == true) {
                        me.showingSpamFailNotification = true;
                        me.ajaxAlert('scheduled', 'Unfortunately one or more messages have been reviewed and found to have SPAM content within them. This message will be moved to your history folder.');
                    }
                    else if (noCreditFound) {
                        var noCreditShown = $.cookie('noCreditShown');
                        if (noCreditShown == undefined) {
                            $.cookie('noCreditShown', JSON.stringify(true), { expires: 1 });
                            me.ajaxAlert('scheduled', 'You don\'t have enough credits to send one or more messages.');
                        }
                    }
                } else {
                    me.ajaxAlert('scheduled');
                }
            },
            error: function() {
                me.ajaxAlert('scheduled');
            }
        });
        
        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .schedule-link').addClass('ui-btn-active');
    },
    /**
     * Once scheduled page shows start automatic refreshing of the list and attempt to process unsynced messages
     */
    scheduledPageShow: function() {
        var me = this;
        $.each(me.listUpdateTimers, function(timeout) {
            clearTimeout(me.listUpdateTimers[timeout]);
        });
        
        me.refreshList('scheduled');
        me.processUnsynced.call(me);
    },
    scheduledDelete: function(e){
        e.preventDefault();
        var me = $(e.currentTarget);
        var repeats = (typeof me.parents('li').attr('data-repeats') != 'undefined');
        if (repeats) {
            $('#scheduled .dialog-overlay, #delete-repeats-confirm').show();
        } else {
            $.fn.swipeDoDelete.call(me);
        }
    },
    /**
     * Load history page content
     */
    historyPage: function() {
        var me = this;
        me.viewing = false;
        me.repeats = false;
        me.editing = false;
        me.reminding = false;
        me.draftEdit = false;
        me.unsyncEdit = false;
        me.lastPageBeforeNew = me.lastPageBeforeSettings = 'history';
        $.ajax({
            url: me.protocol+me.url+'/sms/index/sent?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#history-message-list li').not('#history-message-template').remove();
                    if (resp.data['schedules'].length > 0) {
                        $.each(resp.data['schedules'], function(row) {
                            var data = resp.data['schedules'][row];
                            var newRow = $('#history-message-template').clone();
                            var sendTime = new Date(data['Schedule'].send_time * 1000);
                            var content = data['Sms'].content;
                            if (data['Sms'].name.length > 0) content = data['Sms'].name+' - '+content;
                            newRow.attr('data-id', data['Sms'].id);
                            newRow.attr('data-schedule-id', data['Schedule'].id);
                            newRow.find('.message-recipients').text(data['Sms'].recipient_user);
                            newRow.find('.message-content').text(content);
                            newRow.find('.message-status').text(data['Schedule'].status_text);
                            newRow.find('.message-date').text(me.formatDate(sendTime));
                            newRow.find('.message-time').text(me.formatTime(sendTime));
                            newRow.find('.ui-li-aside').addClass('colour-'+data['Schedule'].status_colour);
                            switch (data['Schedule'].status) {
                                case 'delivered':
                                case 'pending': // tick
                                    newRow.find('.status-icon').attr('src', 'img/icon_tick.png');
                                    break;
                                default: // cross
                                    newRow.find('.status-icon').attr('src', 'img/icon_cross.png');
                                    break;
                            }
                            newRow.removeAttr('id');
                            newRow.show();
                            $('#history-message-list').append(newRow);

                            me.formatNumbersWithContactNames(data['Sms'].recipient_user, $('#history-message-list li[data-id="'+data['Sms'].id+'"] .message-recipients'));
                        });
                    }
                } else {
                    me.ajaxAlert('history');
                }
            },
            error: function() {
                me.ajaxAlert('history');
            }
        });
        
        $('[data-role="footer"] li a').removeClass('ui-btn-active');
        $('[data-role="footer"] .history-link').addClass('ui-btn-active');
    },
    /**
     * Once history page shows start automatic refreshing of the list
     */
    historyPageShow: function() {
        var me = this;
        $.each(me.listUpdateTimers, function(timeout) {
            clearTimeout(me.listUpdateTimers[timeout]);
        });
        
        me.refreshList('history');
    },
    /**
     * Sets new/edit message pages fields back to their default state
     */
    newPageResetFields: function() {
        var me = this;
        if (me.canResetNewPage) {
            me.newData = {
                'name': '',
                'recipient': '',
                'content': '',
                'time': '',
                'reminder': '',
                'repeat_options': ''
            };
            $('#new-name, #new-recipient, #new-content').val('');
            $('#message-repeats input[name="message-repeats"]').removeAttr('checked');
            $('#message-repeats-none').attr('checked', 'checked');
            try {
                $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
            } catch (e) { }
            $('#message-repeats-wd option:selected').removeAttr('selected');
            $('#message-repeats-wd option[value="off"]').attr('selected', 'selected');
            try {
                $('#message-repeats-wd').slider('refresh');
            } catch (e) { }
            var scrollEl = $('#new-date');
            scrollEl.val('').scroller('destroy').removeClass('scrollified');
            
            if (!me.viewing) {
                scrollEl.scroller({
                        preset : 'calendar',
                        theme: 'ios',
                        mode: 'scroller',
                        display: 'inline',
                        lang: 'en'
                    }).addClass('scrollified');
            }
            $('#new-date-text').text('');
        }
    },
    /**
     * Update message name and repeat options data on client device
     */
    newSmsSetData: function() {
        var me = this;
        var data = {
            'name': $('#new-name').val(),
            'part': 'name'
        };
        $.extend(me.newData, data);
        $.extend(me.editData, data);
        
        var checkedEl = $('input[name="message-repeats"]:checked');
        if (checkedEl.length < 1) checkedEl = $('#message-repeats-none');
        var value = checkedEl.val().toUpperCase();
        var weekDays = $('#message-repeats-wd option:selected').val() == 'on';
        var repeat_options = {
            'D':0,
            'W':0,
            'M':0,
            'Y':0,
            'WD':0
        };
        if (typeof repeat_options[value] != 'undefined') repeat_options[value] = 1;
        if (weekDays) repeat_options['WD'] = 1;

        data = {
            'repeat_options': JSON.stringify(repeat_options),
            'part': 'repeat_options'
        };
        $.extend(me.newData, data);
        $.extend(me.editData, data);
    },
    /**
     * Load content for message schedule options page
     */
    scheduleOptionsPage: function() {
        var me = this;
        var scrollEl = $('#new-date');
        if (!me.viewing && !scrollEl.hasClass('scrollified')) {
            scrollEl.scroller({
                preset : 'calendar',
                theme: 'ios',
                mode: 'scroller',
                display: 'inline',
                lang: 'en'
            }).addClass('scrollified');
        }
        
        me.newSmsSetData();
        
        var repeatsTxt = 'Never';
        if (me.newData.repeat_options.length > 0) {
            var tmp = JSON.parse(me.newData.repeat_options);
            if (typeof tmp == 'object') {
                var repeats = false;
                if (tmp.D == '1') {
                    repeats = true;
                    repeatsTxt = 'Daily';
                } else if (tmp.W == '1') {
                    repeats = true;
                    repeatsTxt = 'Weekly';
                } else if (tmp.M == '1') {
                    repeats = true;
                    repeatsTxt = 'Monthly';
                } else if (tmp.Y == '1') {
                    repeats = true;
                    repeatsTxt = 'Annually';
                }
                
                if (repeats && tmp.WD == '1' && tmp.W != '1') {
                    repeatsTxt += ', week days only';
                }
            }
        }
        
        if (!me.justSetEditOpts) {
            $('#new-name-text').text(me.newData.name);
            if ($('#new-date-text').text().length < 1) $('#new-date-text').text(moment().format('ddd, D MMM YYYY, hh:mm a'));
            $('#new-repeats-text').text(repeatsTxt);
        } else {
            me.justSetEditOpts = false;
        }
        
        if (me.viewing) {
            $('#schedule-options .bar-link .floatR').css('margin-right', '15px');
            $('#schedule-options .bar-link .arrow').hide();
        } else {
            $('#schedule-options .bar-link .floatR').css('margin-right', '30px');
            $('#schedule-options .bar-link .arrow').show();
        }
    },
    /**
     * Load content for message repeat options page
     */
    messageRepeatsPage: function() {
        var me = this;
        if ($('#message-repeats input[name="message-repeats"]:checked').length < 1) {
            $('#message-repeats-none').attr('checked', 'checked');
            $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
        }
        
        var repeatOpts = JSON.parse(me.editData['repeat_options']);
        if (repeatOpts.W != undefined && repeatOpts.W == '1') {
            $('#message-repeats-wd').slider('disable');
        } else {
            $('#message-repeats-wd').slider('enable');
        }
    },
    /**
     * Load content for message status page
     */
    statusDialogPage: function() {
        var me = this;
        if (me.editViewStatus != 'unsynced') {
            $.ajax({
                url: me.protocol+me.url+'/sms/getStatusDescription/'+me.editViewStatus+'?u='+me.fullPhoneNumber+'&p='+me.password,
                type: 'GET',
                beforeSend: function() {
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        $('#status-dialog-content').html(resp.data);
                    } else {
                        me.ajaxAlert('terms');
                    }
                },
                error: function() {
                    me.ajaxAlert('terms');
                }
            });
        } else {
            $('#status-dialog-content').html('We can\'t sync this message with our system. Please connect to a mobile network or internet connection.');
        }
    },
    /**
     * Load content for purchase credits page
     */
    purchasePage: function() {
        var me = this;
        $.ajax({
            url: me.protocol+me.url+'/billing/listProducts?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#purchase-product-list').html('');
                    $.each(resp.data, function(i) {
                        var newRow = $('<a href="#" class="product-btn" data-role="button" id="product-btn-'+i+'">Purchase '+resp.data[i]+' credits for <span class="price-value"></span></a>');
                        $('#purchase-product-list').append(newRow);
                    });
                    $('#purchase-product-list .product-btn').button();
                } else {
                    me.ajaxAlert('purchase');
                }
            },
            error: function() {
                me.ajaxAlert('purchase');
            }
        });
    },
    /**
     * Load content for settings page
     */
    settingsPage: function() {
        var me = this;
        $('#settings-full-number').text('+'+me.fullPhoneNumber);
    },
    /**
     * Load content for account page
     */
    accountPage: function() {
        var me = this;
        $.ajax({
            url: me.protocol+me.url+'/users/getCredits?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    $('#account-creds-balance').text(Math.floor(resp.data.balance));
                    $('#account-creds-allocated').text(Math.floor(resp.data.allocated));
                    $('#account-creds-remaining').text(Math.floor(resp.data.remaining));
                } else {
                    me.ajaxAlert('account');
                }
            },
            error: function() {
                me.ajaxAlert('account');
            }
        });
    },
    
    
    
    /**
     * Submit draft message delete request
     */
    doDraftDelete: function() {
        var me = this;

        $.ajax({
            url: me.protocol+me.url+'/sms/delete/'+me.dataId+(me.dataSingle ? '/'+me.dataScheduleId : '')+'?u='+me.fullPhoneNumber+'&p='+me.password,
            type: 'GET',
            beforeSend: function() {
                me.loadingTimers.push(setTimeout(function() {
                    $.mobile.loading('show');
                }, 1000));
            },
            complete: function() {
                me.draftDeleteType = '';
                me.clearTimeouts();
                $.mobile.loading('hide');
            },
            success: function(resp) {
                resp = JSON.parse(resp);
                if (resp.status == 'OK') {
                    me.updateDrafts('view', me.generateUUID());
                    $.mobile.changePage('#scheduled', {transition: 'slideup', reverse: true});
                } else {
                    me.ajaxAlert('schedule-options');
                }
            },
            error: function() {
                me.ajaxAlert('schedule-options');
            }
        });
    },
    /**
     * Update edit message fields
     */
    updateSmsFields: function(data) {
        var me = this;
        me.stopDraftAddEdit = true;
        me.editData = data.Sms;
        $.extend(me.oldEditData, me.editData);
        me.editViewStatus = data.Schedule.status;
        if (me.editData.reminder == false) {
            me.editData.reminder = 0;
        } else {
            me.editData.reminder = 1;
        }
        me.editData.time = me.editData.time_unix;
        me.editData.schedule_time = data.Schedule.send_time;
        if (data.Sms.reminder) {
            me.reminding = true;
            $('#new-status, #new-schedule').hide();
            $('#new-recipient').parents('.fieldcontain').hide();
            $('#new .ui-content').addClass('no-to');
            $('#new-content').removeClass('biggest-max-height bigger-max-height');
            $('#new-content').addClass('biggest-no-to-max-height');
        } else {
            $('#new .ui-content').removeClass('no-to');
            $('#new-content').removeClass('biggest-max-height biggest-no-to-max-height bigger-max-height');
        }
        var statusColour = data.Schedule.status_colour;
        var statusText = data.Schedule.status_text;
        var statusIconColour = '';
        if (!me.viewing) {
            statusIconColour = 'black';
            switch (data.Schedule.status_colour) {
                case '92d050': // green
                    statusIconColour = 'green';
                    break;
                case 'f0b05f': // amber
                    statusIconColour = 'amber';
                    break;
                case 'c80408': // red
                    statusIconColour = 'red';
                    break;
            }
        } else {
            statusColour = 'b60c76';
            statusIconColour = 'cross';
            switch (data.Schedule.status) {
                case 'delivered':
                case 'pending': // tick
                    statusIconColour = 'tick';
                    break;
            }
        }
        statusText += ' <img src="img/icon_'+statusIconColour+'.png" class="status-icon" />';
        $('#new-recipient').val(data.Sms.recipient_user);
        $('#new-content').val(data.Sms.content);
        $('#new-content-bubble').html(data.Sms.content.replace(/\n/g, '<br />'));
        $('#new-status-text').html(statusText)
            .attr('style', 'color: #'+statusColour+' !important');
        $('#new-scheduled').text(moment(data.Schedule.send_time * 1000).format('ddd, D MMM YYYY, hh:mm a'));
        me.stopDraftAddEdit = true;
        $('#new-name').val(data.Sms.name);
        $('#new-name-text').text(data.Sms.name);
        $('#status-dialog-cost').text(data.Sms.cost);
        if (typeof data.Sms.cost != 'undefined')  {
            $('#status-dialog-cost-p').show();
        } else {
            $('#status-dialog-cost-p').hide();
        }
        
        if (!me.draftEdit && !me.viewing) {
            $('#delete-to-draft').show();
        } else {
            $('#delete-to-draft').hide();
        }
        
        var scrollEl = $('#new-date');
        if (me.viewing || scrollEl.hasClass('scrollified')) {
            scrollEl.scroller('destroy').removeClass('scrollified');
        }
        if (!me.viewing) {
            me.stopDraftAddEdit = true;
            var scrollerDate = moment(new Date(data.Schedule.send_time * 1000).toUTCString()).format('MM/DD/YYYY hh:mm A');
            scrollEl.val(scrollerDate)
                .scroller({
                    preset : 'calendar',
                    theme: 'ios',
                    mode: 'scroller',
                    display: 'inline',
                    lang: 'en'
                }).addClass('scrollified').trigger('change');
        }
        $('#new-date-text').text(moment(new Date(data.Schedule.send_time * 1000).toUTCString()).format('ddd, D MMM YYYY, hh:mm a'));
        
        var repeats = false;
        var repeatsTxt = 'Never';
        if (data.Sms.repeat_options.length > 0) {
            var tmp = JSON.parse(data.Sms.repeat_options);
            if (typeof tmp == 'object') {
                $('#message-repeats input[name="message-repeats"]').removeAttr('checked');

                if (tmp.D == '1') {
                    repeats = true;
                    repeatsTxt = 'Daily';
                    me.stopDraftAddEdit = true;
                    $('#message-repeats-d').attr('checked', 'checked');
                } else if (tmp.W == '1') {
                    repeats = true;
                    repeatsTxt = 'Weekly';
                    me.stopDraftAddEdit = true;
                    $('#message-repeats-w').attr('checked', 'checked');
                } else if (tmp.M == '1') {
                    repeats = true;
                    repeatsTxt = 'Monthly';
                    me.stopDraftAddEdit = true;
                    $('#message-repeats-m').attr('checked', 'checked');
                } else if (tmp.Y == '1') {
                    repeats = true;
                    repeatsTxt = 'Annually';
                    me.stopDraftAddEdit = true;
                    $('#message-repeats-y').attr('checked', 'checked');
                } else {
                    me.stopDraftAddEdit = true;
                    $('#message-repeats-none').attr('checked', 'checked');
                }

                if (repeats && tmp.WD == '1' && tmp.W != '1') {
                    repeatsTxt += ', week days only';
                }

                me.stopDraftAddEdit = true;
                $('#message-repeats-wd option:selected').removeAttr('selected');
                $('#message-repeats-wd option[value="'+(tmp.WD == '1' ? 'on' : 'off')+'"]').attr('selected', 'selected');
            }
        }
        $('#new-repeats-text, #status-dialog-repeats-text').text(repeatsTxt);

        if (repeats && data.Sms.time_unix != data.Schedule.send_time) {
            $('#status-dialog-repeats-startdate').text(moment(new Date(data.Sms.time_unix * 1000).toUTCString()).format('DD/MM/YYYY hh:mm A'));
            
            if (typeof data.Sms.end_date != 'undefined' && data.Sms.end_date != '0') {
                $('#status-dialog-repeats-enddate').text(moment(new Date(data.Sms.end_date * 1000).toUTCString()).format('DD/MM/YYYY hh:mm A'));
                $('#status-dialog-repeats-end').show();
            } else {
                $('#status-dialog-repeats-end').hide();
            }
            if (typeof data.Sms.time_unix != 'undefined') $('#status-dialog-repeats-start').show();
        } else {
            $('#status-dialog-repeats-start').hide();
        }

        $('#message-repeats input[name="message-repeats"]').checkboxradio();
        $('#message-repeats-wd').slider();
        try {
            $('#message-repeats input[name="message-repeats"]').checkboxradio('refresh');
        } catch (e) { }
        try {
            $('#message-repeats-wd').slider('refresh');
        } catch (e) { }
        
        if (me.reminding) {
            if (me.viewing || me.editing) {
                $('#new-status, #new-schedule').show();
            } else {
                $('#new-status, #new-schedule').hide();
            }
            $('h1').css('overflow', 'visible');
            $('#new-name').addClass('ui-disabled');
        } else {
            $('h1').css('overflow', 'hidden');
            $('#new-name').removeClass('ui-disabled');
        }
        
        var headerTxt = '';
        if (!me.editing && !me.viewing && !me.reminding) {
            headerTxt = 'New Message';
        } else if (me.reminding) {
            headerTxt = '<span class="page-title"><img src="img/icon_reminder.png" /></span>';
        } else {
            var name = me.editData.content;
            if (me.editData.name != undefined && me.editData.name.length > 0) name = me.editData.name+' - '+name;
            headerTxt = name;
        }
        $('[data-role="header"] .ui-title').html(headerTxt);
        me.justSetEditOpts = true;
    },
    /**
     * Save a message on the local device, flag as unsynced and attempt to process unsynced messages in 60 seconds
     */
    saveAsUnsynced: function() {
        var me = this;
        me.unsyncEdit = true;
        me.updateDrafts('edit', me.draftId, null, true);
        me.justSetUnsynced = true;
        if (me.unsyncedTimer === null) {
            me.unsyncedTimer = setTimeout(function() {
                me.processUnsynced.call(me);
            }, 60000);
        }
    },
    /**
     * Process unsynced messages
     */
    processUnsynced: function() {
        var me = this;
        var messages = me.updateDrafts('unsynced');
        if (messages.length > 0) {
            var messageData = messages[0];
            var data = {
                name: messageData.Sms['name'],
                recipient: messageData.Sms['recipient'],
                content: messageData.Sms['content'],
                time: messageData.Schedule['send_time'],
                repeat_options: messageData.Sms['repeat_options'],
                reminder: messageData.Sms['reminder']
            };
            var now = Math.floor(new Date().getTime() / 1000) + 60;
            if (data.time < now) data.time = now;

            var editing = messageData.Sms['real_id'] != undefined && messageData.Sms['real_id'].length > 0;
            var ids = [];
            if (editing) ids = messageData.Sms['real_id'].split('&');
            
            $.ajax({
                url: me.protocol+me.url+'/sms/'+(editing ? 'edit/'+ids[0] : 'schedule')+'?u='+me.fullPhoneNumber+'&p='+me.password,
                type: 'POST',
                data: $.param(data),
                beforeSend: function() {
                    clearTimeout(me.unsyncedTimer);
                    me.loadingTimers.push(setTimeout(function() {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function() {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function(resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        me.updateDrafts('delete', messageData.Sms['id']);
                        if (messages.length > 1) {
                            me.processUnsynced.call(me);
                        } else {
                            clearTimeout(me.unsyncedTimer);
                            me.unsyncedTimer = null;
                            me.scheduledPage.call(me);
                            me.refreshList.call(me, 'scheduled');
                        }
                    } else {
                        me.unsyncedTimer = setTimeout(function() {
                            me.processUnsynced.call(me);
                        }, 60000);
                    }
                },
                error: function() {
                    me.unsyncedTimer = setTimeout(function() {
                        me.processUnsynced.call(me);
                    }, 60000);
                }
            });
        } else {
            clearTimeout(me.unsyncedTimer);
            me.unsyncedTimer = null;
        }
    },
    /**
     * Function used to add, edit and retrieve draft/unsynced messages to/from the local device
     */
    updateDrafts: function(action, id, data, unsynced) {
        var me = this;
        if (typeof action != 'string') return false;
        
        var drafts = JSON.parse($.cookie('drafts'));
        switch (action) {
            default:
                return false;
                break;
            case 'add':
                if (typeof data != 'object') return false;
                me.draftEdit = true;
                drafts.push(data);
                break;
            case 'edit':
                if (typeof id != 'string') return false;
                me.draftEdit = true;
                $(drafts).each(function(draft) {
                    if (drafts[draft].Sms['id'] == id) {
                        var value = $('input[name="message-repeats"]:checked').val().toUpperCase();
                        var weekDays = $('#message-repeats-wd option:selected').val() == 'on';
                        var repeat_options = {
                            'D':0,
                            'W':0,
                            'M':0,
                            'Y':0,
                            'WD':0
                        };
                        if (typeof repeat_options[value] != 'undefined') repeat_options[value] = 1;
                        if (weekDays) repeat_options['WD'] = 1;
                        
                        var tmpRealId = null;
                        var tmpUnsynced = unsynced != undefined ? unsynced : drafts[draft].Sms['unsynced'];
                        if (drafts[draft].Sms['real_id'] != undefined) tmpRealId = drafts[draft].Sms['real_id'];
                        drafts[draft] = {
                            'Sms': {
                                'content': $('#new-content').val(),
                                'id': id,
                                'is_draft': true,
                                'name': $('#new-name').val(),
                                'recipient': $('#new-recipient').val(),
                                'recipient_user': $('#new-recipient').val(),
                                'reminder': me.reminding ? '1' : '0',
                                'repeat_options': JSON.stringify(repeat_options),
                                'unsynced': tmpUnsynced
                            },
                            'Schedule': {
                                'id': me.generateUUID(),
                                'send_time': $('#new-date').val().length > 0 ? new Date($('#new-date').val()).getTime() / 1000 : new Date().getTime() / 1000,
                                'status': tmpUnsynced ? 'unsynced' : 'draft',
                                'status_colour': tmpUnsynced ? 'f0b05f' : 'a3a3a3',
                                'status_text': tmpUnsynced ? 'Unsynced' : 'Draft'
                            }
                        };
                        
                        if (tmpRealId != null) drafts[draft].Sms['real_id'] = tmpRealId;
                    }
                });
                break;
            case 'view':
                if (typeof id != 'string') return false;
                var ret = null;
                me.draftId = id;
                $(drafts).each(function(draft) {
                    if (drafts[draft].Sms['id'] == id) {
                        ret = drafts[draft];
                    }
                });
                
                if (ret === null) {
                    var tmpUnsynced = unsynced != undefined ? unsynced : false;
                    ret = {
                        'Sms': {
                            'content': me.editData.content,
                            'id': id,
                            'is_draft': true,
                            'name': me.editData.name,
                            'recipient': me.editData.recipient,
                            'recipient_user': me.editData.recipient_user,
                            'reminder': me.reminding ? '1' : '0',
                            'repeat_options': me.editData.repeat_options,
                            'unsynced': tmpUnsynced
                        },
                        'Schedule': {
                            'id': me.generateUUID(),
                            'send_time': me.editData.schedule_time,
                            'status': tmpUnsynced ? 'unsynced' : 'draft',
                            'status_colour': 'a3a3a3',
                            'status_text': tmpUnsynced ? 'Unsynced' : 'Draft'
                        }
                    };
                    var realId = $('#new .edit-id').val();
                    if (realId.length > 0) ret.Sms['real_id'] = realId;
                    me.updateDrafts('add', 0, ret);
                }
                return ret;
                break;
            case 'delete':
                if (typeof id != 'string') return false;
                var tmp = [];
                $(drafts).each(function(draft) {
                    if (drafts[draft].Sms['id'] != id) {
                        tmp.push(drafts[draft]);
                    }
                });
                drafts = tmp;
                break;
            case 'wipe':
                drafts = [];
                break;
            case 'list':
                var tmp = JSON.parse($.cookie('drafts'));
                var times = [];
                var res = [];
                $.each(tmp, function(draft) {
                    times.push(tmp[draft].Schedule['send_time']);
                });
                times = me.asort(times);
                $.each(times, function(time) {
                    $.each(tmp, function(draft) {
                        if (times[time] == tmp[draft].Schedule['send_time']) {
                            res.push(tmp[draft]);
                            return false;
                        }
                    });
                });
                
                return res;
                break;
            case 'unsynced':
                var drafts = JSON.parse($.cookie('drafts'));
                var tmp = [];
                $.each(drafts, function(draft) {
                    if (drafts[draft].Sms['unsynced']) {
                        tmp.push(drafts[draft]);
                    }
                });
                return tmp;
                break;
        }
        $.cookie('drafts', JSON.stringify(drafts),
            { expires: 7300 });
        
        return true;
    },
    /**
     * Sort an array but leave keys intact
     */
    asort: function(times) {
        return times.sort(function(a, b) {
            return a - b;
        });
    },
    /**
     * Generate a UUID (used for draft/unsynced messages)
     */
    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },
    /**
     * Initiate page title progress bar on new/edit message page
     */
    doProgressBar: function() {
        if ($('#'+$.mobile.activePage.attr('id')+' .progressbar:visible').length < 1) {
            $('#'+$.mobile.activePage.attr('id')+' h1 .page-title').hide();
            $('#'+$.mobile.activePage.attr('id')+' .progressbar').show();
            $('#'+$.mobile.activePage.attr('id')+' .progressbar-status').css('display', 'block');

            $('#new h1').css('overflow', 'visible');
            TolitoProgressBar('#'+$.mobile.activePage.attr('id')+' .progressbar')
                .isMini(true)
                .showCounter(false)
                .setInterval(20)
                .setMax(125)
                .setOuterTheme('b')
                .setInnerTheme('c')
                .build()
                .init();
        }
    },
    /**
     * Format numbers from user's address book so their names show rather than numbers (needs re-working)
     */
    formatNumbersWithContactNames: function(numbers, el, button) {
        if (typeof button == 'undefined') button = false;
        
        numbers = numbers.split(',');
        var recipientStr = '';
        for (var i = 0; i < numbers.length; i++) {
            recipientStr += '<span'+(button ? ' data-role="button" data-mini="true"' : '')+' data-phone_number="'+numbers[i]+'">';
            recipientStr += numbers[i];
//            recipientStr += '</span>';
            if (!button && (i + 1) < numbers.length) recipientStr += ', ';
        }
//        recipientStr += '<span class="clear"></span>';
        el.html(recipientStr);
//        if (button) el.find('span[data-phone_number]').button();
        
//        var contacts = [];
//        if (typeof navigator.contacts != 'undefined') {
//            for (i = 0; i < numbers.length; i++) {
//                var findOptions = new ContactFindOptions();
//                findOptions.filter = numbers[i];
//                navigator.contacts.find(
//                    ['name.formatted', 'phoneNumbers'],
//                    function(contacts) {
//                        var doneNumbers = [];
//                        if (typeof contacts != 'null' && contacts.length > 0) {
//                            if (typeof contacts[0].phoneNumbers != 'null' && contacts[0].phoneNumbers.length > 0) {
//                                if (typeof doneNumbers[numbers[i]] == 'undefined') {
//                                    var el = $('[data-phone_number="'+numbers[i]+'"]');
//                                    if (el.parent().hasClass('ui-btn')) el = el.parent().find('.ui-btn-text');
//                                    el.text(contacts[0].name.formatted);
//                                } else {
//                                    doneNumbers.push(numbers[i]);
//                                }
//                            }
//                        }
//                    },
//                    null,
//                    findOptions
//                );
//            }
//        }
    },
    /**
     * Format timestamp in to day/month/year
     */
    formatDate: function(time) {
        var day = ''+parseInt(time.getDate());
        var month = ''+parseInt(time.getMonth()+1);
        var year = ''+parseInt(time.getFullYear());
        day = day > 9 ? day : '0'+day;
        month = month > 9 ? month : '0'+month;
        return day+'/'+month+'/'+year;
    },
    /**
     * Format timestamp in to hours:minutes
     */
    formatTime: function(time, twelveHr) {
        if (typeof twelveHr == 'undefined') twelveHr = false;
        var hours = ''+time.getHours();
        var minutes = ''+time.getMinutes();
        hours = hours > 9 ? hours : '0'+hours;
        minutes = minutes > 9 ? minutes : '0'+minutes;
        return hours+':'+minutes;
    },
    /**
     * Clear timeouts that run before loading graphic is shown
     */
    clearTimeouts: function() {
        var me = this;
        $.each(me.loadingTimers, function(timeout) {
            clearTimeout(me.loadingTimers[timeout]);
        });
    },
    /**
     * Show notice message in the white header bar
     */
    ajaxAlert: function(page, text, callback) {
        var me = this;
        var err = $('#'+page+' .error');
        
        if (typeof text == 'undefined') {
            text = 'Something went wrong, please try again.';
        }
        err.find('.inner').html(text);
        if (typeof callback != 'undefined') {
            me.ajaxAlertCallback = callback;
        }
        $('body').append('<div class="error-overlay"><div>');
        err.slideDown();
        $('.error, .error-overlay').bind('click tap', function() {
            if (me.showingSpamFailNotification) {
                me.showingSpamFailNotification = false;
                $.ajax({
                    url: me.protocol+me.url+'/users/shownSpamFailNotification?u='+me.fullPhoneNumber+'&p='+me.password,
                    type: 'GET',
                    beforeSend: function() {
                        me.loadingTimers.push(setTimeout(function() {
                            $.mobile.loading('show');
                        }, 1000));
                    },
                    complete: function() {
                        me.clearTimeouts();
                        $.mobile.loading('hide');
                    },
                    success: function(resp) {
                        resp = JSON.parse(resp);
                        if (resp.status == 'OK') {
                            $('.error, .error-overlay').slideUp().unbind('click tap');
                            if (me.ajaxAlertCallback != null) {
                                callback = me.ajaxAlertCallback;
                                me.ajaxAlertCallback = null;
                                $.mobile.changePage('#'+callback);
                            }
                        } else {
                            me.ajaxAlert($.mobile.activePage.attr('id'));
                        }
                    },
                    error: function() {
                        me.ajaxAlert($.mobile.activePage.attr('id'));
                    }
                });
            } else {
                $('.error, .error-overlay').slideUp();
                $(this).unbind('click tap');
                if (me.ajaxAlertCallback != null) {
                    callback = me.ajaxAlertCallback;
                    me.ajaxAlertCallback = null;
                    $.mobile.changePage('#'+callback);
                }
            }
        });
    }
};
