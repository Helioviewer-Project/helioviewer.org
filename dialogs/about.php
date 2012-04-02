<?php
if (!$config = parse_ini_file("../settings/Config.ini"))
    die("Missing config file!");
?>
<img src="<?php echo $config['about_logo']; ?>" alt="Helioviewer.org Logo"><br>
<div style="width:100%; text-align: center;">
    <span style="margin-left: auto; margin-right: auto; font-size:small;"><?php printf("Last Updated: %s (2.3.0)", $config["last_update"]); ?></span>
</div>
<br />

Helioviewer.org is an open-source project for the visualization of solar and heliospheric data. 
The project is funded by <acronym title="European Space Agency">ESA</acronym> and <acronym title="National Aeronautics and Space Administration">NASA</acronym>. 
For more information, please visit our <a href="http://helioviewer.org/wiki/Main_Page" style="text-decoration: underline; font-weight: normal;" class="light">Wiki</a>.

<br /><br />

<!-- Credits -->
<div id='about-credits' style='width:100%; text-align:center;'>
    <span style="margin-left:auto; margin-right: auto;">
        <b>Credits: </b><br />
        <a href='http://sdo.gsfc.nasa.gov/'>SDO (NASA)</a>, 
        <a href='http://sohowww.nascom.nasa.gov/'>SOHO</a> (<a href='http://soho.esac.esa.int/' title='European Space Agency'>ESA</a>/<a href='http://nasa.gov/' title='National Aeronautics and Space Administration'>NASA</a>),  
        <a href='http://www.nasa.gov/mission_pages/stereo/main/index.html'>STEREO (NASA)</a>,
        <a href='http://www.nasa.gov/centers/goddard/home/index.html' title='Goddard Space Flight Center'>GSFC</a>,
        <a href='http://www.lmsal.com' title='Lockheed Martin Solar & Astrophysics Laboratory'>LMSAL</a>, 
        <a href='http://umbra.nascom.nasa.gov/' title='Solar Data Analysis Center'>SDAC</a>,
        <a href='http://sun.stanford.edu/'>Stanford University</a>
    </span>
</div>
