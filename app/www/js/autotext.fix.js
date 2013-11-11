$(document).on('focus', 'textarea', function() {
    setTimeout(function() {
        window.scrollTo(document.body.scrollTop);
    }, 0);
});

input.on('focus', function(e){element.focus()});
textarea.on('focus', function(e){element.focus()});