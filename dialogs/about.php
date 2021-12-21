<?php
// Returns the latest git tag, which is equivalent to the latest
// version string.
function get_version() {
    // Gets the most recent tag even if it's not the current commit.
    $result = shell_exec("git describe --tags --abbrev=0");
    // Command will fail if git isn't installed or if it's not a git repository.
    // In that case, return version unknown.
    if (!$result) {
        return "Unknown";
    }

    return trim($result);
}

// Get the current commit date to show as the "Last Updated" time.
function get_date() {
    $result = shell_exec("git show -s --format=%as .");
    if (!$result) {
        return "Unknown";
    }
    return trim($result);
}

function print_version_info() {
    $date = get_date();
    $version = get_version();
    echo $date . " (" . $version . ")";
}
?>

<img src="resources/images/logos/about_white.png" alt="Helioviewer.org Logo"><br>
<div style="width:100%; text-align: center;">
    <span style="margin-left: auto; margin-right: auto; font-size:small;">Last Updated: <?php print_version_info()?></span>
</div>
<br />

Helioviewer.org is part of the <a href="https://github.com/Helioviewer-Project" style="font-weight: normal;" class="light" target="_blank">Helioviewer Project</a>, an open-source project for the visualization of solar and heliospheric data.
The Helioviewer Project is funded by <acronym title="European Space Agency">ESA</acronym> and <acronym title="National Aeronautics and Space Administration">NASA</acronym>.
For more information, please visit our <a href="http://helioviewer.org/wiki/Main_Page" style="font-weight: normal;" class="light" target="_blank">Wiki</a>.

<br /><br />

<!-- Credits -->
<div id="about-credits" style="width:100%; text-align:center;">
    <span style="margin-left:auto; margin-right: auto;">
        <b>Credits: </b><br />
        <a href="http://sdo.gsfc.nasa.gov/" target="_blank">SDO (NASA)</a>,
        <a href="http://sohowww.nascom.nasa.gov/" target="_blank">SOHO</a> (<a href="http://soho.esac.esa.int/" title="European Space Agency" target="_blank">ESA</a>/<a href="http://nasa.gov/" title="National Aeronautics and Space Administration" target="_blank">NASA</a>),
        <a href="http://www.nasa.gov/mission_pages/stereo/main/index.html" target="_blank">STEREO (NASA)</a>,
        <a href="http://sci.esa.int/proba2/" target="_blank">PROBA2 (ESA)</a>,
        <a href="http://www.isas.ac.jp/e/enterp/missions/yohkoh/index.shtml" target="_blank">Yohkoh (JAXA/NASA/PPARC)</a>,
        <a href="http://www.isas.jaxa.jp/home/solar/" target="_blank">Hinode (JAXA/NASA/PPARC)</a>,
        <a href="http://www.nasa.gov/centers/goddard/home/index.html" title="Goddard Space Flight Center" target="_blank">GSFC</a>,
        <a href="http://www.astro.oma.be/" title="Royal Observatory of Belgium" target="_blank">Royal Observatory of Belgium</a>,
        <a href="http://www.lmsal.com" title="Lockheed Martin Solar &amp; Astrophysics Laboratory" target="_blank">LMSAL</a>,
        <a href="http://umbra.nascom.nasa.gov/" title="Solar Data Analysis Center" target="_blank">SDAC</a>,
        <a href="http://sun.stanford.edu/" target="_blank">Stanford University</a>,
        <a href="https://www.cfa.harvard.edu/" target="_blank">Harvard-Smithsonian Astrophysical Observatory</a>,
        <a href="http://solar.physics.montana.edu/sol_phys/fft/" target="_blank">MSU/SDO-FFT</a>
    </span>
</div>
<br />
<!-- Sponsored by -->
<div id="about-credits" style="width:100%; text-align:center;">
    <span style="margin-left:auto; margin-right: auto;">
        <b>Helioviewer.org makes use of the following tools:</b><br />
        <a href="https://www.browserstack.com/" target="_blank">BrowserStack</a> - Cross Browser Testing Tool.<br/>
        <a href="http://www.highcharts.com/" target="_blank">Highcharts</a> - Interactive JavaScript charts for your webpage.<br/>
	<a href="https://sunpy.org/" target="_blank">SunPy</a> - Solar data analysis environment for Python. <br/>
        <a href="https://github.com/nikolaposa/rate-limit" target="_blank">Rate-Limit</a> - API level rate-limiting by Nikola Posa. <br/>
        <a href="https://redis.io/" target="_blank">Redis</a> - Open source (BSD licensed), in-memory data structure store. <br/>
    </span>
    <br/>
    <span style="margin-left:auto; margin-right: auto;">
        <b>YouTube API Client Acknowledgements:</b><br />
        <a href="https://www.youtube.com/terms" target="_blank">YouTube Terms of Service (ToS)</a> <br/>
        <a href="https://policies.google.com/privacy" target="_blank">Google Privacy Policy</a> <br/>
        <a href="https://security.google.com/settings/security/permissions" target="_blank">Revoke YouTube API Access for Helioviewer.org</a> <br/>

    </span>
</div>
