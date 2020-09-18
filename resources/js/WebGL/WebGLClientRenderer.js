class WebGLClientRenderer {

    constructor(coordinates){
        this.playMovieState = true;
        this.coordinates = coordinates;
        window.addEventListener('tile-layers-ready',function(){
            helioviewer._webGLClient.start();
        });
    }

    async start(){
        this.initConstants();
        this.initGL();
        this.initInputEventListeners(this.canvas);
        this.createShaders();
        this.createWorldViewMatrices();
        this.UIAccordionLayers = this.getUIAccordionLayers();
        this.layerSources = this.UIAccordionLayers.map(layer => layer.id);
        await this.createImageLayers(this.determineAddedLayers());
        this.subscribePlayPause();

        //fetch the initial textures and start the render loop
        for(let layer of this.loadingImageLayerKeys){
            this.loadingImageLayers[layer].fetchTextures().then(() => {
                console.log("starting");
                this.switchToNewImageLayers = true;
                requestAnimationFrame(()=>{this.renderLoop();});
            });
        }
        
    }

    initConstants(){
        // 
        // CONSTANTS
        //
        //this.solarProjectionScale = 0.388;
        //this.frameCounterDOM = document.getElementById("frame-counter");
        this.frameRateCounter = setInterval(()=>{this.countFPS();},1000);

        this.sunTextures = [];
        this.render = false;
        this.enableWebGL = true;

        this.targetFps = 35;
        this.targetFrameTime = 1000/this.targetFps;
        this.frameNumber = 0;
        this.lastFrameNumber = 0;
        this.currentFPS = 0;
        this.lastFrameTime = 0;
        
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.lastMousePosition = { x: 0, y: 0};
        this.mouseDelta = { x: 0, y: 0};
        this.mouseRotationOffset = { x: 0, y: 0};
        this.mouseTranslationOffset = { x: 0, y: 0};
        this.mouseSensitivity = 0.15;
        this.zoomSensitivity = 0.05;
        this.translateSensitivity = 0.002;
        this.cameraDist= 2;

        this.clearLuminance = 0.0;

        this.dateTimeString = document.getElementById('date').value.split('/').join("-") +"T"+ document.getElementById('time').value+"Z";
        this.layerSources = [];
        // image layers in the render loop must be seperate from loading image layers.
        this.imageLayerKeys = [];
        this.imageLayers = {};
        this.loadingImageLayerKeys = [];
        this.loadingImageLayers = {};
        this.switchToNewImageLayers = false;
    }

    initGL(){
        //
        // INIT GL
        //
        this.canvas = document.getElementById("draw-surface");
        this.gl = this.canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false});
        if(!this.gl){
            console.log("webgl not supported, falling back to expriemental-webgl context");
            this.gl = this.canvas.getContext('experimental-webgl', { premultipliedAlpha: false, antialias: false});
        }
        if(!this.gl){
            console.log("your browser does not support webgl :[");
        }

        this.gl.clearColor(this.clearLuminance,this.clearLuminance,this.clearLuminance,1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        this.gl.enable(this.gl.BLEND);
        //this.gl.enable(this.gl.DEPTH_TEST); // will perform a depth test on the raster for every pixel in the fragment
        this.gl.enable(this.gl.CULL_FACE); // removes a face from being rastered
        this.gl.frontFace(this.gl.CCW); // counter clockwise ordering of vertices determiens the front face
        this.gl.cullFace(this.gl.BACK); // explicitly performs the cull on the back faces, can be used on the front

    }

    createShaders(){
        var vertexShaderText = 
        `precision mediump float;

        attribute vec3 position;
        attribute vec2 texcoord;
        varying vec2 fragTexCoord;
        uniform mat4 mWorld;
        uniform mat4 mView;
        uniform mat4 mProj;
        uniform mat4 mCamera;
        uniform mat4 mSpacecraft;
        uniform mat4 mPlane;
        uniform float scale;
        uniform float planeWidth;
        uniform bool uProjection;
        uniform float uXOffset;
        uniform float uYOffset;
        uniform bool uReversePlane;

        void main()
        {
            if(uProjection && !uReversePlane){
                vec4 pos = mCamera * mView * mWorld * mSpacecraft * mPlane * vec4(position, 1.0);
                gl_Position = pos;
                float texPosX = (position.x-uXOffset) / scale / planeWidth;
                float texPosY = (position.y+uYOffset)/ scale / planeWidth;
                float texPosZ = position.z / scale / planeWidth;
                vec4 texPos = mView * vec4(texPosX, texPosY, texPosZ, 1.0);
                vec2 texPosOffset = vec2((texPos.x)*scale + 0.5, 1.0 - (texPos.y*scale + 0.5));
                fragTexCoord = texPosOffset.xy;
            }else{
                if(uReversePlane){
                    vec4 pos = mCamera * mView * mWorld * mSpacecraft * mPlane * vec4(position.x+uXOffset,position.y,position.z+uYOffset, 1.0);
                    gl_Position = pos;
                    fragTexCoord = vec2(1.0 - texcoord.x, texcoord.y);
                }else{
                    vec4 pos = mCamera * mView * mWorld * mSpacecraft * mPlane * vec4(position.x+uXOffset,position.y,position.z-uYOffset, 1.0);
                    gl_Position = pos;
                    fragTexCoord = vec2(1.0 - texcoord.x, 1.0 - texcoord.y);
                }
            }
        }`;

        var fragmentShaderText = 
        `precision mediump float;

        varying vec2 fragTexCoord;
        uniform sampler2D sunSampler;
        uniform sampler2D colorSampler;
        uniform bool planeShader;
        uniform float uAlpha;
        uniform bool uReversePlane;

        void main()
        {
            vec4 sunColor = texture2D(sunSampler, fragTexCoord);
            if(planeShader){
                if(uReversePlane){
                    gl_FragColor = vec4(sunColor.x,sunColor.y,sunColor.z,0.0);
                    gl_FragColor.rgb *= uAlpha;
                }else{
                    vec4 texColor =  texture2D(colorSampler, sunColor.xx);
                    gl_FragColor = vec4(texColor.x,texColor.y,texColor.z,0.0);
                    gl_FragColor.rgb *= uAlpha;
                }
                // if(sunColor.x <= 0.05){
                //     gl_FragColor = vec4(texColor.x,texColor.y,texColor.z,0.0*uAlpha);
                //     gl_FragColor.rgb *= uAlpha;
                // }else{
                //     gl_FragColor = vec4(texColor.x,texColor.y,texColor.z,texColor.w * uAlpha);
                //     gl_FragColor.rgb *= uAlpha;
                // }
            }else{
                vec4 fragColor = texture2D(colorSampler, sunColor.xx);
                gl_FragColor =  vec4(fragColor.x, fragColor.y, fragColor.z, fragColor.w * uAlpha);
                gl_FragColor.rgb *= uAlpha;
            }
        }`;

        this.programInfo = twgl.createProgramInfo(this.gl, [vertexShaderText,fragmentShaderText]);
        // tell OpenGl state machine which program should be active
        this.gl.useProgram(this.programInfo.program);
    }

    initInputEventListeners(canvas){
        //Mouse events
        canvas.addEventListener('mousemove', evt => {
            if(this.rightMouseDown){
                var mousePosition = this.getMousePos(canvas, evt);
                this.mouseDelta.x = mousePosition.x - this.lastMousePosition.x;
                this.mouseDelta.y = this.lastMousePosition.y - mousePosition.y;
    
                this.mouseRotationOffset.x += this.mouseDelta.x;
                this.mouseRotationOffset.y += this.mouseDelta.y;
    
                this.lastMousePosition.x = mousePosition.x;
                this.lastMousePosition.y = mousePosition.y;
            }
            if(this.leftMouseDown){
                var mousePosition = this.getMousePos(canvas, evt);
                this.mouseDelta.x = mousePosition.x - this.lastMousePosition.x;
                this.mouseDelta.y = this.lastMousePosition.y - mousePosition.y;
    
                this.mouseTranslationOffset.x += this.mouseDelta.x * this.cameraDist;
                this.mouseTranslationOffset.y += this.mouseDelta.y * this.cameraDist;
    
                this.lastMousePosition.x = mousePosition.x;
                this.lastMousePosition.y = mousePosition.y;
            }
        }, false);
    
        canvas.addEventListener('mousedown', evt => {
            if(evt.button == 2){// right mouse button
                this.rightMouseDown = true;
                this.lastMousePosition = this.getMousePos(canvas, evt);
            }else if(evt.button == 0){// left mouse button
                this.leftMouseDown = true;
                this.lastMousePosition = this.getMousePos(canvas, evt);
            }
        }, false);
        canvas.addEventListener('mouseup', evt => {
            if(evt.button == 2){// right mouse button
                this.rightMouseDown = false;
                this.mouseDelta.x = 0;
                this.mouseDelta.y = 0;
            }else if(evt.button == 0){// left mouse button
                this.leftMouseDown = false;
                this.mouseDelta.x = 0;
                this.mouseDelta.y = 0;
            }
        }, false);
        canvas.addEventListener("wheel", evt => {
            var wheelDirection = Math.sign(evt.deltaY);
            if(this.cameraDist > 1){
                this.cameraDist += (wheelDirection * this.cameraDist * this.zoomSensitivity);
            }else if(this.cameraDist <= 1 && this.cameraDist >= 0.02){
                this.cameraDist += (wheelDirection * this.cameraDist * this.zoomSensitivity);
            }
            if(this.cameraDist <= 0.02){
                this.cameraDist = 0.02;
            }
            evt.preventDefault();
        });
        canvas.addEventListener('contextmenu', evt =>{
            evt.preventDefault();
        });
        document.getElementById('enable-webgl').addEventListener('click',function(){
            console.log('toggling canvas');
            document.getElementById("loading-status").classList.toggle('display-none');
            canvas.classList.toggle('display-none');
            canvas.classList.toggle('draw-surface');
            this.classList.toggle('active');
        });
        window.addEventListener('request-new-textures',e=>{
            console.log("caught request-new-textures")
            helioviewer._webGLClient.requestMovie();
        });
        window.addEventListener('update-data-source',e=>{
            helioviewer._webGLClient.changeLayerDataSource(e.detail.id, e.detail.sourceId);
        });
        window.addEventListener('update-layer-order',e=>{
            helioviewer._webGLClient.updateLayerOrder(e.detail.layerOrder);
        })
    }

    updateLayerOrder(newLayerOrder){
        this.imageLayerKeys = newLayerOrder;
    }

    async changeLayerDataSource(id, sourceId){
        this.UIAccordionLayers = this.getUIAccordionLayers();
        let layerToChange = this.UIAccordionLayers.filter(layer=>layer.id == id);

        console.log('layerToChange',layerToChange);
        if(layerToChange.length){
            await this.createImageLayers(layerToChange);
        }
        
        for(let layer of this.loadingImageLayerKeys){
            this.loadingImageLayers[layer].fetchTextures();
        }
    }

    createWorldViewMatrices(){
        //
        // CREATE WORLD VIEW MATRICES
        //
        this.identityMatrix = new Float32Array(16);
        this.worldMatrix = new Float32Array(16);
        this.viewMatrix = new Float32Array(16);
        this.projMatrix = new Float32Array(16);
        this.cameraMatrix = new Float32Array(16);
        glMatrix.mat4.identity(this.identityMatrix);
        glMatrix.mat4.identity(this.worldMatrix);
        glMatrix.mat4.identity(this.cameraMatrix);
        glMatrix.mat4.lookAt(this.viewMatrix, [0,0,-100], [0,0,0], [0,1,0]);
        glMatrix.mat4.ortho(this.projMatrix, -this.cameraDist, this.cameraDist, -this.cameraDist, this.cameraDist, 0.1, 100000.0);

        this.xRotationMatrix = new Float32Array(16);
        this.yRotationMatrix = new Float32Array(16);
        this.xTranslationMatrix = new Float32Array(16);
        this.yTranslationMatrix = new Float32Array(16);
        glMatrix.mat4.identity(this.xRotationMatrix);
        glMatrix.mat4.identity(this.yRotationMatrix);
        glMatrix.mat4.identity(this.xTranslationMatrix);
        glMatrix.mat4.identity(this.yTranslationMatrix);

        this.worldRotateMatrix = new Float32Array(16);
        this.worldTranslateMatrix = new Float32Array(16);
        glMatrix.mat4.identity(this.worldRotateMatrix);
        glMatrix.mat4.identity(this.worldTranslateMatrix);
    }

    async createImageLayers(newLayers){
        //mark base layer for 100% opacity application.
        var baseLayer = true;
        for(let layer of newLayers){
            this.loadingImageLayers[layer.id] = new RenderSourceLayer(this.gl, this.programInfo, layer.id, layer.image.sourceId, baseLayer, layer.opacity, layer.visible);
            this.loadingImageLayers[layer.id].setColorTable();
            //await this.loadingImageLayers[layerIndex].setSourceParams(source);
            this.loadingImageLayers[layer.id].createShapeVertexBuffers();//Needs to be per frame
            this.loadingImageLayers[layer.id].setMatrices({
                identityMatrix  : this.identityMatrix,
                worldMatrix     : this.worldMatrix,
                viewMatrix      : this.viewMatrix,
                projMatrix      : this.projMatrix,
                cameraMatrix    : this.cameraMatrix
            });
            this.loadingImageLayers[layer.id].createViewMatricesAndObjects(this.cameraDist);//Needs to be per frame
            baseLayer = false;
            this.loadingImageLayerKeys.push(layer.id);
            //layerIndex++;
        }
        this.switchToNewImageLayers = true;
        console.log("createImageLayers loadingImageLayers",this.loadingImageLayers);
    }

    subscribePlayPause() {
        for(let layer of this.imageLayerKeys){
            this.imageLayers[layer].updatePlayPause(this.playMovieState);
        }
    }

    renderLoop() {
        //console.log(this.render);
        if(this.isAllReady()){
            this.render = true;
        }
        if(this.render){
            //resize viewport
            this.resizeCameraView();

            //clear the screen
            this.gl.clearColor(this.clearLuminance,this.clearLuminance,this.clearLuminance,1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            //rotate world transforms
            this.rotateWorld();

            this.updateGlobalFrameCounter();

            //draw reverse planes
            for(let layer of this.imageLayerKeys){
                this.imageLayers[layer].updateFrameCounter(this.frameNumber);
                this.imageLayers[layer].bindTexturesAndUniforms();
                this.imageLayers[layer].drawReversePlanes();
            }
            //draw planes
            for(let layer of this.imageLayerKeys){
                this.imageLayers[layer].updateFrameCounter(this.frameNumber);//update frame counter, used for choosing texture
                this.imageLayers[layer].bindTexturesAndUniforms();
                this.imageLayers[layer].drawPlanes();
            }
            //draw spheres
            for(let layer of this.imageLayerKeys){
                this.imageLayers[layer].updateFrameCounter(this.frameNumber);
                this.imageLayers[layer].bindTexturesAndUniforms();
                this.imageLayers[layer].drawSpheres();
            }
        }
        //request new frame
        requestAnimationFrame(()=>{this.renderLoop();});
    };

    isAllReady(){
        //each layer will set its own layerReady flag
        var allLayersReady = this.loadingImageLayerKeys.length > 0 ? true : false;
        for(let layer of this.loadingImageLayerKeys){
            if(!this.loadingImageLayers[layer].layerReady){
                allLayersReady = false;
                //console.log(this.loadingImageLayers[layer].layerReady);
            }
        }
        //switchToNewImageLayers ensures only one switch happens and is set when a new set of layers is defined
        if(this.switchToNewImageLayers && allLayersReady){
            this.changeToNewImageLayers();
            this.switchToNewImageLayers = false;
        }
        return allLayersReady;
    }

    changeToNewImageLayers(){
        console.log("---changeToNewImageLayers---")
        console.log("before: imageLayers", this.imageLayers);
        console.log("before: imageLayerKeys", this.imageLayerKeys);
        console.log("before: loadingImageLayers", this.loadingImageLayers);
        console.log("before: loadingImageLayerKeys", this.loadingImageLayerKeys);
        this.tempImageLayers = {...this.imageLayers, ...this.loadingImageLayers};
        console.log("tempImageLayers",this.tempImageLayers);
        console.log("layerSources",this.layerSources);
        //this.imageLayerKeys = [...this.imageLayerKeys, ...this.loadingImageLayerKeys];
        this.imageLayers = {};
        this.imageLayerKeys = [];
        for(let id of this.layerSources){
            for(let layerKey of Object.keys(this.tempImageLayers)){
                if(this.tempImageLayers[layerKey].id == id){
                    this.imageLayers[layerKey] = this.tempImageLayers[layerKey];
                    this.imageLayerKeys.push(layerKey);
                    break;
                }
            }
        }
        this.loadingImageLayers = {};
        this.loadingImageLayerKeys = [];
        this.tempImageLayers = {};
        console.log("after: imageLayers", this.imageLayers);
        console.log("after: imageLayerKeys", this.imageLayerKeys);
        this.setBaseLayer();
    }

    setBaseLayer(){
        let baseLayerSet = false;
        for(let layerKey of this.imageLayerKeys){
            const layer = this.imageLayers[layerKey];
            if(!baseLayerSet && layer.visible && layer.alpha > 0){
                layer.baseLayer = true;
                baseLayerSet = true;
            }
            else{
                layer.baseLayer = false;
            }
        }
    }

    resizeCameraView(){
        twgl.resizeCanvasToDisplaySize(this.gl.canvas);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        
        //width > height
        if(this.gl.canvas.clientWidth > this.gl.canvas.clientHeight){
            //height is fixed, width distances calculated
            const aspectRatio = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
            const left = -(this.cameraDist * aspectRatio) ;
            const right = (this.cameraDist * aspectRatio) ;
            glMatrix.mat4.ortho(this.cameraMatrix, left, right, -this.cameraDist, this.cameraDist, 0.1, 100000.0);
        }else{//height > width
            //width is fixed, height distance is calculated
            const aspectRatio = this.gl.canvas.clientHeight / this.gl.canvas.clientWidth;
            const bottom = -(this.cameraDist * aspectRatio);
            const top = (this.cameraDist * aspectRatio);
            glMatrix.mat4.ortho(this.cameraMatrix, -this.cameraDist, this.cameraDist, bottom, top, 0.1, 100000.0);
        }
        glMatrix.mat4.ortho(this.projMatrix, -this.cameraDist, this.cameraDist, -this.cameraDist, this.cameraDist, 0.1, 100000.0);

    }

    rotateWorld(){
        for(let layer of this.imageLayerKeys){
            //console.log(layer);
            this.imageLayers[layer].setCameraDistScale(this.cameraDist,this.projMatrix);
        }
        if(this.rightMouseDown){
            glMatrix.mat4.rotate(this.yRotationMatrix, this.identityMatrix, this.degreesToRad(this.mouseRotationOffset.x * this.mouseSensitivity) , [0,1,0]);//rotating around y-axis uses offset from input on x-axis
            glMatrix.mat4.rotate(this.xRotationMatrix, this.identityMatrix, this.degreesToRad(this.mouseRotationOffset.y * this.mouseSensitivity) , [1,0,0]);//rotating around x-axis uses offset from input on y-axis
        }else if(this.leftMouseDown){
            glMatrix.mat4.translate(this.yTranslationMatrix, this.identityMatrix, glMatrix.vec3.fromValues(0,this.mouseTranslationOffset.y * this.translateSensitivity,0));
            glMatrix.mat4.translate(this.xTranslationMatrix, this.identityMatrix, glMatrix.vec3.fromValues(-this.mouseTranslationOffset.x * this.translateSensitivity,0,0));
        }
        glMatrix.mat4.mul(this.worldRotateMatrix, this.yRotationMatrix, this.xRotationMatrix);
        glMatrix.mat4.mul(this.worldTranslateMatrix, this.yTranslationMatrix, this.xTranslationMatrix);
        glMatrix.mat4.mul(this.worldMatrix, this.worldTranslateMatrix, this.worldRotateMatrix);

    }

    look(){
        //let target = glMatrix.vec3.fromValues(-this.mouseTranslationOffset.x * this.translateSensitivity,this.mouseTranslationOffset.y * this.translateSensitivity,0);
        let origin = glMatrix.vec3.fromValues(0,0,0);
        for(let layer of this.imageLayerKeys){
            this.imageLayers[layer].look(origin);
        }
    }

    updateGlobalFrameCounter(){
        if(this.playMovieState){// only when movie is playing
            if(this.lastFrameTime != 0){// every frame after the first
                var currentFrameTime = performance.now();
                this.timeElapsedSinceLastFrame = currentFrameTime - this.lastFrameTime;
                if(this.timeElapsedSinceLastFrame==0){
                    this.timeElapsedSinceLastFrame=1;
                }
                //turn time diff into num frames and floor
                var numberOfFramesElapsed = Math.floor(this.timeElapsedSinceLastFrame/ this.targetFrameTime);
                if(numberOfFramesElapsed > 0){
                    //update frame number
                    this.frameNumber += numberOfFramesElapsed;
                    //set last frame time to computed current frame time
                    this.lastFrameTime = currentFrameTime;
                }
            }else{// only run once on init to start at frame 0
                this.lastFrameTime = performance.now();
                this.frameNumber = 0;
            }
        }else{//when movie is paused
            this.lastFrameTime=performance.now();
        }
    }

    countFPS(){
        this.currentFPS = this.frameNumber - this.lastFrameNumber
        this.lastFrameNumber = this.frameNumber;
        //this.frameCounterDOM.innerText = this.currentFPS + "fps";
    }

    degreesToRad(deg){
        return deg * Math.PI/180;
    }
    
    async requestMovie(){
        //basic input validation
        //this.validateUIRequestInput();
        console.log("this.dateTimeString",this.dateTimeString);

        console.log("layerSourcesBefore",this.layerSources);
        //pause all layers
        /*for(let layer of this.imageLayerKeys){
            this.imageLayers[layer].updatePlayPause(false);//set play movie state to false
        }*/
        //set new layer sources
        this.UILayerSources = this.getUIImageSources();
        this.UIAccordionLayers = this.getUIAccordionLayers();
        let addedLayers = this.determineAddedLayers();
        this.determineRemovedLayersAndRemoveThem();
        console.log("added layers: ", addedLayers);
        if(addedLayers.length){
            await this.createImageLayers(addedLayers);
        }
        
        for(let layer of this.loadingImageLayerKeys){
            this.loadingImageLayers[layer].fetchTextures();
        }

        this.layerSources = this.UIAccordionLayers.map(layer => layer.id);

        //requestMovie is caught when opacity or visibility on any given layer changes.
        this.changeLayerOpacityAndVisibility();
        console.log("layerSourcesAfter",this.layerSources);
        console.log("imageLayers", this.imageLayers);
        
    }

    changeLayerOpacityAndVisibility(){
        for(let layer of this.UIAccordionLayers){
            if(typeof(this.imageLayers[layer.id]) != undefined){
                this.imageLayers[layer.id].setAlpha(layer.opacity);
                this.imageLayers[layer.id].setVisible(layer.visible);
            }
        }
        this.setBaseLayer();
    }

    getUIAccordionLayers(){
        let newAccordionLayerSources = [];
        for(let layer of helioviewer.viewport._tileLayerManager._layers){
            newAccordionLayerSources.push(layer);
        }
        //set new layer sources
        return newAccordionLayerSources;
    }

    getUIImageSources(){
        let newAccordionLayerSources = [];
        for(let layer of helioviewer.viewport._tileLayerManager._layers){
            newAccordionLayerSources.push(layer);
        }
        //set new layer sources
        return newAccordionLayerSources.map(layer => layer.image.sourceId);
    }

    determineAddedLayers() {
        let addedLayers = [];
        let newDateTimeString = document.getElementById('date').value.split('/').join("-") +"T"+ document.getElementById('time').value+"Z";
        //when the time doesn't change we must determine which layers were added
        if(newDateTimeString == this.dateTimeString){
            console.log("time same: finding and loading necessary new layers if any");
            let UIIdArray = this.UIAccordionLayers.map(val => val.id);
            let RenderIdArray = Object.values(this.imageLayers).map(val => val.id);
            let addedUIIdsArray = UIIdArray.filter(id => !RenderIdArray.includes(id));
            if(addedUIIdsArray.length){
                for(let layer of this.UIAccordionLayers){
                    if(addedUIIdsArray.includes(layer.id)){
                        addedLayers.push(layer);
                    }
                }
                this.switchToNewImageLayers = true;
            }
            return addedLayers;
        }else{//otherwise when the time changes we need to reload all layers.
            console.log("time changed: loading all layers")
            this.loadingImageLayers = {};
            this.loadingImageLayerKeys = [];
            this.switchToNewImageLayers = true;
            this.dateTimeString = newDateTimeString;
            return this.UIAccordionLayers;
        }
    }

    determineRemovedLayersAndRemoveThem() {
        let UIIdArray = this.UIAccordionLayers.map(val => val.id);
        let RenderIdArray = Object.values(this.imageLayers).map(val => val.id);
        let removedUIIdsArray = RenderIdArray.filter(id => !UIIdArray.includes(id));
        if(removedUIIdsArray.length){
            for(let layer of this.imageLayerKeys){
                if(removedUIIdsArray.includes(this.imageLayers[layer].id)){
                    delete this.imageLayers[layer];
                }
            }
            this.imageLayerKeys = Object.keys(this.imageLayers);
        }
    }
    
    validateUIRequestInput(){
        //basic input validation
        var numFramesInput = parseInt(document.getElementById('numFramesInput').value);
        var reduceInput = parseInt(document.getElementById('reduceInput').value);
        var reduce = Math.min(2,Math.max(reduceInput,0));
        document.getElementById('reduceInput').value = reduce;
        var maxSensibleFrames = 600;
        
        var scaleFactor = Math.pow(Math.pow(2,reduce),2);
        if(numFramesInput > maxSensibleFrames * scaleFactor){
            document.getElementById('numFramesInput').value = maxSensibleFrames * scaleFactor;
            document.getElementById("numFramesStatus").innerText = "Let's not go overboard :) You probably don't have enough VRAM to load more than "+(maxSensibleFrames * scaleFactor)+" frames."
        }else if(numFramesInput < 0){
            document.getElementById('numFramesInput').value = Math.abs(numFramesInput);
            document.getElementById("numFramesStatus").innerText = "Positive numbers only :)";
        }else if(numFramesInput == 0){
            document.getElementById('numFramesInput').value = 30;
            document.getElementById("numFramesStatus").innerText = "You're gonna need a few frames :)";
        }else{
            document.getElementById("numFramesStatus").innerText = "";
        }
    }
    
    getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    playPauseButtonPressed() {
        this.playMovieState = !this.playMovieState;
        var playPauseButtonText = this.playMovieState ? "Pause" : "Play"
        document.getElementById("webgl-play-pause-button").innerText = playPauseButtonText;
        for(let layer of this.imageLayerKeys){
            this.imageLayers[layer].updatePlayPause(this.playMovieState);
        }
    }

}