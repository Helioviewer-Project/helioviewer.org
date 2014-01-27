<?php


   define('JULIAN_DAY_ON_NOON01JAN1900', 2415021.0);
   //define('RADIUS', 695500000.0);
   define('RADIUS', 695508000.0);
   define('AU', 149597870691.0);
   define('DAYS_IN_YEAR', 36525.0);
    
   $GLOBALS['TIME_FORMAT_LIST'] = Array(
      "%Y-%m-%dT%H:%M:%S.%f",    # Example 2007-05-04T21:08:12.999999
      "%Y/%m/%dT%H:%M:%S.%f",    # Example 2007/05/04T21:08:12.999999
      "%Y-%m-%dT%H:%M:%S.%fZ",   # Example 2007-05-04T21:08:12.999Z
      "%Y-%m-%dT%H:%M:%S",       # Example 2007-05-04T21:08:12
      "%Y/%m/%dT%H:%M:%S",       # Example 2007/05/04T21:08:12
      "%Y%m%dT%H%M%S.%f",        # Example 20070504T210812.999999  (no native PHP support)
      "%Y%m%dT%H%M%S",           # Example 20070504T210812
      "%Y/%m/%d %H:%M:%S",       # Example 2007/05/04 21:08:12
      "%Y/%m/%d %H:%M",          # Example 2007/05/04 21:08
      "%Y/%m/%d %H:%M:%S.%f",    # Example 2007/05/04 21:08:12.999999
      "%Y-%m-%d %H:%M:%S.%f",    # Example 2007-05-04 21:08:12.999999
      "%Y-%m-%d %H:%M:%S",       # Example 2007-05-04 21:08:12
      "%Y-%m-%d %H:%M",          # Example 2007-05-04 21:08
      "%Y-%b-%d %H:%M:%S",       # Example 2007-May-04 21:08:12
      "%Y-%b-%d %H:%M",          # Example 2007-May-04 21:08
      "%Y-%b-%d",                # Example 2007-May-04
      "%Y-%m-%d",                # Example 2007-05-04
      "%Y/%m/%d",                # Example 2007/05/04
      "%d-%b-%Y",                # Example 04-May-2007
      "%Y%m%d_%H%M%S",           # Example 20070504_210812  (no native PHP support)
   );    
    
    
   # doesn't handle cases where month or day are 1 digit
   $GLOBALS['REGEX'] = Array(
      '%Y' => '(?P<year>\d{4})',
      '%m' => '(?P<month>\d{2})',
      '%d' => '(?P<day>\d{2})',
      '%H' => '(?P<hour>\d{2})',
      '%M' => '(?P<minute>\d{2})',
      '%S' => '(?P<second>\d{2})',
      '%f' => '(?P<microsecond>\d+)',
      '%b' => '(?P<month_str>[a-zA-Z]+)'
   );
   
   
   # Higher precision formats must be listed above lower-precision formats
   $test_strings = Array(
      '2007-05-04T21:08:12.999999',
      '2007/05/04T21:08:12.999999',
      '2007-05-04T21:08:12.999Z',
      '2007-05-04T21:08:12',
      '2007/05/04T21:08:12',
      '20070504T210812.999999', // PHP can't parse natively
      '20070504T210812',
      '2007/05/04 21:08:12',
      '2007/05/04 21:08',
      '2007/05/04 21:08:12.999999',
      '2007-05-04 21:08:12.999999',
      '2007-05-04 21:08:12',
      '2007-05-04 21:08',
      '2007-May-04 21:08:12',
      '2007-May-04 21:08',
      '2007-May-04',
      '2007-05-04',
      '2007/05/04',
      '04-May-2007',
      '20070504_210812' // PHP can't parse natively
   );
    
    
   function parse_time($time_string) {
      
      foreach ( $GLOBALS['TIME_FORMAT_LIST'] as $time_format ) {
         $re_format = str_replace('/','\/',$time_format);
         foreach ( $GLOBALS['REGEX'] as $key => $value ) {
            $re_format = str_replace($key, $value, $re_format);
         }
         $re_format = '/'.$re_format.'/';
         
         if ( preg_match($re_format, $time_string, $matches) ) {
            break;
         }
      }
        
      # Only allow the approved time formats 
      # from $GLOBALS['TIME_FORMAT_LIST']
      if ( count($matches) == 0 ) {
         throw new Exception('Not a supported time format: '.$time_string);
      }
        
      if ( !isset($matches['hour']) ) { $matches['hour'] = '00'; } 
      if ( !isset($matches['minute']) ) { $matches['minute'] = '00'; } 
      if ( !isset($matches['second']) ) { $matches['second'] = '00'; } 
      if ( !isset($matches['microsecond']) ) { $matches['microsecond'] = '00'; } 
      
      if ( isset($matches['month_str']) && !isset($matches['month']) ) {
         $time_format = 'Y-M-d\TH:i:s.u';
         $time_string = $matches['year']   . '-'
                      . $matches['month_str']  . '-'
                      . $matches['day']    . 'T'
                      . $matches['hour']   . ':'
                      . $matches['minute'] . ':'
                      . $matches['second'] . '.'
                      . $matches['microsecond'];
      }
      else {
         $time_format = 'Y-m-d\TH:i:s.u';
         $time_string = $matches['year']   . '-'
                      . $matches['month']  . '-'
                      . $matches['day']    . 'T'
                      . $matches['hour']   . ':'
                      . $matches['minute'] . ':'
                      . $matches['second'] . '.'
                      . $matches['microsecond'];
      }
        
      # NB: Truncates microseconds
      return DateTime::createFromFormat($time_format, $time_string, new DateTimeZone('UTC'));
   }
   
   
   function julian_day($t=null) {
   /* Returns the (fractional) Julian day defined as the number of days 
      between the queried day and the reference date of 12:00 (noon) Jan 1, 4713 
      BC. 
   */
   
      # Good online reference for fractional julian day
      # http://www.stevegs.com/jd_calc/jd_calc.htm    
      $JULIAN_REF_DAY = parse_time('1900/01/01 12:00:00');
      
      if ( gettype($t) != 'object' || get_class($t) != 'DateTime' ) {
         $time = parse_time($t);
      }
      else {
         $time = $t;
      }
      
      $tdiff = $time->diff( $JULIAN_REF_DAY );   
      $julian = $tdiff->days + JULIAN_DAY_ON_NOON01JAN1900;
       
      $result = $julian + 1 / 24. * ($time->format('H') + $time->format('i') / 60.0 + 
                                     $time->format('s') / (60. * 60.));
      
      # This is because the days in datetime objects start at 00:00, 
      # not 12:00 as for Julian days.
      if ( $time->format('H') >= 12 ) {
         $result = $result - 0.5;
      }
      else {
         $result = $result + 0.5;
      }
   
      return $result;
   }
   
   
   
   function sun_pos($date, $is_julian=false, $since_2415020=false) {
   /* Calculate solar ephemeris parameters.  Allows for planetary and lunar
      perturbations in the calculation of solar longitude at date and various
      other solar positional parameters. This routine is a truncated version of
      Newcomb's Sun and is designed to give apparent angular coordinates (T.E.D)
      to a precision of one second of time.
   
      Parameters
      -----------
      date: a date/time object or a fractional number of days since JD 2415020.0
   
      is_julian: { False | True }
         notify this routine that the variable "date" is a Julian date
         (a floating point number)
   
      since_2415020: { False | True }
         notify this routine that the variable "date" has been corrected for
         the required time offset
   
      Returns:
      -------
      A dictionary with the following keys with the following meanings:
   
      longitude  -  Longitude of sun for mean equinox of date (degs)
      ra         -  Apparent RA for true equinox of date (degs)
      dec        -  Apparent declination for true equinox of date (degs)
      app_long   -  Apparent longitude (degs)
      obliq      -  True obliquity (degs)longditude_delta:
   
      See Also
      --------
      IDL code equavalent:
         http://hesperia.gsfc.nasa.gov/ssw/gen/idl/solar/sun_pos.pro
   
      Examples
      --------
      >>> sp = sun_pos('2013-03-27')
   */
   
      # check the time input
      if ( $is_julian ) {
         # if a Julian date is being passed in
         if ( $since_2415020 ) {
            $dd = $date;
         }
         else {
            $dd = $date - 2415020.0;
         }
      }
      else {
         # parse the input time as a julian day
         if ( $since_2415020 ) {
            $dd = julian_day($date);
         }
         else {
             $dd = julian_day($date) - 2415020.0;
         }
      }
   
      # form time in Julian centuries from 1900.0
      $t = $dd / 36525.0;
         
      # form sun's mean longitude
      $l = (279.6966780 + fmod(36000.7689250 * $t, 360.00)) * 3600.0;
      
      # allow for ellipticity of the orbit (equation of centre) using the Earth's
      # mean anomaly ME
      $me = 358.4758440 + fmod(35999.049750 * $t, 360.0);
      
      $ellcor = (6910.10 - 17.20 * $t) * sin(deg2rad($me)) + 72.30 * sin(deg2rad(2.0 * $me));
      $l = $l + $ellcor;
  
      # allow for the Venus perturbations using the mean anomaly of Venus MV
      $mv = 212.603219 + fmod(58517.8038750 * $t, 360.0);
      $vencorr = 4.80 * cos(deg2rad(299.10170 + $mv - $me)) 
               + 5.50 * cos(deg2rad(148.31330 + 2.0 * $mv - 2.0 * $me)) 
               + 2.50 * cos(deg2rad(315.94330 + 2.0 * $mv - 3.0 * $me)) 
               + 1.60 * cos(deg2rad(345.25330 + 3.0 * $mv - 4.0 * $me)) 
               + 1.00 * cos(deg2rad(318.150   + 3.0 * $mv - 5.0 * $me));
      $l = $l + $vencorr;
  
      # Allow for the Mars perturbations using the mean anomaly of Mars MM
      $mm = 319.5294250 + fmod(19139.858500 * $t, 360.0);
      $marscorr = 2.0  * cos(deg2rad(343.88830 - 2.0 * $mm + 2.0 * $me)) 
                + 1.80 * cos(deg2rad(200.40170 - 2.0 * $mm + $me));
      $l = $l + $marscorr;
  
      # Allow for the Jupiter perturbations using the mean anomaly of Jupiter MJ
      $mj = 225.3283280 + fmod(3034.69202390 * $t, 360.00);
      $jupcorr = 7.20 * cos(deg2rad(179.53170 - $mj + $me)) 
               + 2.60 * cos(deg2rad(263.21670 - $mj)) 
               + 2.70 * cos(deg2rad(87.14500 - 2.0 * $mj + 2.0 * $me)) 
               + 1.60 * cos(deg2rad(109.49330 - 2.0 * $mj + $me));
      $l = $l + $jupcorr;
   
      # Allow for the Moons perturbations using the mean elongation of the Moon
      # from the Sun D
      $d = 350.73768140 + fmod(445267.114220 * $t, 360.0);
      $mooncorr = 6.50 * sin(deg2rad($d));
      $l = $l + $mooncorr;
  
      # Note the original code is
      # longterm  = + 6.4d0 * sin(( 231.19d0  +  20.20d0 * t )*!dtor)
      $longterm = 6.40 * sin(deg2rad(231.190 + 20.20 * $t));
      $l = $l + $longterm;
      $l = fmod($l + 2592000.0, 1296000.0);
      $longmed = $l / 3600.0;
  
      # Allow for Aberration
      $l = $l - 20.5;
  
      # Allow for Nutation using the longitude of the Moons mean node OMEGA
      $omega = 259.1832750 - fmod(1934.1420080 * $t, 360.0);
      $l = $l - 17.20 * sin(deg2rad($omega));
  
      # Form the True Obliquity
      $oblt = 23.4522940 - 0.01301250 * $t 
            + (9.20 * cos(deg2rad($omega))) / 3600.0;
  
      # Form Right Ascension and Declination
      $l = $l / 3600.0;
      $ra = rad2deg( atan2( sin(deg2rad($l)) * cos(deg2rad($oblt)), 
                            cos(deg2rad($l))
                             ) );
      
      if ( $ra < 0.0 ) {
         $ra = $ra + 360.0;
      }
   
      $dec = rad2deg(asin(sin(deg2rad($l)) 
           * sin(deg2rad($oblt))));
   
      # convert the internal variables to those listed in the top of the
      # comment section in this code and in the original IDL code.
      return Array( "longitude" => $longmed, 
                    "ra"        => $ra, 
                    "dec"       => $dec, 
                    "app_long"  => $l,
                    "obliq"     => $oblt );
   }



   function pb0r($date, $spacecraft=null, $arcsec=false) {
   /* To calculate the solar P, B0 angles and the semi-diameter.
  
      Parameters
      -----------
      date: a date/time object
  
      spacecraft: { "soho" | "stereo_a" | "stereo_b" }
         calculate the solar P, B0 angles and the semi-diameter from the point
         of view of either SOHO or either of the STEREO spacecraft.  SOHO sits
         at the Lagrange L1 point which is about 1% closer to the Sun than the
         Earth.  Implementation of this seems to require the ability to read
         SOHO orbit files.
  
      arcsec: { False | True }
         return the semi-diameter in arcseconds.
  
      Returns:
      -------
      A dictionary with the following keys with the following meanings:
  
      p  -  Solar P (position angle of pole)  (degrees)
      b0 -  latitude of point at disk centre (degrees)
      sd -  semi-diameter of the solar disk in arcminutes
  
      See Also
      --------
      IDL code equavalent:
         http://hesperia.gsfc.nasa.gov/ssw/gen/idl/solar/pb0r.pro

   */

      if ( $spacecraft !== null ) {
         throw new Exception( 'Solar P, B0 and semi-diameter calcution'
                             .' is not supported for STEREO spacecraft or SOHO'
                             .' simultaneously.');
      }
       
      # number of Julian days since 2415020.0
      $de = julian_day($date) - 2415020.0;
 
  
      # get the longitude of the sun etc.
      $sun_position = sun_pos($date);

      $longmed = $sun_position["longitude"];
      #$ra = $sun_position["ra"];
      #$dec = $sun_position["dec"];
      $appl = $sun_position["app_long"];
      $oblt = $sun_position["obliq"];
  
      # form the aberrated longitude
      $Lambda = $longmed - (20.50 / 3600.0);
  
      # form longitude of ascending node of sun's equator on ecliptic
      $node = 73.6666660 + (50.250 / 3600.0) * (($de / 365.250) + 50.0);
      $arg = $Lambda - $node;

      # calculate P, the position angle of the pole
      $p = rad2deg( atan(-tan(deg2rad($oblt)) * cos(deg2rad($appl))) 
                   +atan(-0.127220 * cos(deg2rad($arg))) );
  
      # B0 the tilt of the axis...
      $b = rad2deg(asin(0.12620 * sin(deg2rad($arg))));
  
      # ... and the semi-diameter
      # Form the mean anomalies of Venus(MV),Earth(ME),Mars(MM),Jupiter(MJ)
      # and the mean elongation of the Moon from the Sun(D).
      $t  = $de / 36525.0;
      $mv = 212.60   + fmod(58517.80    * $t, 360.0);
      $me = 358.4760 + fmod(35999.04980 * $t, 360.0);
      $mm = 319.50   + fmod(19139.860   * $t, 360.0);
      $mj = 225.30   + fmod(3034.690    * $t, 360.0);
      $d  = 350.70   + fmod(445267.110  * $t, 360.0);
  
      # Form the geocentric distance(r) and semi-diameter(sd)
      $r = 1.0001410 - (0.0167480 - 0.00004180 * $t) * cos(deg2rad($me)) 
         - 0.000140  * cos(deg2rad(2.0    * $me)) 
         + 0.0000160 * cos(deg2rad(58.30  + 2.0 * $mv - 2.0 * $me)) 
         + 0.0000050 * cos(deg2rad(209.10 + $mv - $me)) 
         + 0.0000050 * cos(deg2rad(253.80 - 2.0 * $mm + 2.0 * $me)) 
         + 0.0000160 * cos(deg2rad(89.50  - $mj + $me)) 
         + 0.0000090 * cos(deg2rad(357.10 - 2.0 * $mj + 2.0 * $me)) 
         + 0.0000310 * cos(deg2rad($d));
 
      $sd_const = RADIUS / AU;
      $sd = asin($sd_const / $r) * 10800.0 / pi();
  
      # place holder for SOHO correction
      if ( $spacecraft == 'soho' ) {
         throw new Exception('SOHO correction (on the order of 1% ' 
                            .'since SOHO sets at L1) not yet supported.');
      }
             
      if ( $arcsec ) {
         return Array( "p"  => $p, 
                       "b0" => $b, 
                       "sd" => $sd * 60.0 );
      }
      else {
         return Array( "p"  => $p, 
                       "b0" => $b, 
                       "sd" => $sd, 
                       "l0" => 0.0 );
      }
   }
   


   function convert_hcc_hg($rsun, $b0, $l0, $x, $y, $z=null) {
   /* Convert Heliocentric-Cartesian (HCC) to Heliographic coordinates (HG)
      (given in degrees).
   */
   
      if ( $z === null ) {
         $z = sqrt( pow($rsun,2) - pow($x,2) - pow($y,2) );
      }
      
      $b0   = deg2rad($b0);
      $l0   = deg2rad($l0);
      $cosb = cos($b0);
      $sinb = sin($b0);
      
      $hecr =  sqrt( pow($x,2) + pow($y,2) + pow($z,2) );
      $hgln = atan2( $x, $z * $cosb - $y * $sinb ) + $l0;
      $hglt =  asin( ($y * $cosb + $z * $sinb) / $hecr );

      return Array( rad2deg($hgln), rad2deg($hglt) );
   }
   
   
   
   function convert_hg_hpc($rsun, $dsun, $b0, $l0, $hglon, $hglat, $units=null,
                           $occultation=false) {
      /* Convert Heliographic coordinates (HG) to Helioprojective-Cartesian
      (HPC) */
    
      list($tempx, $tempy) = convert_hg_hcc($rsun, $b0, $l0, $hglon, $hglat, $occultation);
      list($x, $y) = convert_hcc_hpc($rsun, $dsun, $tempx, $tempy, $units=$units);
      
      return Array($x, $y);
   }



   function convert_hpc_hg($rsun, $dsun, $units_x, $units_y, $b0, $l0, $x, $y) {
      /* Convert Helioprojective-Cartesian (HPC) to Heliographic coordinates
      (HG) */
    
      list($tempx, $tempy) = convert_hpc_hcc($rsun, $dsun, $units_x, $units_y, $x, $y);
      list($lon, $lat) = convert_hcc_hg($rsun, $b0, $l0, $tempx, $tempy);
    
      return Array($lon, $lat);
   }
   
   
   
   function convert_hpc_hcc($rsun, $dsun, $units_x, $units_y, $hpx, $hpy,
                             $distance=null) {
      /* This routine converts Helioprojective-Cartesian (HPC) coordinates into
      Heliocentric-Cartesian (HCC) coordinates, using equations 15 in
      Thompson (2006), A&A, 449, 791-803. Returns only x and y. */
      
      list($x, $y, $z) = convert_hpc_hcc_xyz($rsun, $dsun, $units_x, $units_y, $hpx, $hpy);
    
      return Array($x, $y);
   }
   
   
   function convert_hcc_hpc($rsun, $dsun, $x, $y, $units=null, $distance=null) {
      /* Convert Heliocentric-Cartesian (HCC) to angular
      Helioprojective-Cartesian (HPC) coordinates (in degrees). */

      // Should we use the rsun_ref defined in the fits file or our
      // local (possibly different/more correct) definition

      // Calculate the z coordinate by assuming that it is on the surface of the
      // Sun
      
      $z = sqrt(pow($rsun,2) - pow($x,2) - pow($y,2));
      
      $zeta = $dsun - $z;
      $distance = sqrt(pow($x,2) + pow($y,2) + pow($zeta,2));
      $hpcx = rad2deg(atan2($x, $zeta));
      $hpcy = rad2deg(asin($y / $distance));
      
      if ( $units == 'arcsec' ) {
         $hpcx = 60. * 60. * $hpcx;
         $hpcy = 60. * 60. * $hpcy;
      }
      
      return Array($hpcx, $hpcy);
   }
    
    
   function convert_hpc_hcc_xyz($rsun, $dsun, $units_x, $units_y, $hpx, $hpy, 
                                $distance=null) {
      /* This routine converts Helioprojective-Cartesian (HPC) coordinates into
      Heliocentric-Cartesian (HCC) coordinates, using equations 15 in
      Thompson (2006), A&A, 449, 791-803.
      */
      
      $c = Array(convert_angle_units($unit=$units_x),
                 convert_angle_units($unit=$units_y));

      $cosx = cos($hpx * $c[0]);
      $sinx = sin($hpx * $c[0]);
      $cosy = cos($hpy * $c[1]);
      $siny = sin($hpy * $c[1]);

      if ( $distance == null ) {
         $q = $dsun * $cosy * $cosx;
         $distance = pow($q,2) - pow($dsun,2) + pow($rsun,2);
         # distance[np.where(distance < 0)] = np.sqrt(-1)
         $distance = $q - sqrt($distance);
      }

      $x = $distance * $cosy * $sinx;
      $y = $distance * $siny;
      $z = $dsun - $distance * $cosy * $cosx;

      return Array($x, $y, $z);
   }
   
   
   function convert_angle_units($unit='arcsec') {
      /* Determine the conversion factor between the data and radians. */

      if ( $unit == 'deg') {
         return deg2rad(1);
      }
      else if ( $unit == 'arcmin' ) {
         return deg2rad(1) / 60.0;
      }
      else if ( $unit == 'arcsec') {
         return deg2rad(1) / (60 * 60.0);
      }
      else if ( $unit == 'mas' ) {
         return deg2rad(1) / (60 * 60 * 1000.0);
      }
   }



   function diff_rot($ddays, $latitude, $frame_time='sidereal', $rot_type='howard') {
   /* This function computes the change in longitude over days in degrees.
   
      Parameters
      -----------
      ddays: float
         Number of days to rotate over.
  
      latitude: float or array-like
         heliographic coordinate latitude in Degrees.
  
      rot_type: {'howard' | 'snodgrass' | 'allen'}
         howard:    Use values for small magnetic features from Howard et al.
         snodgrass: Use Values from Snodgrass et. al
         allen:     Use values from Allen, Astrophysical Quantities, and simplier
                    equation.
   
      frame_time: {'sidereal' | 'synodic'}
         Choose 'type of day' time reference frame.
  
      Returns:
      -------
      longditude_delta: ndarray
         The change in longitude over days (units=degrees)
  
      See Also
      --------
      IDL code equavalent:
         http://hesperia.gsfc.nasa.gov/ssw/gen/idl/solar/diff_rot.pro
  
      Howard rotation:
         http://adsabs.harvard.edu/abs/1990SoPh..130..295H
  
      A review of rotation parameters (including Snodgrass values):
         http://link.springer.com/article/10.1023%2FA%3A1005226402796
  
      Examples
      --------
      Default rotation calculation over two days at 30 degrees latitude:
         rotation = diff_rot(2, 30)
      Default rotation over two days for a number of latitudes:
         rotation = diff_rot(2, np.linspace(-70, 70, 20))
      With rotation type 'allen':
         rotation = diff_rot(2, np.linspace(-70, 70, 20), 'allen')
   */
      if ( !is_numeric($ddays) ) {
         throw new Exception(  'Invalid type for $ddays.');
      }
      
      $delta_seconds = $ddays * 24. * 60. * 60.;
      $delta_days    = $ddays;
              
      $sin2l = pow(sin(deg2rad($latitude)), 2);
      $sin4l = pow($sin2l,2);
  
      $rot_params = Array( 'howard'    => Array(2.894, -0.428, -0.370),
                           'snodgrass' => Array(2.851, -0.343, -0.474) ); 
       
      if ( !in_array($rot_type, Array('howard','allen','snodgrass')) ) {
         throw new Exception( "rot_type must equal one of "
                             ."{'howard'|'allen'|'snodgrass'}");
      }
      else if ( $rot_type == 'allen' ) {
         $rotation_deg = $delta_days * (14.44 - (3.0 * $sin2l));
      }
      else {
         list($A, $B, $C) = $rot_params[$rot_type];
  
         # This is in micro-radians / sec
         $rotation_rate = $A + $B * $sin2l + $C * $sin4l;
         $rotation_deg  = $rotation_rate * 1e-6 * $delta_seconds / deg2rad(1);
      }

      if ( $frame_time == 'synodic' ) {
         $rotation_deg -= 0.9856 * $delta_days;
      }
      
      return $rotation_deg;
   }
   


   function convert_hg_hcc($rsun, $b0, $l0, $hgln, $hglt, $occultation=false) {
   /* Convert Heliographic coordinates (given in degrees) to
      Heliocentric-Cartesian.
   */
      list($x, $y, $z) = convert_hg_hcc_xyz($rsun, $b0, $l0, $hgln, $hglt);
      
      if ( $occultation && $z < 0) {
         $x = NAN;
         $y = NAN;
      }
      
      return Array($x, $y);
   }

   
   
   function convert_hg_hcc_xyz($rsun, $b0, $l0, $hgln, $hglt) {
   /* Convert Heliographic coordinates (given in degrees) to
      Heliocentric-Cartesian.
   */
      # using equations 11 in Thompson (2006), A&A, 449, 791-803
  
      $cx = deg2rad(1);
      $cy = deg2rad(1);

      $lon = $cx * $hgln;
      $lat = $cy * $hglt;
  
      $b0 = deg2rad($b0);
      $l0 = deg2rad($l0);
  
      $cosb = cos($b0);
      $sinb = sin($b0);
  
      $lon = $lon - $l0;
  
      $cosx = cos($lon);
      $sinx = sin($lon);
      $cosy = cos($lat);
      $siny = sin($lat);

      # Perform the conversion.
      $x = $rsun * $cosy * $sinx;
      $y = $rsun * ($siny * $cosb - $cosy * $cosx * $sinb);
      $z = $rsun * ($siny * $sinb + $cosy * $cosx * $cosb);

      return Array($x, $y, $z);
   }



   function rot_hpc($x, $y, $tstart, $tend, $spacecraft=null, $vstart=null, $vend=null) {
   /* Given a location on the Sun referred to using the Helioprojective Cartesian
      co-ordinate system in the units of arcseconds, use the solar rotation
      profile to find that location at some later or earlier time.
   
      Parameters
      -----------
      x: float or numpy ndarray
         helio-projective x-co-ordinate in arcseconds
   
      y: float or numpy ndarray
         helio-projective y-co-ordinate in arcseconds
  
  
      tstart: date/time to which x and y are referred; can be in any acceptable
         time format.
  
      tend: Date/time at which x and y will be rotated to; can be
         in any acceptable time format.
  
      spacecraft: { None | "soho" | "stereo_a" | "stereo_b" }
         calculate the rotation from the point of view of the SOHO,
         STEREO A, or STEREO B spacecraft.
   
   TODO: the ability to do this rotation for data from the SOHO
         point of view and the STEREO A, B point of views.
   
      See Also
      --------
      IDL code equavalent:
         http://hesperia.gsfc.nasa.gov/ssw/gen/idl/solar/rot_xy.pro
   
      Note: rot_xy uses arcmin2hel.pro and hel2arcmin.pro to implement the
      same functionality.  These two functions seem to perform inverse
      operations of each other to a high accuracy.  The corresponding
      equivalent functions here are convert_hpc_hg and convert_hg_hpc
      respectively.  These two functions seem to perform inverse
      operations of each other to a high accuracy.  However, the values
      returned by arcmin2hel.pro are slightly different from those provided
      by convert_hpc_hg.  This leads to slightly different results from
      rot_hpc compared to rot_xy.
   */
  
      # must have pairs of co-ordinates
      if ( count($x) != count($y) || is_scalar($x) !== is_scalar($y) ) {
         throw new Exception('Input co-ordinates must have the same shape.');
      }
      
      # Make sure we have enough time information to perform a solar differential
      # rotation
      # Start time
      $dstart = parse_time($tstart);
      $dend = parse_time($tend);
      
      # Fractional days
      $interval = ($dend->format('U') - $dstart->format('U')) / 60. / 60. / 24.;
        
      # Get the Sun's position from the vantage point at the start time
      if ( $vstart === null ) {
         $vstart = pb0r($dstart, $spacecraft);
      }
      
      # Compute heliographic co-ordinates - returns (longitude, latitude). Points
      # off the limb are returned as NaN
      list($longitude, $latitude) = convert_hpc_hg( RADIUS, 
                                                    AU * sunearth_distance($t=$dstart),
                                                    'arcsec',
                                                    'arcsec', 
                                                    $vstart["b0"],
                                                    $vstart["l0"], 
                                                    $x, 
                                                    $y );
      
      # Compute the differential rotation
      $drot = diff_rot($interval, $latitude, $frame_time='synodic');

      # Convert back to heliocentric cartesian in units of arcseconds
      if ( $vend === null ) {
         $vend = pb0r($dend, $spacecraft);
      }
          
      # It appears that there is a difference in how the SSWIDL function
      # hel2arcmin and the function below performs this co-ordinate
      # transform.
      list($newx, $newy) = convert_hg_hpc( RADIUS, 
                                           AU * sunearth_distance($t=$dend),
                                           $vend["b0"],
                                           $vend["l0"], 
                                           $longitude + $drot, 
                                           $latitude,
                                           $units='arcsec' );
   
      return Array($newx, $newy);
   }
   
   
   function sunearth_distance($t=null) {
      /* Returns the Sun Earth distance. There are a set of higher accuracy 
      terms not included here. */  
      
      $ta = true_anomaly($t);
      $e = eccentricity_SunEarth_orbit($t);
      $result = 1.00000020 * (1.0 - pow($e,2)) / (1.0 + $e * cos(deg2rad($ta)));
      
      return $result;
   }
   
   
   function true_anomaly($t=null) {
      /* Returns the Sun's true anomaly (in degress). */
      
      $result = (mean_anomaly($t) + equation_of_center($t)) % 360.0;
      
      return $result;
   }
   
    
   function eccentricity_SunEarth_orbit($t=null) {
      /* Returns the eccentricity of the Sun Earth Orbit. */
    
      $T = julian_centuries($t);
      $result = 0.016751040 - 0.00004180 * $T - 0.0000001260 * pow($T,2);
    
      return $result;
   }
   
   
   function mean_anomaly($t=null) {
      /* Returns the mean anomaly (the angle through which the Sun has moved
      assuming a circular orbit) as a function of time. */
      
      $T = julian_centuries($t);
      $result = 358.475830 + 35999.049750 * $T - 0.0001500 * pow($T,2) - 0.00000330 * pow($T,3);
      $result = $result % 360.0;
      
      return $result;
   }
   
   
   function equation_of_center($t=null) {
      /* Returns the Sun's equation of center (in degrees) */
      
      $T = julian_centuries($t);
      $mna = mean_anomaly($t); 
      $result = ((1.9194600 - 0.0047890 * $T - 0.0000140 * pow($T,2)) 
              * sin(deg2rad($mna) + (0.0200940 - 0.0001000 * $T) 
              * sin(deg2rad(2 * $mna)) + 0.0002930 * sin(deg2rad(3 * $mna))));
              
      return $result;
   }
   
    
   function julian_centuries($t=null) {
      /* Returns the number of Julian centuries since 1900 January 0.5. */
    
      $DAYS_IN_YEAR = 36525.0;

      return (julian_day($t) - JULIAN_DAY_ON_NOON01JAN1900) / $DAYS_IN_YEAR;
   }
?>
