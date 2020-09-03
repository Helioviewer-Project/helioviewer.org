class RenderSourceLayer {
    constructor(gl,programInfo,sourceId,baseLayer,alpha){
        this.gl = gl;
        this.programInfo = programInfo;
        this.sourceId = sourceId;
        this.renderReel = []; //formerly this.textures
        this.colorTable;
        //this.solarProjectionScale = 0.3985;//0.388 rough esitmate for projection when RSUN_OBS=1;
        this.RSUN_OBS = 0.97358455;//sun radius in arcseconds / 1000
        this.arcSecondRatio = 1.0 / this.RSUN_OBS;
        this.baseLayer = baseLayer;

        if(baseLayer){
            this.alpha = 1.0;
        }else{
            this.alpha = alpha;
        }
        this.alpha = 1.0;

        this.sourceName = new SourceLayerHelper(sourceId);
        this.drawSphere = this.sourceName.drawSphere;

        this.playMovieState = true;
        this.layerReady = false;
    }

    async setColorTable(){
        const colorTableName = this.sourceName.colorTableName;
        console.log('setcolortable',colorTableName);
        const textureOptions = {
            src: colorTableName,
            internalFormat: this.gl.RGB,
            format: this.gl.RGB,
            mag: this.gl.LINEAR,
            min: this.gl.LINEAR,
            wrapS: this.gl.CLAMP_TO_EDGE,
            wrapT: this.gl.CLAMP_TO_EDGE
        }

        await new Promise(r => {this.colorTable = twgl.createTexture(this.gl,textureOptions,r)});
    }

    //Gets information for image centering and scale
    //TODO:
    // This is a mess, maybe extract into a helper file
    /*async setSourceParams(sourceId){
        var input = this.prepareInputBeforeFrames();
        var getClosestImageURL = Helioviewer.api + "/?action=getClosestImage&sourceId="+this.sourceId+"&date="+new Date(input.timeStart * 1000).toISOString();
        await fetch(getClosestImageURL).then(res => {return res.json()}).then(data => {
            console.log(data);
            this.imageID = data.id;
            this.maxResPixels = data.width;
            this.arcSecPerPix = data.scale;
            this.centerPixelX = data.refPixelX;
            this.centerPixelY = data.refPixelY;
            this.planeWidth = this.arcSecondRatio*this.maxResPixels*this.arcSecPerPix / 1000;
            this.solarProjectionScale = this.RSUN_OBS / this.planeWidth;
            this.planeOffsetX = (this.centerPixelX - (this.maxResPixels * 0.5) ) / (this.maxResPixels * 0.5) * this.planeWidth * 0.5;
            this.planeOffsetY = (this.centerPixelY - (this.maxResPixels * 0.5)) / (this.maxResPixels * 0.5) * this.planeWidth * 0.5;
            if(!this.drawSphere){
                this.solarProjectionScale /= this.planeWidth/2.5;
            }
        });
    }*/

    //Needs to be per frame
    createShapeVertexBuffers(){
        //
        // CREATE SHAPE VERTEX BUFFERS
        //
        if(this.drawSphere){
            this.sphereBuffer = twgl.primitives.createSphereBufferInfo(this.gl, this.RSUN_OBS, 128, 64, 0, Math.PI, Math.PI, 2 * Math.PI); // only create half of the sphere
        }
        this.planeBuffer = twgl.primitives.createPlaneBufferInfo(this.gl,this.planeWidth,this.planeWidth);
    }
    
    //called with WebGLClientRenderer createImageLayers
    //Needs to be per frame
    createViewMatricesAndObjects(cameraDist){
        //
        // CREATE OBJECT MATRICES AND OFFSETS
        //
        this.origin = glMatrix.vec3.fromValues(0,0,0);
        this.up = glMatrix.vec3.fromValues(0,1,0);

        this.spacecraftViewMatrix = new Float32Array(16);
        this.planeViewMatrix = new Float32Array(16);
        glMatrix.mat4.identity(this.spacecraftViewMatrix);
        glMatrix.mat4.identity(this.planeViewMatrix);

        this.planeRotateUpVector = [1,0,0];
        this.planeRotateRadians = this.degreesToRad(-90);//by default this plane looks at the solar north pole
        glMatrix.mat4.rotate(this.planeViewMatrix, this.identityMatrix, this.planeRotateRadians, this.planeRotateUpVector);

        const uniformsPlane = {
            mWorld: this.worldMatrix,
            mView: this.viewMatrix,
            mProj: this.projMatrix,
            mCamera: this.cameraMatrix,
            mSpacecraft: this.spacecraftViewMatrix,
            mPlane: this.planeViewMatrix,
            scale: this.solarProjectionScale*cameraDist,
            planeWidth: this.planeWidth,
            sunSampler: this.colorTable,
            colorSampler: this.colorTable,
            planeShader: true,
            uAlpha: this.alpha,
            uProjection: false,
            uReversePlane: false,
            uXOffset: this.planeOffsetX,
            uYOffset: this.planeOffsetY
        }

        //
        // CREATE UNIFORMS
        //
        const uniformsSphere = {
            mWorld: this.worldMatrix,
            mView: this.viewMatrix,
            mProj: this.projMatrix,
            mCamera: this.cameraMatrix,
            mSpacecraft: this.spacecraftViewMatrix,
            mPlane: this.identityMatrix,
            scale: this.solarProjectionScale*cameraDist,
            planeWidth: this.planeWidth,
            sunSampler: this.colorTable,
            colorSampler: this.colorTable,
            planeShader: false,
            uAlpha: this.alpha,
            uProjection: true,
            uReversePlane: false,
            uXOffset: this.planeOffsetX,
            uYOffset: this.planeOffsetY
        }

        // CREATE OBJECTS

        let planeObject = [];
        let sphereObject = [];

        planeObject.push({
            programInfo: this.programInfo,
            bufferInfo: this.planeBuffer,
            uniforms: uniformsPlane
        });

        sphereObject.push({
            programInfo: this.programInfo,
            bufferInfo: this.sphereBuffer,
            uniforms: uniformsSphere
        });

        this.drawInfo = [planeObject, sphereObject];
    }

    setMatrices(matrices){
        this.matrices = matrices;
        this.identityMatrix = matrices.identityMatrix;
        this.worldMatrix = matrices.worldMatrix;
        this.viewMatrix = matrices.viewMatrix;
        this.projMatrix = matrices.projMatrix;
        this.cameraMatrix = matrices.cameraMatrix;
    }
    
    updateFrameCounter(frameNumber){
        if(this.playMovieState){
            this.frameCounter = (frameNumber % this.renderReel.length) + 1;;
            //this.frameCounter = Math.floor((performance.now() / 1000 * 30 )% this.textures.length) + 1;
        }
        //glMatrix.mat4.ortho(this.projMatrix, -camera.cameraDist, camera.cameraDist, -camera.cameraDist, camera.cameraDist, 0.1, 1000.0);
    }

    setCameraDistScale(cameraDist,projMatrix){
        this.cameraDist = cameraDist;
        //plane object uniforms
        //this.drawInfo[0][0].uniforms.scale = this.solarProjectionScale * cameraDist;
        this.drawInfo[0][0].uniforms.mProj = projMatrix;
        //sphere object uniforms
        //this.drawInfo[1][0].uniforms.scale = this.solarProjectionScale * cameraDist;
        this.drawInfo[1][0].uniforms.mProj = projMatrix;
    }

    /*
    async look(){
        const currentFrame = this.renderReel[this.frameCounter-1];
        let origin = glMatrix.vec3.fromValues(0,0,0);
        let up = glMatrix.vec3.fromValues(0,1,0);
        let input = this.prepareInputBeforeFrames();
        let utc = new Date(input.timeStart * 1000).toISOString();
        console.log(this.sourceId, this.sourceName.satelliteName);
        let outCoords = await helioviewer._coordinateSystemsHelper.getPositionHCC(currentFrame.timestamp, this.sourceName.satelliteName, "SUN");
        let targetCoords = glMatrix.vec3.fromValues(outCoords.x,outCoords.y,outCoords.z);
        glMatrix.mat4.lookAt(this.spacecraftViewMatrix, origin, targetCoords, up );
    }*/

    async fetchTextures(){
        var newRenderReel = [];
        this.inputTemporalParams = this.prepareInputBeforeFrames();
        var loadingStatusDOM = document.getElementById("loading-status");

        //create callback to check all frames are ready
        const isReady = (time) => {
            console.log('fetchTextures-isReady-callback',time);
            var ready = true;
            //console.log(newRenderReel);
            if(newRenderReel.length == this.inputTemporalParams.numFrames){
                for(var frame of newRenderReel){
                    if(frame.ready.all == false){
                        ready = false;
                    }
                }
                if(ready == true){
                    loadingStatusDOM.innerText = "Loaded " + this.inputTemporalParams.numFrames + " frames"
                    this.renderReel = newRenderReel;
                    this.layerReady = true;
                    console.log("fetchTextures-isReady-actually ready, should fire once per layer",time);
                }
            }
        }

        const textureReady = (renderFrame,texture) =>{
            renderFrame.setTexture(texture,isReady);
        }
        //this.getSatellitePositions();
        for(var i=1;i<this.inputTemporalParams.numFrames+1;i++){
            //build the texture options
            var reqTime = this.inputTemporalParams.timeStart + (this.inputTemporalParams.timeIncrement * (i-1));
            var textureOptions = {
                src: Helioviewer.api + "/?action=getTexture&unixTime="+reqTime+"&sourceId="+this.sourceId+"&reduce="+this.inputTemporalParams.reduceResolutionLevel,
                internalFormat: this.gl.LUMINANCE,
                format: this.gl.LUMINANCE,
                mag: this.gl.NEAREST,
                min: this.gl.LINEAR,
                wrapS: this.gl.CLAMP_TO_EDGE,
                wrapT: this.gl.CLAMP_TO_EDGE,
            }
            var frameTexture;
            loadingStatusDOM.innerText = "Loading frame "+i+"/"+this.inputTemporalParams.numFrames+" from source "+this.sourceId;
            //load the texture
            
            //instantiate render frame object
            var renderFrame = new RenderFrame(reqTime, this.sourceId, this.drawSphere, this.gl);
            renderFrame.setFrameParams(isReady);//getClosestImage params
            renderFrame.getSatellitePosition(this.sourceName.satelliteName, isReady);//geometry service position
            //frameTexture = twgl.createTexture(this.gl, textureOptions,textureReady(renderFrame,frameTexture));
            renderFrame.setTexture(twgl.createTexture(this.gl, textureOptions,renderFrame.textureReady(isReady)));
            //await new Promise(r => { renderFrame.setTexture(twgl.createTexture(this.gl, textureOptions,r)) ;} );
            //console.log(renderFrame);
            //add texture to pool
            newRenderReel.push(renderFrame);
        }
        
    }

    prepareInputBeforeFrames(){
        var dateTimeString = document.getElementById('date').value.split('/').join("-") +"T"+ document.getElementById('time').value+"Z";
        var startDate = parseInt(new Date(dateTimeString).getTime() / 1000) - 86400 * 30 * 6;//-48hrs
        var endDate = parseInt(new Date(dateTimeString).getTime() / 1000);
        var numFramesInput = parseInt(1);
        var reduceInput = parseInt(0);

        //scale down 4k SDO images in half, twice, down to 1k
        if(this.sourceId >=8 && this.sourceId <= 19){
            reduceInput = 2;
        }

        var unixTimeStart = startDate;
        var timeRange = endDate - startDate;
        var unixTimeIncrement = timeRange / numFramesInput;
    
        return {
            numFrames: numFramesInput,
            timeStart: unixTimeStart,
            timeIncrement: unixTimeIncrement,
            reduceResolutionLevel: reduceInput
        };
    }

    async getSatellitePositions( satelliteName ) {
        let utc = new Date(this.timestamp * 1000).toISOString();
        const outCoords = await helioviewer._coordinateSystemsHelper.getPositionHCC(utc, satelliteName, "SUN");
        this.satellitePositionMatrix = glMatrix.vec3.fromValues(outCoords.x,outCoords.y,outCoords.z);
    }

    bindTexturesAndUniforms(){
        const currentFrame = this.renderReel[this.frameCounter-1];
        this.drawInfo[0][0].uniforms.sunSampler = currentFrame.texture;
        this.drawInfo[1][0].uniforms.sunSampler = currentFrame.texture;

        this.drawInfo[0][0].uniforms.scale = currentFrame.solarProjectionScale*this.cameraDist;
        this.drawInfo[1][0].uniforms.scale = currentFrame.solarProjectionScale*this.cameraDist;

        this.drawInfo[0][0].uniforms.uXOffset = currentFrame.planeOffsetX;
        this.drawInfo[1][0].uniforms.uXOffset = currentFrame.planeOffsetX;

        this.drawInfo[0][0].uniforms.uYOffset = currentFrame.planeOffsetY;
        this.drawInfo[1][0].uniforms.uYOffset = currentFrame.planeOffsetY;

        //glMatrix.mat4.lookAt(this.spacecraftViewMatrix, this.origin, currentFrame.satellitePositionMatrix, this.up );

        //this.drawInfo[0][0].uniforms.mSpacecraft = this.spacecraftViewMatrix;
        //this.drawInfo[1][0].uniforms.mSpacecraft = this.spacecraftViewMatrix;

        this.drawInfo[0][0].bufferInfo = currentFrame.planeBuffer;
        this.drawInfo[1][0].bufferInfo = currentFrame.sphereBuffer;

        this.drawInfo[0][0].uniforms.planeWidth = currentFrame.planeWidth;
        this.drawInfo[1][0].uniforms.planeWidth = currentFrame.planeWidth;
    }

    drawPlanes(){
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        twgl.drawObjectList(this.gl, this.drawInfo[0]);
    }

    drawReversePlanes(){
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        //rotate and draw reverse plane
        glMatrix.mat4.rotate(this.planeViewMatrix, this.identityMatrix, -this.planeRotateRadians, this.planeRotateUpVector);
        this.drawInfo[0][0].uniforms.uReversePlane = true;
        twgl.drawObjectList(this.gl, this.drawInfo[0]);
        //restore standard plane
        glMatrix.mat4.rotate(this.planeViewMatrix, this.identityMatrix, this.planeRotateRadians, this.planeRotateUpVector);
        this.drawInfo[0][0].uniforms.uReversePlane = false;
    }

    drawSpheres(){
        if(this.drawSphere){
            /*
            //draw coronal reverse planes
            glMatrix.mat4.rotate(this.planeViewMatrix, this.identityMatrix, -this.planeRotateRadians, this.planeRotateUpVector);
            this.drawInfo[0][0].uniforms.uReversePlane = true;
            twgl.drawObjectList(this.gl, this.drawInfo[0]);
            //restore standard plane
            glMatrix.mat4.rotate(this.planeViewMatrix, this.identityMatrix, this.planeRotateRadians, this.planeRotateUpVector);
            this.drawInfo[0][0].uniforms.uReversePlane = false;
            */
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.enable(this.gl.BLEND);
            this.gl.disable(this.gl.DEPTH_TEST);
            twgl.drawObjectList(this.gl, this.drawInfo[1]);
        }
    }

    setFrames(newFrames){
        this.frames = newFrames;
    }

    updatePlayPause(playMovieState){
        this.playMovieState = playMovieState;
        console.log("Layer " + this.sourceId + " movie playing state changed to: " + this.playMovieState);
    }

    degreesToRad(deg){
        return deg * Math.PI/180;
    }
}