<?php
/**
 * Image generation using files for intermediate steps
 */

//
// buildImage
//
function buildImage($opts) {
    $input = "input/2010_09_04__23_56_32_125__SDO_AIA_AIA_304.pgm";
    $clut  = "input/SDO_AIA_304.png";
    $intermediate = "intermediate.png";

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
            
        // Compression quality (intermediate)
        if ($opts['input_quality'] || ($opts['input_quality'] === 0)) {
            $image->setImageCompressionQuality($opts['input_quality']);
        }
    
        $image->writeImage($intermediate);
        $image->destroy();
    
        setColorPalette($intermediate, $intermediate, $clut);
    
        // Compress and write image
        $image = new IMagick($intermediate);
    } else {
        $image->clutImage(new Imagick($clut));
    }
    
    // Compression type
    if (strtolower($opts["output_format"]) == "png") {
        if ($opts['compression'])
            $image->setImageCompression(constant($opts['compression']));
        
        // Interlacing
        if ($opts['interlace'])
            $image->setInterlaceScheme(constant($opts['interlace']));
            
        // Compression quality (input)
        if ($opts['output_quality'] || ($opts['output_quality'] === 0)) {
            $image->setImageCompressionQuality($opts['output_quality']);
        }    
    }
    
    // Bit-depth (final image)
    if ($opts['depth'])
        $image->setImageDepth($opts['depth']);

    $image->writeImage("final." . strtolower($opts["output_format"]));
    //$image->writeImage("final.png");
    $image->destroy();
}

//
// setColorPalette
//
function setColorPalette($input, $output, $clut)
{   
    $gd   = null;

    if (file_exists($input)) {
        $gd = imagecreatefrompng($input);
    } else {
        throw new Exception("Unable to apply color-table: $input does not exist.");
    }

    if (!$gd) {
        throw new Exception("Unable to apply color-table: $input is not a valid image.");
    }

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

    imagepng($gd, $output);

    // Cleanup
    if ($input != $output) {
        unlink($input);
    }
    imagedestroy($gd);
    imagedestroy($ctable);
}
?>