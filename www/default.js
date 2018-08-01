
/*
function getQuerystring(key, default_) {
    if (default_ == null) default_ = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return default_;
    else
        return qs[1];
}
*/

$(document).ready(function () {

    $("#service-login").click(function() {
        $.ajax({
            url: "/login",
            success: function() {
                $("#status").text("success!");
            },
            error: function(err) {
                $("#status").text(err);
            }
        });
    });
    
});
