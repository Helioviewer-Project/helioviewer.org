class CoordinateSystemsHelper {
    constructor(){
        this.apiAuth = 31337;
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
        var distanceInMeters = await this.getDistance(inputBody.utc.slice(0,-1), inputBody.observer, inputBody.target);
        console.log("dist from swhv service:", distanceInMeters);
        var metersPerArcsecond = 724910;  //695500000 / 959.705;
        var helioprojectiveCartesian = {
            x: ( inputBody.x / 3600 ) * ( Math.PI/180 ) ,
            y: ( inputBody.y / 3600 ) * ( Math.PI/180 ) ,
        };
        var distanceToSunSurface = this.make_3d(helioprojectiveCartesian.x, helioprojectiveCartesian.y, distanceInMeters);
        var helioCentricCartesian = {
            x: distanceToSunSurface*Math.cos( helioprojectiveCartesian.y )*Math.sin( helioprojectiveCartesian.x ),
            y: distanceToSunSurface*Math.sin( helioprojectiveCartesian.y ),
            z: distanceInMeters - ( distanceToSunSurface*Math.cos( helioprojectiveCartesian.y )*Math.cos( helioprojectiveCartesian.x ) )
        }
        return helioCentricCartesian;
    }
    
    async getDistance(utc,observer,target){
        let requestURL = Helioviewer.api+"?action=getGeometryServiceData&auth="+this.apiAuth+"&type=distance&utc="+utc+"&observer="+observer+"&target="+target;
        console.log("distance",requestURL);
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

    async getPositionHCC(dateISOString,observer,target){
        let utc = dateISOString.slice(0,-4)+"000";
        let requestURL = Helioviewer.api+"?action=getGeometryServiceData&auth="+this.apiAuth+"&type=position&utc="+utc+"&observer="+observer+"&target="+target;
        let result;
        let result_au;

        let au_in_km = 149598000.0;

        let xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open("GET",requestURL,true);
        await new Promise((resolve,reject) => {
            xhr.onload = function () {
                let status = xhr.status;
                if (status == 200) {
                    let data = xhr.response;
                    //we must swap y and z coordinates from HEEQ to GL coordinates
                    //we must invert x and y as well
                    console.log("expectedUTC",utc,"payload",data.result[0]);
                    result = {
                        x: -data.result[0][utc][0],//extract x distance HCC for time from result json payload
                        y: -data.result[0][utc][2],//extract y distance HCC for time from result json payload
                        z: data.result[0][utc][1]//extract z distance HCC for time from result json payload
                    };
                    //convert kms to AU
                    result_au = {
                        x: result.x / au_in_km,//extract x distance HCC for time from result json payload
                        y: result.y / au_in_km,//extract x distance HCC for time from result json payload
                        z: result.z / au_in_km//extract x distance HCC for time from result json payload
                    };
                    resolve();
                }else{
                    reject();
                }
            };
            xhr.send();
        });
        return result_au;
    }

    make_3d(lat,lon,dist){
        let radius = dist;
        let rsun = 695700;//solar radius km
        let alpha = Math.acos(Math.cos(lat) * Math.cos(lon));
        let c = radius**2 - rsun**2;
        let b = -2 * radius * Math.cos(alpha);
        let d = ((-1*b) - Math.sqrt((b**2) - (4*c))) / 2;
        return d;
    }
}