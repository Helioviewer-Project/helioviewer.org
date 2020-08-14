/**
 * RenderFrame holds texture information and per-frame metadata
 */

class RenderFrame {
    constructor(timestamp, sourceId){
        this.timestamp = timestamp;
        this.sourceId = sourceId;
        this.satellitePositionMatrix;
        this.offset;
        //this is a constant for now
        this.RSUN_OBS = 0.97358455;//sun radius in arcseconds / 1000
        this.arcSecondRatio = 1.0 / this.RSUN_OBS;
        this.ready = { texture: false, position: false, params: false, all: false}
    }

    setTexture(texture,callback){
        this.texture = texture;
    }

    textureReady(callback){
        this.ready.texture = true;
        this.isReady(callback);
    }

    //Gets information for image centering and scale
    //TODO:
    // This is a mess, maybe extract into a helper file
    async setFrameParams(callback){
        var getClosestImageURL = Helioviewer.api + "/?action=getClosestImage&sourceId="+this.sourceId+"&date="+new Date(this.timestamp * 1000).toISOString();
        await fetch(getClosestImageURL).then(res => {return res.json()}).then(data => {
            //console.log(data);
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
        this.ready.params = true;
        this.isReady(callback);
    }

    async getSatellitePosition(satelliteName,callback) {
        let utc = new Date(this.timestamp * 1000).toISOString();
        const outCoords = await helioviewer._coordinateSystemsHelper.getPositionHCC(utc, satelliteName, "SUN");
        this.satellitePositionMatrix = glMatrix.vec3.fromValues(outCoords.x,outCoords.y,outCoords.z);
        this.ready.position = true;
        this.isReady(callback);
    }

    isReady(callback){
        if( this.ready.all == false && this.ready.texture == true && this.ready.position == true && this.ready.params == true ){
            this.ready.all = true;
            callback(this.timestamp);
        }
    }

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
    }
}