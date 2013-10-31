window.app = {
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
    showingSpamFailNotification: false
};

app.services = {    
    
};

app.pages = {    
    
};

app.caches = {
    contacts: []
};

app.initialize = function() {
    var me = this;
    $.mobile.loader.prototype.options.text = 'Loading...';
    $.mobile.defaultPageTransition = 'slide';
    
    $.ajaxSetup({
        timeout: 20000
    });

    me.doBinds();

    for (pi in app.pages) {
        var page = app.pages[pi];
        if (typeof page.init != "undefined") {
            page.init();
        }
    }

    var countryService = new app.services.CountryService();
    countryService.load();

    $('body').show();
};

app.alert = function(message, title, callback) {
    title = title == undefined ? 'Alert' : title;
    navigator.notification.alert(message, function () {
        callback && callback();
    }, title, 'OK');
};