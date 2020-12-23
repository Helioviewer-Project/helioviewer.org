class WebGLUIHelper {
    constructor(){
        this.canvas = document.getElementById("draw-surface");;
        this.createEventListeners();

        //Hide UI elements that are not part of the WebGL client yet.
        const accordionEvents = document.getElementById("accordion-events");
        accordionEvents.classList.toggle('display-none');

        const accordionBodies = document.getElementById("accordion-bodies");
        accordionBodies.classList.toggle('display-none');

        const accordionMovies = document.getElementById("accordion-movies");
        accordionMovies.classList.toggle('display-none');

    }

    createEventListeners(){
        const canvas = document.getElementById("draw-surface");

        //WebGL enable/disable button
        document.getElementById('enable-webgl').addEventListener('click',function(){
            console.log('toggling canvas');
            document.getElementById("loading-status").classList.toggle('display-none');
            canvas.classList.toggle('display-none');
            canvas.classList.toggle('draw-surface');
            this.classList.toggle('active');

            //Find and toggle UI elements which are not part of the WebGL client yet.
            const accordionEvents = document.getElementById("accordion-events");
            accordionEvents.classList.toggle('display-none');

            const accordionBodies = document.getElementById("accordion-bodies");
            accordionBodies.classList.toggle('display-none');
            
            const accordionMovies = document.getElementById("accordion-movies");
            accordionMovies.classList.toggle('display-none');

            const accordionWebGLMovies = document.getElementById("accordion-webgl-movies");
            accordionWebGLMovies.classList.toggle('display-none');

        });

        //Zoom buttons
        document.getElementById("zoom-in-button").addEventListener('click',()=>{
            console.log("zoom in clicked");
            helioviewer._webGLClient.cameraDist -= helioviewer._webGLClient.cameraDist * 0.2;
            if(helioviewer._webGLClient.cameraDist <= 0.02){
                helioviewer._webGLClient.cameraDist = 0.02;
            }
        });
        document.getElementById("zoom-out-button").addEventListener('click',()=>{
            console.log("zoom out clicked");
            helioviewer._webGLClient.cameraDist += helioviewer._webGLClient.cameraDist * 0.25;
            if(helioviewer._webGLClient.cameraDist <= 0.02){
                helioviewer._webGLClient.cameraDist = 0.02;
            }
        });
    }

}