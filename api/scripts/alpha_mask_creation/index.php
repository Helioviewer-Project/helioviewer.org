<?php
    // Helioviewer.org LASCO Alpha Mask Generation
    // keith.hughitt@nasa.gov
    //
    // last update 2009/02/26
    //
    // Note: In order to run properly, the script expects to find a writable directory named "out" in
    //       the current working directory.
    //
    
    
    // Mask properties
    $width  = 1040;
    $height = 1040;
    $crpix1 = $width  / 2;
    $crpix2 = $height / 2;
    
    // Solar Radii in Arcseconds
    $rsunArcSeconds = 959.705;

    // LASCO C2
    $c2 = array(
        "filename"   => "LASCO_C2_Mask.png",
        "imageScale" => 11.9,
        "roccInner"  => 2.415, // 1.05 * orig
        "roccOuter"  => 7.7    // 0.9625 * orig
    );
    
    // LASCO C2
    $c3 = array(
        "filename"   => "LASCO_C3_Mask.png",
        "imageScale" => 56.0,
        "roccInner"  => 4.4,
        "roccOuter"  => 31.5
    );
    
    // Create masks
    foreach(array($c2, $c3) as $mask) {
        echo "<b>Generating {$mask['filename']}...</b><br><br>";

        // Solar Radii in pixels
        $rsun = $rsunArcSeconds / $mask["imageScale"];
        
        // Convert to pixels
        $radiusInner  = $mask['roccInner'] * $rsun;
        $radiusOuter  = $mask['roccOuter'] * $rsun;
        $innerCircleY = $crpix2 + $radiusInner;
        $outerCircleY = $crpix2 + $radiusOuter;
        
        // The ImageMagick circle primitive makes a disk (filled) or circle (unfilled). 
        // Give the center and any point on the perimeter (boundary).
        $cmd = "convert -size {$width}x$height xc:black -fill white -draw \"circle $crpix1,$crpix2 $crpix1,$outerCircleY\"" .
               " -fill black -draw \"circle $crpix1,$crpix2 $crpix1,$innerCircleY\" -monochrome out/{$mask['filename']}";
        echo "<div style='margin:20px;'>$cmd</div><br>";
        exec($cmd);
        echo "Done!<br><br>";
    }
?>
