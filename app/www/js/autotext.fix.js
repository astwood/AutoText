$(document).on('focus', 'textarea', function() {
    setTimeout(function() {
        window.scrollTo(document.body.scrollTop);
    }, 0);
});

element.on('tap', 'textarea', function(e){element.focus()});
element.on('tap', 'input', function(e){element.focus()});