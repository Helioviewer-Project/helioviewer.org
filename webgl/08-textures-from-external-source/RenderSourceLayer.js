class RenderSourceLayer {
    constructor(gl,programInfo,sourceId,baseLayer,alpha){
        this.gl = gl;
        this.programInfo = programInfo;
        this.sourceId = sourceId;
        this.textures = [];
        this.colorTable;
        this.solarProjectionScale = 0.3985;//0.388 rough esitmate for projection when RSUN_OBS=1;
        this.RSUN_OBS = 0.97358455;//sun radius in arcseconds / 1000
        this.arcSecondRatio = 1.0 / this.RSUN_OBS;
        this.baseLayer = baseLayer;

        if(baseLayer){
            this.alpha = 1.0;
        }else{
            this.alpha = alpha;
        }
        this.alpha = 1.0;

        this.playMovieState = true;
    }

    async setColorTable(){
        const colorTableName = this.setColorTableName();

        const textureOptions = {
            src: "./"+colorTableName,
            internalFormat: this.gl.RGB,
            format: this.gl.RGB,
            mag: this.gl.LINEAR,
            min: this.gl.LINEAR,
            wrapS: this.gl.CLAMP_TO_EDGE,
            wrapT: this.gl.CLAMP_TO_EDGE,
        }

        await new Promise(r => {this.colorTable = twgl.createTexture(this.gl,textureOptions,r)});
    }

    setColorTableName(){
        var colorTableFolder = "color-tables/";
        switch(this.sourceId){
            case 4:
                return colorTableFolder + "Red_Temperature.png";
            case 5:
                return colorTableFolder + "Blue_White_Linear.png";
            case 10:
                return colorTableFolder + "SDO_AIA_171.png";
            case 11: 
                return colorTableFolder + "SDO_AIA_193.png";
            case 13:
                return colorTableFolder + "SDO_AIA_304.png";
            default:
                return colorTableFolder + "Gray.png";
        }
    }

    //TODO:
    // This is a mess, maybe extract into a helper file
    async setSourceParams(sourceId){
        var input = this.prepareInputBeforeFrames();
        var getClosestImageURL = apiURL + "/?action=getClosestImage&sourceId="+this.sourceId+"&date="+new Date(input.timeStart * 1000).toISOString();
        await fetch(getClosestImageURL).then(res => {return res.json()}).then(data => {
            console.log(data);
            this.imageID = data.id;
            this.maxResPixels = data.width;
            this.arcSecPerPix = data.scale;
            this.centerPixelX = data.refPixelX;
            this.centerPixelY = data.refPixelY;
            if(sourceId >= 8 && sourceId <= 19){
                //if the source is SDO AIA/HMI draw a sphere
                this.drawSphere = true;
                this.planeWidth = this.arcSecondRatio*this.maxResPixels*this.arcSecPerPix / 1000;
            }else if(sourceId == 4 || sourceId == 5){
                //if the source is SOHO LASCO C2/C3 don't draw a sphere
                this.drawSphere = false;
                this.planeWidth = this.arcSecondRatio*this.maxResPixels*this.arcSecPerPix / 1000;
                this.solarProjectionScale /= this.planeWidth/2.5;
                this.planeOffsetX = (this.centerPixelX - (this.maxResPixels * 0.5) ) / (this.maxResPixels * 0.5) * this.planeWidth * 0.5;
                this.planeOffsetY = (this.centerPixelY - (this.maxResPixels * 0.5)) / (this.maxResPixels * 0.5) * this.planeWidth * 0.5;
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
        this.sdoViewMatrix = new Float32Array(16);
        this.planeViewMatrix = new Float32Array(16);
        glMatrix.mat4.identity(this.sdoViewMatrix);
        glMatrix.mat4.identity(this.planeViewMatrix);
        glMatrix.mat4.rotate(this.planeViewMatrix, this.identityMatrix, this.degreesToRad(-90), [1,0,0]);

        const uniformsPlane = {
            mWorld: this.worldMatrix,
            mView: this.viewMatrix,
            mProj: this.projMatrix,
            mSdo: this.identityMatrix,
            mPlane: this.planeViewMatrix,
            scale: this.solarProjectionScale*cameraDist,
            colorSampler: this.colorTable,
            planeShader: true,
            uAlpha: this.alpha,
            uProjection: this.drawSphere,
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
            mSdo: this.sdoViewMatrix,
            mPlane: this.identityMatrix,
            scale: this.solarProjectionScale*cameraDist,
            colorSampler: this.colorTable,
            planeShader: false,
            uAlpha: this.alpha,
            uProjection: this.drawSphere
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
        this.identityMatrix = matrices.identityMatrix;
        this.worldMatrix = matrices.worldMatrix;
        this.viewMatrix = matrices.viewMatrix;
        this.projMatrix = matrices.projMatrix;
    }
    
    updateFrameCounter(frameNumber){
        if(this.playMovieState){
            this.frameCounter = (frameNumber % this.textures.length) + 1;;
            //this.frameCounter = Math.floor((performance.now() / 1000 * 30 )% this.textures.length) + 1;
        }
        //glMatrix.mat4.ortho(this.projMatrix, -camera.cameraDist, camera.cameraDist, -camera.cameraDist, camera.cameraDist, 0.1, 1000.0);
    }

    setCameraDistScale(cameraDist,projMatrix){
        this.drawInfo[0][0].uniforms.scale = this.solarProjectionScale * cameraDist;
        this.drawInfo[0][0].uniforms.mProj = projMatrix;
        this.drawInfo[1][0].uniforms.scale = this.solarProjectionScale * cameraDist;
        this.drawInfo[1][0].uniforms.mProj = projMatrix;
    }

    async fetchTextures(){
        var newTextures = [];
        var input = this.prepareInputBeforeFrames();
        var loadingStatusDOM = document.getElementById("loading-status");
        for(var i=1;i<input.numFrames+1;i++){
            //build the texture options
            var reqTime = input.timeStart + (input.timeIncrement * (i-1));
            var textureOptions = {
                src: apiURL + "/?action=getTexture&unixTime="+reqTime+"&sourceId="+this.sourceId+"&reduce="+input.reduceResolutionLevel,
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
        var startDate = parseInt(new Date(document.getElementById('startDateInput').value).getTime() / 1000);
        var endDate = parseInt(new Date(document.getElementById('endDateInput').value).getTime() / 1000);
        var numFramesInput = parseInt(document.getElementById('numFramesInput').value);
        var reduceInput = parseInt(document.getElementById('reduceInput').value);

        //do not scale down SOHO LASCO C2/C3
        if(this.sourceId == 4 || this.sourceId == 5){
            reduceInput = 0;
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
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.frameCounter-1]);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTable);
    }

    drawPlanes(){
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        twgl.drawObjectList(this.gl, this.drawInfo[0]);
    }

    drawSpheres(){
        if(this.drawSphere){
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