$(function() {
    var locateStorageEnabled, jsonEnabled;

    // Check for localStorage and native JSON support
    locateStorageEnabled = ('localStorage' in window) && 
                            window['localStorage'] !== null;

    jsonEnabled = typeof (JSON) !== "undefined";

    // Initialize localStorage
    if (locateStorageEnabled && jsonEnabled) {
        var instruments = localStorage.dataMonitorOpenGroups;

        if (!instruments) {
            localStorage.dataMonitorOpenGroups = "[]";
        } else {
            $.each(JSON.parse(instruments), function (i, inst) {
                $(".datasource." + inst).show();
            });
        }
    }

    // Instrument click-handler
    $(".instrument").click(function (e) {
        var inst = $($(this).find("td")[0]).text();
        $(".datasource." + inst).toggle();

        if (locateStorageEnabled && jsonEnabled) {
            var instruments, index;

            instruments = JSON.parse(localStorage.dataMonitorOpenGroups);

            // Add or remove instrument from list of opened groups
            index = $.inArray(inst, instruments);
            if (index == -1) {
                instruments.push(inst);
            } else {
                instruments.splice(index, 1);
            }
            localStorage.dataMonitorOpenGroups = JSON.stringify(instruments);
        }
    });
    
    // Info popup
    $("#info").hover(function (e) {
        $("#legend").show();
    }, function (e) {
        $("#legend").hide();
    });
    
});