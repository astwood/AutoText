$(document).on('focus', 'textarea', function() {
    setTimeout(function() {
        window.scrollTo(document.body.scrollTop);
    }, 0);
});

input.on('tap', function(e){element.focus()});
textarea.on('tap', function(e){element.focus()});