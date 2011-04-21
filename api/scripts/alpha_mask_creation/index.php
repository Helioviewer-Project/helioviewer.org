<?php
    // Helioviewer.org LASCO/COR Alpha Mask Generation
    // keith.hughitt@nasa.gov
    //
    // last update 2011/04/18
    //
    // Note: In order to run properly, the script expects to find a 
    //       writable directory named "out" in the current working directory.
    //
    
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
    // COR 1 & 2 values chosen by hand
    $cor1a = array(
        "filename"   => "COR1-A_Mask.png",
        "width"      => 2048,
        "height"     => 2048,
        "imageScale" => 15.008600,
        "rsun"       => 992.91301,
        "roccInner"  => 5.85,
        "roccOuter"  => 17.4
    );
    
    $cor1b = array(
        "filename"   => "COR1-B_Mask.png",
        "width"      => 2048,
        "height"     => 2048,
        "imageScale" => 15.008600,
        "rsun"       => 884.55757,
        "roccInner"  => 6.5, //6.4, //6.55,
        "roccOuter"  => 19 //20
    );
    
    // COR2
    $cor2a = array(
        "filename"   => "COR2-A_Mask.png",
        "width"      => 2048,
        "height"     => 2048,
        "imageScale" => 15.008600,
        "rsun"       => 992.91208,
        "roccInner"  => 2.7,
        "roccOuter"  => 15.75
    );
    
    $cor2b = array(
        "filename"   => "COR2-B_Mask.png",
        "width"      => 2048,
        "height"     => 2048,
        "imageScale" => 15.008600,
        "rsun"       => 884.55531,
        "roccInner"  => 3.67,
        "roccOuter"  => 17.7
    );
    
    
    // Create masks
    foreach(array($c2, $c3, $cor1a, $cor2a, $cor1b, $cor2b) as $mask) {
        echo "<b>Generating {$mask['filename']}...</b><br><br>";

        // Solar Radii in pixels
        $rsunInPixels = $mask["rsun"] / $mask["imageScale"];
        
        // Mask is centered by default
        $innerX = $mask['width'] / 2;
        $innerY = $mask['height'] / 2;
        $outerX = $mask['width'] / 2;
        $outerY = $mask['height'] / 2;
        
        // Offset COR2-B images
        if ($mask['filename'] == "COR2-B_Mask.png") {
            $innerX += 19;
            $innerY += 28;
            $outerY -= 2;
            $outerX -= 5;
        } else if ($mask['filename'] == "COR1-B_Mask.png") {
            $innerX += 2;
            $innerY += 27;
        }
        
        // Convert to pixels
        $radiusInner  = $mask['roccInner'] * $rsunInPixels;
        $radiusOuter  = $mask['roccOuter'] * $rsunInPixels;
        $innerCircleY = $innerY + $radiusInner;
        $outerCircleY = $outerY + $radiusOuter;
        
        // The ImageMagick circle primitive makes a disk (filled) or 
        // circle (unfilled).Give the center and any point on the perimeter.
        $cmd = 'convert -size %dx%d xc:black -fill white -draw ' .
               '"circle %d,%d %d,%d" -fill black -draw "circle %d,%d %d,%d" ' .
               '-monochrome out/%s';
        
        $cmd = sprintf(
            $cmd, $mask['width'], $mask['height'], $outerX, $outerY, $outerX,
            $outerCircleY, $innerX, $innerY, $innerX, $innerCircleY,
            $mask['filename']
        );
        //$cmd = "convert -size {$mask['width']}x{$mask['height']} xc:black -fill white -draw \"circle $crpix1,$crpix2 $crpix1,$outerCircleY\"" .
        //       " -fill black -draw \"circle $crpix1,$crpix2 $crpix1,$innerCircleY\" -monochrome out/{$mask['filename']}";
        
        echo "<div style='margin:20px;'>$cmd</div><br>";
        exec(escapeshellcmd($cmd));
        echo "Done!<br><br>";
    }
?>
