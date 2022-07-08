/* -------------- START pinch-to-zoom functionality -------------- */

var hvmobdist1=0;
function pinchStart(hvmobev) {
           if (hvmobev.targetTouches.length == 2) {//check if two fingers touched screen
               hvmobdist1 = Math.hypot( //get rough estimate of distance between two fingers
                hvmobev.touches[0].pageX - hvmobev.touches[1].pageX,
                hvmobev.touches[0].pageY - hvmobev.touches[1].pageY);                  
           }
    
    }
    function pinchMove(hvmobev) {
           if (hvmobev.targetTouches.length == 2 && hvmobev.changedTouches.length == 2) {
                 // Check if the two target touches are the same ones that started
               var hvmobdist2 = Math.hypot(//get rough estimate of new distance between fingers
                hvmobev.touches[0].pageX - hvmobev.touches[1].pageX,
                hvmobev.touches[0].pageY - hvmobev.touches[1].pageY);
                //alert(dist);
                if(hvmobdist1>hvmobdist2) {//if fingers are closer now than when they first touched screen, they are pinching
                  $('#zoom-out-button').delay(1000).trigger('click');
                }
                if(hvmobdist1<hvmobdist2) {//if fingers are further apart than when they first touched the screen, they are making the zoomin gesture
                   $('#zoom-in-button').delay(1000).trigger('click');
                }
           }
           
    }
        document.getElementById ('helioviewer-viewport').addEventListener ('touchstart', pinchStart, false);
        document.getElementById('helioviewer-viewport').addEventListener('touchmove', pinchMove, false);




/* -------------- END pinch-to-zoom functionality -------------- */
