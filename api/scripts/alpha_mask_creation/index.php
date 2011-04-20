<?php
    // Helioviewer.org LASCO/COR Alpha Mask Generation
    // keith.hughitt@nasa.gov
    //
    // last update 2011/04/18
    //
    // Note: In order to run properly, the script expects to find a 
    //       writable directory named "out" in the current working directory.
    //
    
    // 2011/04/19 Normalize with respect to 1 AU

    // LASCO C2
    $c2 = array(
        "filename"   => "LASCO_C2_Mask.png",
        "width"      => 1040,
        "height"     => 1040,
        "imageScale" => 11.9,
        "rsun"       => 959.705,
        "roccInner"  => 2.415, // 1.05 * orig
        "roccOuter"  => 7.7    // 0.9625 * orig
    );

    // LASCO C3
    $c3 = array(
        "filename"   => "LASCO_C3_Mask.png",
        "width"      => 1040,
        "height"     => 1040,
        "imageScale" => 56.0,
        "rsun"       => 959.705,
        "roccInner"  => 4.62,    // 1.05 * orig
        "roccOuter"  => 30.31875 // 0.9625 * orig
    );
    
    // COR1 A&B
    // http://www.springerlink.com/content/u040662v341354u5/fulltext.pdf
    $cor1a = array(
        "filename"   => "COR1-A_Mask.png",
        "width"      => 520,
        "height"     => 520,
        "imageScale" => 15.008600,
        "rsun"       => 992.91301,
        "roccInner"  => 1.52, //1.4
        "roccOuter"  => 4.4  //4
    );
    
    $cor1b = array(
        "filename"   => "COR1-B_Mask.png",
        "width"      => 520,
        "height"     => 520,
        "imageScale" => 15.008600,
        "rsun"       => 884.55757,
        "roccInner"  => 1.52, //1.4
        "roccOuter"  => 4.4  //4
    );
    
    // COR2
    $cor2a = array(
        "filename"   => "COR2-A_Mask.png",
        "width"      => 2080,
        "height"     => 2080,
        "imageScale" => 15.008600,
        "rsun"       => 992.91208,
        "roccInner"  => 2.8, // just guessing...
        "roccOuter"  => 16
    );
    
    $cor2b = array(
        "filename"   => "COR2-B_Mask.png",
        "width"      => 2080,
        "height"     => 2080,
        "imageScale" => 15.008600,
        "rsun"       => 884.55531,
        "roccInner"  => 2.8,
        "roccOuter"  => 15
    );
    
    
    // Create masks
    foreach(array($c2, $c3, $cor1a, $cor2a, $cor1b, $cor2b) as $mask) {
        echo "<b>Generating {$mask['filename']}...</b><br><br>";

        // Solar Radii in pixels
        $rsunInPixels = $mask["rsun"] / $mask["imageScale"];
        
        // crpix1 & 2 approximate values (ideal case)
        $crpix1 = $mask['width'] / 2;
        $crpix2 = $mask['height'] / 2;
        
        // Convert to pixels
        $radiusInner  = $mask['roccInner'] * $rsunInPixels;
        $radiusOuter  = $mask['roccOuter'] * $rsunInPixels;
        $innerCircleY = $crpix2 + $radiusInner;
        $outerCircleY = $crpix2 + $radiusOuter;
        
        // The ImageMagick circle primitive makes a disk (filled) or 
        // circle (unfilled).Give the center and any point on the perimeter.
        $cmd = 'convert -size %dx%d xc:black -fill white -draw ' .
               '"circle %d,%d %d,%d" -fill black -draw "circle %d,%d %d,%d" ' .
               '-monochrome out/%s';
        
        $cmd = sprintf(
            $cmd, $mask['width'], $mask['height'], $crpix1, $crpix2, $crpix1,
            $outerCircleY, $crpix1, $crpix2, $crpix1, $innerCircleY,
            $mask['filename']
        );
        //$cmd = "convert -size {$mask['width']}x{$mask['height']} xc:black -fill white -draw \"circle $crpix1,$crpix2 $crpix1,$outerCircleY\"" .
        //       " -fill black -draw \"circle $crpix1,$crpix2 $crpix1,$innerCircleY\" -monochrome out/{$mask['filename']}";
        
        echo "<div style='margin:20px;'>$cmd</div><br>";
        exec(escapeshellcmd($cmd));
        echo "Done!<br><br>";
    }
?>
