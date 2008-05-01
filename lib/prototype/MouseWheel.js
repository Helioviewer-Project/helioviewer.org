/*
* Orginal: http://adomas.org/javascript-mouse-wheel/
* prototype extension by "Frank Monnerjahn" themonnie @gmail.com
*/
Object.extend(Event, {
    wheel:function (event){
        var delta = 0;
        if (!event) event = window.event;
        if (event.wheelDelta) {
            delta = event.wheelDelta/120;
            if (window.opera) delta = -delta;
        } else if (event.detail) { delta = -event.detail/3;  }
        return Math.round(delta); //Safari Round
    }
});
/*
* end of extension
*/

var counterSite=0;
function handleSite(e) {
    counterSite += Event.wheel(e);
    $('delta').innerHTML = counterSite +'#'+ Event.wheel(e) + ": " + (Event.wheel(e) <0 ? 'down' : 'up' );
}

var counterDIV=0;
function handleDIV(e) {
    counterDIV += Event.wheel(e);
    $('divdelta').innerHTML = counterDIV +'#'+ Event.wheel(e) + ": " + (Event.wheel(e) <0 ? 'down' : 'up' );
}
