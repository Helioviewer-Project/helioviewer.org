/**
 * Fascade which maps sourceId to color-table, satelliteName, and whether to draw a sphere.
 */

class SourceLayerHelper {
    constructor( sourceId ){
        this.sourceId = sourceId;
        
        this.drawSphere = false;
        this.colorTableName = this.setColorTableName();
        this.satelliteName = this.setSatelliteNameForGeometryService();
    }

    setColorTableName(){
        var colorTableFolder = Helioviewer.api + "/resources/images/color-tables/";
        switch(this.sourceId){
            case 0:
                this.drawSphere = true;
                return colorTableFolder + "SOHO_EIT_171.png";
            case 1:
                this.drawSphere = true;
                return colorTableFolder + "SOHO_EIT_195.png";
            case 2:
                this.drawSphere = true;
                return colorTableFolder + "SOHO_EIT_284.png";
            case 3:
                this.drawSphere = true;
                return colorTableFolder + "SOHO_EIT_304.png";
            case 4:
                //SOHO LASCO C2
                return colorTableFolder + "Red_Temperature.png";
            case 5:
                //SOHO LASCO C3
                return colorTableFolder + "Blue_White_Linear.png";
            case 6:
                this.drawSphere = true;
                //MDI Mag
                return colorTableFolder + "Gray.png";
            case 7:
                this.drawSphere = true;
                //MDI Int
                return colorTableFolder + "Gray.png";
            case 8:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_94.png";
            case 9:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_131.png";
            case 10:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_171.png";
            case 11: 
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_193.png";
            case 12:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_211.png";
            case 13:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_304.png";
            case 14:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_335.png";
            case 15:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_1600.png";
            case 16:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_1700.png";
            case 17:
                this.drawSphere = true;
                return colorTableFolder + "SDO_AIA_4500.png";
            case 18: 
                //HMI Int
                this.drawSphere = true;
                return colorTableFolder + "Gray.png";
            case 19:
                //HMI Mag
                this.drawSphere = true;
                return colorTableFolder + "Gray.png";
            case 20:
                //STEREO-A EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_171.png";
            case 21:
                //STEREO-A EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_195.png";
            case 22:
                //STEREO-A EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_284.png";
            case 23:
                //STEREO-A EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_304.png";
            case 24:
                //STEREO-B EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_171.png";
            case 25:
                //STEREO-B EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_195.png";
            case 26:
                //STEREO-B EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_284.png";
            case 27:
                //STEREO-B EUVI
                this.drawSphere = true;
                return colorTableFolder + "STEREO_EUVI_304.png";
            case 28:
                //STEREO-A COR1
                return colorTableFolder + "Green-White_Linear.png";
            case 29:
                //STEREO-A COR2
                return colorTableFolder + "Red_Temperature.png";
            case 30:
                //STEREO-B COR1
                return colorTableFolder + "Green-White_Linear.png";
            case 31:
                //STEREO-B COR2
                return colorTableFolder + "Red_Temperature.png";
            case 33:
                return colorTableFolder + "Yohkoh_SXT_AlMg.png";
            case 34:
                return colorTableFolder + "Yohkoh_SXT_thin-Al.png";
            case 35:
                return colorTableFolder + "Yohkoh_SXT_white-light.png";
            case 75:
                return colorTableFolder + "TRACE_171.png";
            case 76:
                return colorTableFolder + "TRACE_195.png";
            case 77:
                return colorTableFolder + "TRACE_284.png";
            case 78:
                return colorTableFolder + "TRACE_1216.png";
            case 79:
                return colorTableFolder + "TRACE_1550.png";
            case 80:
                return colorTableFolder + "TRACE_1600.png";
            case 81:
                return colorTableFolder + "TRACE_1700.png";
            case 82:
                return colorTableFolder + "TRACE_white-light.png";
            case 10001:
                return colorTableFolder + "Hinode_XRT.png";
            default:
                return colorTableFolder + "Gray.png";
        }
    }

    setSatelliteNameForGeometryService(){
        //All of these need to be defined in the getGeometryServiceData api endpoint
        if(this.sourceId >= 0 && this.sourceId <= 5){
            return "SOHO";
        }else if(this.sourceId >= 6 && this.sourceId <= 7){
            return "SDO";
        }else if(this.sourceId >= 20 && this.sourceId <= 23){
            return "STEREO Ahead"
        }else if(this.sourceId >= 24 && this.sourceId <= 27){
            return "STEREO Behind"
        }else if(this.sourceId >= 28 && this.sourceId <= 29){
            return "STEREO Ahead"
        }else if(this.sourceId >= 30 && this.sourceId <= 31){
            return "STEREO Behind"
        }else if(this.sourceId == 32){
            return "PROBA-2"
        }else if(this.sourceId == 83){
            return "Earth"
        }else{
            return "SDO";
        }
    }
}