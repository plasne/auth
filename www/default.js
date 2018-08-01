
$(document).ready(function () {

    // 302; bad example
    $("#service-302").click(function() {
        $.ajax({
            url: "/login",
            success: function() {
                $("#status").text("success!");
            },
            error: function(err) {
                $("#status").text(JSON.stringify(err));
            }
        });
    });
    
    // 401; good example
    $("#service-401").click(function() {
        $.ajax({
            url: "/redirect",
            success: function() {
                $("#status").text("success!");
            },
            error: function(err) {
                if (err.status === 401) {
                    window.location.href = "/login";
                } else {
                    $("#status").text(JSON.stringify(err));
                }
            }
        });
    });

});
