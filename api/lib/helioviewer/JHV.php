<?php
/**
 * JHV - JHelioviewer Launcher
 */
class JHV {
    private $files;
    
    public function __construct($files=Null) {
        $this->files = $files;        
    }
    
    public function launch() {
        header('content-type: application/x-java-jnlp-file');
        header('content-disposition: attachment; filename="JHelioviewer.jnlp"'); 
        echo '<?xml version="1.0" encoding="utf-8"?>' . "\n";
?>
<jnlp spec="1.0+" codebase="http://achilles.nascom.nasa.gov/~dmueller/jhv/" href="JHelioviewer.jnlp">
    <information>    
        <title>JHelioviewer</title>   
        <vendor>ESA</vendor>   
        <homepage href="index.html" />
        <description>JHelioviewer web launcher</description>   
        <offline-allowed />  
    </information> 
    
    <resources>    
        <j2se version="1.5+" initial-heap-size="256M" max-heap-size="1500M"/>     
        <jar href="JHelioviewer.jar" />  
    </resources>  
    
    <security>    
        <all-permissions />  
    </security> 
    
    <application-desc main-class="org.helioviewer.JavaHelioViewer">
<?php if (isset($this->files)) {
    echo "        <argument>$this->files</argument>\n";
}
?>
    </application-desc>
</jnlp>

<?php
    }
}
?>