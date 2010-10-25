<?php
/**
 * IMagick Benchmarking Suite
 * 
 * This test was designed to ease the process of testing different techniques for reducing
 * the overall processing time required to generate tile, screenshots and movies used in
 * Helioviewer.org. 
 * 
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 */
runBenchmark(20, array(
    "input_quality"  => 1,
    "output_format"  => "PNG",
    "imagestrings"   => true  
)); 

//
// printResults
//
function printResults($times, $options) {
    print "<h1>Helioviewer Benchmark Results:</h1><br />\n";
    print "<b style='text-decoration:underline;'>Options:</b><br />\n<pre>";
    foreach ($options as $key=>$val) {
        if (is_bool($val))
            $val = $val ? "True" : "False";
        printf("%-13s : %s<br />\n", strtoupper($key), $val);
    }
    
    $average = array_sum($times) / count($times);
    
    printf("</pre><br />\n<span style='color: darkblue;'>Average time: %0.2fs</span><br /><br />\n", $average);
    
    printf("Filesize: %0.04f Mb<br /><br />\n", filesize("final." . strtolower($options["output_format"])) / 1e6);
    
    printf ("<b style='text-decoration:underline;'>Times (n=%d):</b><br />\n", count($times));
    
    $timesStr = "";
    foreach($times as $time) {
        $timesStr .= sprintf("%0.5f, ", $time);
    }
    print substr($timesStr, 0, -2);
}

//
// runBenchmark
//
function runBenchmark($n=10, $options=array()) {
    // Current settings used by Helioviewer.org
    $defaults = array(
        "inter_format"   => "PNG",
        "output_format"  => "PNG",
        "type"           => "Imagick::IMGTYPE_GRAYSCALE",
        "interlace"      => "IMagick::INTERLACE_PLANE",
        "compression"    => "IMagick::COMPRESSION_JPEG", //PNG: COMPRESSION_LZW
        "input_quality"  => null,
        "output_quality" => 20,
        "depth"          => 8,
        "imgstrings"     => false,
        "base64"         => false,
        "use_gd"         => true
    );
    
    // Replace default options
    $options = array_replace($defaults, $options);
    
    // Import image builder
    if ($options['imgstrings']) {
        require_once "src/ImageBuilderNew.php";
    } else {
        require_once "src/ImageBuilderOld.php";
    }

    set_time_limit(3000);
    
    // Run test n times using specified options
    $times = array();
    for ($i=0; $i<$n; $i++) {
        $start = microtime(true);

        buildImage($options);

        $end = microtime(true);
        $time = $end - $start;
        
        array_push($times, $time);
    }
    
    // Print results
    printResults($times, $options);
}

 

?>
