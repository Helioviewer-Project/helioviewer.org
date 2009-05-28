<?php
/**
 * JHV - JHelioviewer Launcher
 */
class JHV {
	public function __construct() {
		
	}
	
	public function launch($files) {
		header('content-type: application/x-java-jnlp-file');
		header('content-disposition: attachment; filename="JHelioviewer.jnlp"'); 
		echo '<?xml version="1.0" encoding="utf-8"?>' . "\n";
?>
<jnlp spec="1.0+" codebase="http://achilles.nascom.nasa.gov/~wamsler/" href="JHelioviewer.jnlp">
	<information>    
		<title>ESA JHelioviewer Demo</title>   
		<vendor>Wamsler Benjamin</vendor>   
		<homepage href="http://achilles.nascom.nasa.gov/~wamsler/index.html" />
		<description>An ESA Webstart Test</description>   
		<offline-allowed />  
	</information> 
	
	<resources>    
		<j2se version="1.4+" initial-heap-size="512M" max-heap-size="1000M"/>     
		<jar href="JHelioviewer.jar" />  
	</resources>  
	
	<security>    
		<all-permissions />  
	</security> 
	
	<application-desc main-class="org.helioviewer.JavaHelioViewer">
	    <argument><?php echo $files;?></argument>
	</application-desc>
</jnlp>

<?php
	}
}
?>