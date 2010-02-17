<?php
if (!$config = parse_ini_file("../settings/Config.ini"))
    die("Missing config file!"); 
?>
<img src="resources/images/logos/about_white.png" alt="Helioviewer.org Logo"><br>
<div style="width:100%; text-align: center;">
    <span style="margin-left: auto; margin-right: auto; font-size:small;"><?php printf("Last Updated: %s (rev. %s)", $config["last_update"], $config["build_num"]); ?></span>
</div>
<br><br>

<!-- The Helioviewer Team -->
<div style='width:100%; text-align:center;'>
    <span style="text-decoration: underline; margin-left:auto; margin-right: auto;">The Helioviewer Team:</span>
</div>

<div style="font-size: small; margin-top:10px;">
    <a href="mailto:aa5@umbc.edu" class="light" style="margin-right:10px;">Alen Agheksanterian</a>
	<a href="mailto:jabeck@nmu.edu" class="light" style="margin-right:10px;">Jaclyn Beck</a>
    <a href="mailto:george@esa.nascom.nasa.gov" class="light" style="margin-right:10px;">George Dimitoglou</a>
    <a href="mailto:webmaster@helioviewer.org" class="light" style="margin-right:10px;">Keith Hughitt</a>
    <a href="mailto:Jack.Ireland@nasa.gov" class="light" style="margin-right:10px;">Jack Ireland</a>
    <a href="mailto:dmueller@esa.nascom.nasa.gov" class="light" style="margin-right:10px;">Daniel M&uuml;ller</a>
    <a href="jportiz@ace.ual.es" class="light" style="margin-right:10px;">Juan Pablo Garcia Ortiz</a>
</div>

