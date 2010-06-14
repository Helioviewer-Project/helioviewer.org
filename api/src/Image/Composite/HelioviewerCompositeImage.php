<?php

require_once 'CompositeImage.php';

class Image_Composite_HelioviewerCompositeImage extends Image_Composite_CompositeImage
{
	public function __construct($meta, $options, $tmpDir, $filename)
	{
		parent::__construct($meta, $options, $tmpDir, $filename);
	}
	
    protected function getWaterMarkText() {
    	$cmd 	 = "";
    	$nameCmd = "";
        $timeCmd = "";

        // Put the names on first, then put the times on as a separate layer so the times are nicely aligned.
        foreach ($this->layerImages as $layer) {
            $nameCmd .= $layer->getWaterMarkName();
            $timeCmd .= $layer->getWaterMarkTimestamp();
        }

        // Outline words in black
        $cmd .= " -stroke #000C -strokewidth 2 -annotate +20+0 '$nameCmd'";
        // Write words in white over outline
        $cmd .= " -stroke none -fill white -annotate +20+0 '$nameCmd'";
        // Outline words in black
        $cmd .= " -stroke #000C -strokewidth 2 -annotate +100+0 '$timeCmd'";
        // Write words in white
        $cmd .= " -stroke none -fill white -annotate +100+0 '$timeCmd'";

    	return $cmd;
    }
}

?>