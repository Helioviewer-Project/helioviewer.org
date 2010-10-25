<?php
/**
 * Image generation using binary strings for intermediate steps
 */

//
// buildImage
//
function buildImage($opts) {
    $input = "input/2010_09_04__23_56_32_125__SDO_AIA_AIA_304.pgm";
    $clut  = "input/SDO_AIA_304.png";

    $image = new IMagick($input);

    
    if ($opts['use_gd']) {
        // Format
        if ($opts['inter_format'])
            $image->setImageFormat($opts['inter_format']);
            
        // Bit-depth (intermediate image)
        if ($opts['depth'])
            $image->setImageDepth($opts['depth']);   
    
        // Image type
        if ($opts['type'])
            $image->setImageType(constant($opts['type']));
            
        // Compression quality
        if ($opts['input_quality'] || ($opts['input_quality'] === 0)) {
            $image->setImageCompressionQuality($opts['input_quality']);
        }
    
        $intermediate = $image->getimageblob();
        
        if ($opts['base64'])
            $intermediate = base64_encode($intermediate);
    
        $image->destroy();
    
        $coloredImage = setColorPalette($intermediate, $clut, $opts['base64']);
    
        if ($opts['base64'])
            $coloredImage = base64_decode($coloredImage);
        
        $image = new IMagick();
        
        $image->readimageblob($coloredImage);    
    } else {
        $image->clutImage(new Imagick($clut));
    }

    if (strtolower($opts["output_format"]) == "png") {
        // Compression type
        if ($opts['compression'])
            $image->setImageCompression(constant($opts['compression']));
            
        // Interlacing
        if ($opts['interlace'])
            $image->setInterlaceScheme(constant($opts['interlace']));
            
        // Compression quality
        if ($opts['output_quality'] || ($opts['output_quality'] === 0))
            $image->setImageCompressionQuality($opts['output_quality']);
    }
    
    // Bit-depth (final image)
    if ($opts['depth'])
        $image->setImageDepth($opts['depth']); 

    $image->writeImage("final." . strtolower($opts["output_format"]));
    $image->destroy();
}

//
// setColorPalette
//
function setColorPalette($input, $clut, $base64 = false)
{   
    $gd = null;

    if ($base64)
        $input = base64_decode($input);
    
    $gd = imagecreatefromstring($input);

    $ctable = imagecreatefrompng($clut);

    for ($i = 0; $i <= 255; $i++) {
        $rgb = imagecolorat($ctable, 0, $i);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        imagecolorset($gd, $i, $r, $g, $b);
    }

    // Enable interlacing
    imageinterlace($gd, true);

    // start buffering
    ob_start();
    imagepng($gd, NULL);
    $blob = ob_get_contents();
    // end capture
    ob_end_clean();

    // be tidy; free up memory
    imagedestroy($gd);
    imagedestroy($ctable);
    
    if ($base64)
        $blob = base64_encode($blob);
        
    return $blob;
}
?>