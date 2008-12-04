<?php
abstract class JP2Image {
	protected $noImage    = "images/transparent.gif";
	protected $kdu_expand = "kdu_expand";
	protected $cacheDir   = "/var/www/hv/tiles/";
	protected $baseScale  = 2.63; //Scale of an EIT image at the base zoom-level: 2.63 arcseconds/px
	protected $baseZoom   = 10;   //Zoom-level at which (EIT) images are of this scale.		
}
?>