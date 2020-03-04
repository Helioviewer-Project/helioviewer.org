class CoordinateSystemsHelper {
    constructor(){
        
    }

    /**
     * Convert 
     * @param {
     * x: Float,
     * y: Float,
     * utc: Date()
     * observer: String,
     * target: String
     * } inputBody 
     */
    async _convertHPCtoHCC(inputBody){
        console.log(inputBody);
        //var distanceInMeters = await this.getDistance(inputBody.utc.slice(0,-1), inputBody.observer, inputBody.target);
        var distanceInMeters = 151942709.93212602;
        console.log("dist from swhv service:", distanceInMeters);
        var metersPerArcsecond = 724910;  //695500000 / 959.705;
        var helioprojectiveCartesian = {
            x: ( inputBody.x / 3600 ) * ( Math.PI/180 ) ,
            y: ( inputBody.y / 3600 ) * ( Math.PI/180 ),
            theta_x: ( inputBody.x / 3600 ) ,
            theta_y: ( inputBody.y / 3600 )
        };
        console.log("HelioProjective:",helioprojectiveCartesian);
        var distanceToSurfaceFromCenter = this.make_3d(inputBody.x, inputBody.y);
        console.log("distanceToSurfaceFromCenter",distanceToSurfaceFromCenter);
        var helioCentricCartesian = {
            x: distanceInMeters*Math.cos( helioprojectiveCartesian.y )*Math.sin( helioprojectiveCartesian.x ),
            y: distanceInMeters*Math.sin( helioprojectiveCartesian.y ),
            z: distanceInMeters - ( distanceInMeters*Math.cos( helioprojectiveCartesian.y )*Math.cos( helioprojectiveCartesian.x ) )
        }
        console.log("helioCentricCartesian:",helioCentricCartesian);
        return helioCentricCartesian;
    }
    
    async getDistance(utc,observer,target){
        var requestURL = "http://swhv.oma.be/position?utc="+utc+"&observer="+observer+"&target="+target+"&ref=HEEQ&kind=latitudinal";
        console.log(requestURL);
        var result;
        await fetch(requestURL,{
            method: "GET",
            mode: "cors",
            dataType: "json",
        }).then(response => response.json()).then(data => {
            result = data.result[0][utc][0];//extract distance for time from result json payload
        });
        return result;
    }

    make_3d(lat,lon){
        let radius = 0.0;//6378.137;
        let rsun = 695700;//solar radius km
        let alpha = Math.acos(Math.cos(lat) * Math.cos(lon));
        let c = radius**2 - rsun**2
        let b = -2 * radius * Math.cos(alpha);
        let d = ((-1*b) - Math.sqrt((b**2) - (4*c))) / 2;
        console.log(d);
        return d;
    }
}