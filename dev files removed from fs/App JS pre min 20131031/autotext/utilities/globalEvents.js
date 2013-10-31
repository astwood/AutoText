app.doBinds = function () {
    var me = this;

    /** Fix to allow rescheduled button to work with same page transistion see 
    http://forum.jquery.com/topic/changepage-allowsamepagetransition-true-displays-blank-page **/


    /** Sets default login details for testing**/
    if (devSettings.isDebug) {
        $("#login-phone_number").val("07960270356");
        $("#login-password").val("autotext");
    }

    /**
     * Opens external links in iOS Safari
     */
    $('a.external-link').live('click', function (e) {
        e.preventDefault();
        window.open($(e.currentTarget).attr('href'), '_system');
    });

    $('.schedule-link, .history-link, .groups-link').live('click', function () {
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
        if (nextPg.length > 0) $.mobile.changePage('#' + nextPg, { reverse: left });
    });

    $('input').live('keyup', function (e) {
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
                case 'addNumber':
                    $('#addNumber .back').trigger('click');
                    break;
            }
        }
    });

    /**
     * Remove default textarea auto grow behaviour and activate third party plugin
     */
    $('textarea').off('keyup').autoGrowTextArea();

    $('.new-link').live('click', function () {
        $('#new-content').height(28);
    });

    /**
    * Makes sure textarea is at correct height for remind me
    */

    $('.reminder-link').live('click', function () {
        $('#new-content').height(28);
    });

    /**
     * Binds terms link
     */
    $('.terms').live('click', function () {
        me.lastPageBeforeTerms = $.mobile.activePage.attr('id');
        $.mobile.changePage('#terms');
    });

    /**
     * Bind change event on login and forgotten page country selects. Retrieves and stores exit code for selected country (used for later API calls)
     */
    $('#login-country, #forgotten-country').live('change', function () {
        if (!me.stopCountryChange) {
            $.ajax({
                url: me.protocol + me.url + '/users/getExitCode/' + $(this).find('option:selected').val(),
                type: 'GET',
                beforeSend: function () {
                    me.loadingTimers.push(setTimeout(function () {
                        $.mobile.loading('show');
                    }, 1000));
                },
                complete: function () {
                    me.clearTimeouts();
                    $.mobile.loading('hide');
                },
                success: function (resp) {
                    resp = JSON.parse(resp);
                    if (resp.status == 'OK') {
                        me.userExitCode = resp.data;
                    } else {
                        me.ajaxAlert($.mobile.activePage.attr('id'));
                    }
                },
                error: function () {
                    me.ajaxAlert($.mobile.activePage.attr('id'));
                }
            });
        }
    });

    /**
     * Bind message credits button
     */
    $('.messagecredits-button').live('click', function () {
        me.lastPageBeforeMessageCredits = $.mobile.activePage.attr('id');
        $.mobile.changePage('#messagecredits');
    });


    /**
     * Bind message name and content fields to change page title
     */
    $('#new-name, #new-content').live('keyup', function () {
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
     * Bind edit repeating message confirmation single message button
     */
    $('.edit-repeats .single').live('click', function () {
        me.editType = 'single';
        $('.dialog-overlay, .edit-repeats').hide();
        app.pages.newMessage.newActualSave();
    });
    /**
     * Bind edit repeating message confirmation all messages button
     */
    $('.edit-repeats .all').live('click', function () {
        me.editType = 'all';
        $('.dialog-overlay, .edit-repeats').hide();
        app.pages.newMessage.newActualSave();
    });
    /**
     * Bind edit repeating message confirmation cancel button
     */
    $('.edit-repeats .cancel').live('click', function () {
        $('.dialog-overlay, .edit-repeats').hide();
    });

    /**
     * Bind main nav new message button
     */
    $('.new-link').live('click', function (e) {
        e.preventDefault();
        me.reminding = false;
        me.editData = {};
        me.newPageResetFields();
        me.lastPageBeforeNew = $.mobile.activePage.attr('id');
        me.newDraft = true;
        $.mobile.changePage('#new', { transition: 'slide' });
    });

    /**
     * Bind main nav reminder button
     */
    $('.reminder-link').live('click', function (e) {
        e.preventDefault();
        me.reminding = true;
        me.newPageResetFields();
        me.lastPageBeforeNew = $.mobile.activePage.attr('id');
        $.mobile.changePage('#new', { transition: 'slide' });
    });

    /**
     * Bind back buttons throughout app
     */
    $('#new .back, #register .back, #forgotten .back, #verification .back, #terms .back, #status-dialog .back, #purchase .back, #settings .back, #account .back, #help .back, #help-1 .back, #help-2 .back, #help-3 .back, #help-4 .back, #help-5 .back, #help-6 .back, #help-7 .back, #messagecredits .back, #newgroup .back, #addcontactfromnumber .back').live('click', function () {
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
                prevId = 'help';
                break;
            case 'help-2':
                prevId = 'help-1';
                break;
            case 'help-3':
                prevId = 'help-2';
                break;
            case 'help-4':
                prevId = 'help-3';
                break;
            case 'help-5':
                prevId = 'help-4';
                break;
            case 'help-6':
                prevId = 'help-5';
                break;
            case 'help-7':
                prevId = 'help-6';
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
            $.mobile.changePage('#' + prevId, { reverse: true, transition: prevTransition });
        }
    });
};