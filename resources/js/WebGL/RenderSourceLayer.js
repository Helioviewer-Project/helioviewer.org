class RenderSourceLayer {
    constructor(gl,programInfo,sourceId,baseLayer,alpha){
        this.gl = gl;
        this.programInfo = programInfo;
        this.sourceId = sourceId;
        this.textures = [];
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
    async setSourceParams(sourceId){
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
    }

    createShapeVertexBuffers(){
        //
        // CREATE SHAPE VERTEX BUFFERS
        //
        if(this.drawSphere){
            this.sphereBuffer = twgl.primitives.createSphereBufferInfo(this.gl, this.RSUN_OBS, 128, 64, 0, Math.PI, Math.PI, 2 * Math.PI); // only create half of the sphere
        }
        this.planeBuffer = twgl.primitives.createPlaneBufferInfo(this.gl,this.planeWidth,this.planeWidth);

    }

    createViewMatricesAndObjects(cameraDist){
        //
        // CREATE OBJECT MATRICES AND OFFSETS
        //
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
        this.look();
    }

    setMatrices(matrices){
        this.identityMatrix = matrices.identityMatrix;
        this.worldMatrix = matrices.worldMatrix;
        this.viewMatrix = matrices.viewMatrix;
        this.projMatrix = matrices.projMatrix;
        this.cameraMatrix = matrices.cameraMatrix;
    }
    
    updateFrameCounter(frameNumber){
        if(this.playMovieState){
            this.frameCounter = (frameNumber % this.textures.length) + 1;;
            //this.frameCounter = Math.floor((performance.now() / 1000 * 30 )% this.textures.length) + 1;
        }
        //glMatrix.mat4.ortho(this.projMatrix, -camera.cameraDist, camera.cameraDist, -camera.cameraDist, camera.cameraDist, 0.1, 1000.0);
    }

    setCameraDistScale(cameraDist,projMatrix){
        //plane object uniforms
        this.drawInfo[0][0].uniforms.scale = this.solarProjectionScale * cameraDist;
        this.drawInfo[0][0].uniforms.mProj = projMatrix;
        //sphere object uniforms
        this.drawInfo[1][0].uniforms.scale = this.solarProjectionScale * cameraDist;
        this.drawInfo[1][0].uniforms.mProj = projMatrix;
    }

    async look(){
        let origin = glMatrix.vec3.fromValues(0,0,0);
        let up = glMatrix.vec3.fromValues(0,1,0);
        let input = this.prepareInputBeforeFrames();
        let utc = new Date(input.timeStart * 1000).toISOString();
        console.log(this.sourceId, this.sourceName.satelliteName);
        let outCoords = await helioviewer._coordinateSystemsHelper.getPositionHCC(utc, this.sourceName.satelliteName, "SUN");
        let targetCoords = glMatrix.vec3.fromValues(outCoords.x,outCoords.y,outCoords.z);
        glMatrix.mat4.lookAt(this.spacecraftViewMatrix, origin, targetCoords, up );
    }

    async fetchTextures(){
        var newTextures = [];
        var input = this.prepareInputBeforeFrames();
        var loadingStatusDOM = document.getElementById("loading-status");
        for(var i=1;i<input.numFrames+1;i++){
            //build the texture options
            var reqTime = input.timeStart + (input.timeIncrement * (i-1));
            var textureOptions = {
                src: Helioviewer.api + "/?action=getTexture&unixTime="+reqTime+"&sourceId="+this.sourceId+"&reduce="+input.reduceResolutionLevel,
                internalFormat: this.gl.LUMINANCE,
                format: this.gl.LUMINANCE,
                mag: this.gl.NEAREST,
                min: this.gl.LINEAR,
                wrapS: this.gl.CLAMP_TO_EDGE,
                wrapT: this.gl.CLAMP_TO_EDGE,
            }
            var frameTexture;
            loadingStatusDOM.innerText = "Loading frame "+i+"/"+input.numFrames+" from source "+this.sourceId;
            //load the texture
            await new Promise(r => {frameTexture = twgl.createTexture(this.gl, textureOptions,r);});
            //add texture to pool
            newTextures.push(frameTexture);
        }
        loadingStatusDOM.innerText = "Loaded " + input.numFrames + " frames"
        this.textures = newTextures;
    }

    prepareInputBeforeFrames(){
        var dateTimeString = document.getElementById('date').value.split('/').join("-") +"T"+ document.getElementById('time').value+"Z";
        var startDate = parseInt(new Date(dateTimeString).getTime() / 1000);
        var endDate = parseInt(new Date(dateTimeString).getTime() / 1000) + 86400*2;//+24hrs
        var numFramesInput = parseInt(30);
        var reduceInput = parseInt(0);

        //do not scale down SOHO LASCO C2/C3
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

    bindTextures(){
        this.drawInfo[0][0].uniforms.sunSampler = this.textures[this.frameCounter-1];
        this.drawInfo[1][0].uniforms.sunSampler = this.textures[this.frameCounter-1];
        // this.gl.activeTexture(this.gl.TEXTURE0);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.frameCounter-1]);
        // this.gl.activeTexture(this.gl.TEXTURE1);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTable);
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