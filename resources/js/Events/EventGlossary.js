const eventGlossary = {
  active: {
    hv_label: null,
    hv_desc: null,
    hv_type: "boolean",
    hek_type: "string",
    hek_desc: null
  },
  concept: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: null
  },
  eventtype: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: null
  },
  event_probability: {
    hv_label: "Probability Event Occured",
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Probability or Confidence Level that event occured (bet. 0 and 1)"
  },
  event_type: {
    hv_label: "Type of Event",
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Event Type (e.g. 'FL: Flare' or 'AR: ActiveRegion')"
  },
  kb_archivdate: {
    hv_label: null,
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Date when VOEvent entry was imported into Knowledge Base"
  },
  kb_archivid: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unique internal ID of VOEvent entry"
  },
  kb_archivist: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Name of Archivist (internal. user should leave blank)"
  },
  kb_archivurl: {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: "URL of VOEvent entry (internal. user should leave blank)"
  },
  event_coordsys: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc:
      "Coordinate system type (Choose between UTC-HGS-TOPO [Heliographics Stonyhurst]; UTC-HPR-TOPO [Helioprojective]; UTC-HGC-TOPO[Heliographic Carrington]; UTC-HCR-TOPO[Helio-centric radial])"
  },
  event_coordunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of coordinates (e.g. 'deg, deg' for UTC-HGS-TOP0)"
  },
  event_endtime: {
    hv_label: "Event End Time",
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Time when event ends (e.g. 2004-02-14T02:00:01)"
  },
  event_starttime: {
    hv_label: "Event Start Time",
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Time when event starts (e.g. 2004-02-14T02:00:01)"
  },
  event_expires: {
    hv_label: null,
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Useful for reporting events before they are complete (e.g. 2004-02-14T02:00:01)"
  },
  event_coord1: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Coordinate 1 of mean location of event"
  },
  event_coord2: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Coordinate 2 of mean location of event"
  },
  event_coord3: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Coordinate 3 of mean location of event (optional. Suitable for use with STEREO SECCHI events)"
  },
  event_mapurl: {
    hv_label: "Image/Intensity Map",
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: "URL to an image/intensity map"
  },
  event_maskurl: {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: "URL to files which contain masks (e.g. binary masks) of region of interest."
  },
  event_peaktime: {
    hv_label: "Event Peak Time",
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Peak time of a flare (e.g. '2003-02-12T23:03:01')"
  },
  event_c1error: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty in Coord1 of the mean location of the event."
  },
  event_c2error: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty in Coord2 of the mean location of the event."
  },
  event_clippedspatial: {
    hv_label: null,
    hv_desc: null,
    hv_type: "boolean",
    hek_type: "string",
    hek_desc: "Whether the spatial extent of the event is wholly contained within the data set ('T' or 'F')."
  },
  event_clippedtemporal: {
    hv_label: null,
    hv_desc: null,
    hv_type: "boolean",
    hek_type: "string",
    hek_desc: "Whether the temporal duration of the event is wholly contained within the data set ('T' or 'F')."
  },
  event_testflag: {
    hv_label: null,
    hv_desc: null,
    hv_type: "boolean",
    hek_type: "string",
    hek_desc: "A boolean flag to indicate that the event is for testing purposes ('T' or 'F')"
  },
  frm_contact: {
    hv_label: null,
    hv_desc: null,
    hv_type: "email_or_url",
    hek_type: "string",
    hek_desc: "Contact information of Feature Recognition Method (FRM)"
  },
  frm_daterun: {
    hv_label: null,
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Date when Feature Recognition Method (FRM) was run (e.g. 2004-02-15T02:00:01)"
  },
  frm_humanflag: {
    hv_label: null,
    hv_desc: null,
    hv_type: "boolean",
    hek_type: "string",
    hek_desc: "Whether a Human identified the event ('T' or 'F')"
  },
  frm_identifier: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Username for Knowledge Base"
  },
  frm_institute: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Institute where the Feature Recognition Method (FRM) orginates"
  },
  frm_name: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Name of Feature Recognition Method (e.g. 'Mark Cheung' or CACTUS')"
  },
  frm_paramset: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Values of parameters (e.g. 'threshold=0.1')"
  },
  frm_versionnumber: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc:
      "Version number of automated Feature Recognition Method (Put age if Human. Just kidding. In this case put 1.0)"
  },
  frm_url: {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: "URL to webpage containing information about the Feature Recognition Method"
  },
  frm_specificid: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "The specific ID of this event/feature assigned by the Feature Recognition Method"
  },
  obs_observatory: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Name of Observatory (e.g. SOHO)"
  },
  obs_channelid: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Name of Channel of the instrument (e.g. 'G band')"
  },
  obs_instrument: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Name of Instrument (e.g. 'SOT')"
  },
  obs_meanwavel: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Mean wavelength (preferably in Angstroms)"
  },
  obs_wavelunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit of OBS_MeanWavel (preferably 'Angstroms')"
  },
  obs_title: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Observational title"
  },
  bound_ccnsteps: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "long",
    hek_desc: "Number of steps in bounding chain code (useful for coronal hole boundaries)"
  },
  bound_ccstartc1: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Beginning Coord1 of chain code"
  },
  bound_ccstartc2: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Beginning Coord2 of chain code"
  },
  bound_chaincode: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "List of vertices for polygon (ordered list delimited by commas. e.g. 'x1, y1, x2, y2, x3, y3, x1, y1')"
  },
  boundbox_c1ll: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Coord1 of lower-left corner of bounding box"
  },
  boundbox_c2ll: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Coord2 of lower-left corner of bounding box"
  },
  boundbox_c1ur: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Coord1 of upper-right corner of bounding box"
  },
  boundbox_c2ur: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Coord2 of upper-right corner of bounding box"
  },
  chaincodetype: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Type of chain code (Use 'ordered list')"
  },
  rasterscan: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Field for ascii string of raster scan"
  },
  rasterscantype: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc:
      "Type of raster scan (E.g. 'EGSO_SFC' if you are using the EGSO Solar Feature Catalogue convection for the raster scan)"
  },
  skel_chaincode: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc:
      "Skeleton code. A skeleton code is like a chain code except it isn't closed. (ordered list delimited by commas. e.g. 'x1, y1, x2, y2, x3, y3')"
  },
  skel_curvature: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Curvature of skeleton"
  },
  skel_nsteps: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Number of steps in skeleton"
  },
  skel_startc1: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Beginning Coord 1 of skeleton"
  },
  skel_startc2: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Beginning Coord 2 of skeleton"
  },
  ar_mcintoshcls: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Active Region McIntosh class"
  },
  ar_mtwilsoncls: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Active Region Mt Wilson class"
  },
  ar_zurichcls: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Active Region Zurich class"
  },
  ar_penumbracls: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Active Region Penumbra class"
  },
  ar_compactnesscls: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Active Region Compactness class"
  },
  ar_noaaclass: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Active Regon NOAA class"
  },
  ar_noaanum: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "long",
    hek_desc: "NOAA designated Active Region Number (e.g. 10930)"
  },
  ar_numspots: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Number of spots in Active region"
  },
  ar_polarity: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Polarity of Active region ('1' or '-1' for positive and negative respectively)"
  },
  ar_spotarearaw: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Area of spots in active region in plane of sky"
  },
  ar_spotarearawuncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of AR_SpotAreaRaw"
  },
  ar_spotarearawunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of AR_SpotAreaRaw"
  },
  ar_spotarearepr: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Reprojected area of spots in heliographic units"
  },
  ar_spotarearepruncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty Reprojected area of spots in heliographic units"
  },
  ar_spotareareprunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of AR_SpotAreaReprUnit (e.g. 'millihemispheres' or 'steradians')"
  },
  ar_intensmin: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Minimum intensity of AR pixels"
  },
  ar_intensmax: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum intensity of AR pixels"
  },
  ar_intensmean: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Mean intensity of AR pixels"
  },
  ar_intensvar: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Variance of intensity of AR pixels"
  },
  ar_intensskew: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Skewness of intensity of AR pixels"
  },
  ar_intenskurt: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Kurtosis of intensity of AR pixels"
  },
  ar_intenstotal: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Sum of intensities of AR pixels"
  },
  ar_intensunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units used for AR_Intens... attributes"
  },
  fl_goescls: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "GOES Flare class (e.g. 'X11')"
  },
  cme_radiallinvel: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Radial Linear fit radial velocity of CME"
  },
  cme_radiallinveluncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty in CME_RadialLinVel"
  },
  cme_radiallinvelmin: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Mininum linear radial velocity of CME"
  },
  cme_radiallinvelmax: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum linear radial velocity of CME"
  },
  cme_radiallinvelstddev: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Standard Deviation of radial velocity of CME"
  },
  cme_radiallinvelunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for Radial velocity of CME (e.g. 'km/s')"
  },
  cme_angularwidth: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Angular width of CME"
  },
  cme_angularwidthunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for angular width of CME (e.g. 'deg')"
  },
  cme_accel: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Acceleration of CME"
  },
  cme_acceluncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of CME acceleration"
  },
  cme_accelunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for CME acceleration (e.g. 'km/s/s')"
  },
  cme_mass: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Mass contained in CME (e.g. '1e17')"
  },
  cme_massuncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty in mass contained in cme"
  },
  cme_massunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for CME mass (e.g. 'g')"
  },
  area_atdiskcenter: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Area of event at disk center"
  },
  area_atdiskcenteruncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of area at disk center"
  },
  area_raw: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Area of event in sky plane"
  },
  area_uncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of area in sky plane"
  },
  area_unit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of area in sky plane (e.g. 'arcsec2')"
  },
  event_npixels: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "long",
    hek_desc: "Number of pixels pertaining to event"
  },
  event_pixelunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of values given in pixels"
  },
  freqmaxrange: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum of the frequency range of oscillation"
  },
  freqminrange: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Minimum of the frequency range of oscillation"
  },
  freqpeakpower: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Frequency at which power spectrum peaks"
  },
  frequnit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of frequency (e.g. 'Hz')"
  },
  intensmaxampl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum amplitude of oscillation in intensity signal"
  },
  intensminampl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Minimum amplitude of oscillation in intensity signal"
  },
  intensunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of intensity"
  },
  oscillnperiods: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Number of periods detected in oscillation"
  },
  oscillnperiodsuncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of number of periods detected in oscillation"
  },
  peakpower: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Peak power of oscillation"
  },
  peakpowerunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units of peak power of oscillation"
  },
  velocmaxampl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum amplitude of oscillation in velocity signal (e.g. doppler signal)"
  },
  velocmaxpower: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum power of oscillation in velocity signal"
  },
  velocmaxpoweruncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty in max power in velocity signal"
  },
  velocminampl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Minimum amplitude in oscillating velocity signal"
  },
  velocunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for velocity (e.g. 'km/s')"
  },
  wavedisplmaxampl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum amplitude of oscillation in displacement signal"
  },
  wavedisplminampl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Minimum amplitude of oscillatoin in displacement signal"
  },
  wavedisplunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for displacement amplitude (e.g. 'arcsec')"
  },
  wavelmaxpower: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Wavelength at which spatial power spectrum peaks"
  },
  wavelmaxpoweruncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of WavelMaxPower"
  },
  wavelmaxrange: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum wavelength of wavelength range for spatial oscillation"
  },
  wavelminrange: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Minimum wavelength of wavelength range for spatial oscillation"
  },
  wavelunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for spatial oscillation wavelength (e.g. 'km')"
  },
  ef_pospeakfluxonsetrate: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Emergence rate of positive polarity flux"
  },
  ef_negpeakfluxonsetrate: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Emergence rate of negative polarity flux"
  },
  ef_onsetrateunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Emergence rate unit (e.g. 'Mx/s')"
  },
  ef_sumpossignedflux: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Total positive signed flux at completion"
  },
  ef_sumnegsignedflux: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Total negative signed flux at completion"
  },
  ef_fluxunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Flux unit (e.g. 'Mx')"
  },
  ef_axisorientation: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Axis orientation of emerging flux pair (CCW from parallels in Stonyhurst longitude"
  },
  ef_axisorientationunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Axis oriention unit (deg)"
  },
  ef_axislength: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Axis length of emerging flux pair at completion"
  },
  ef_posequivradius: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Equivalent radius (i.e. sqrt(area/pi) of positive polarity at completion"
  },
  ef_negequivradius: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Equivalent radius (i.e. sqrt(area/pi) of negative polarity at completion"
  },
  ef_lengthunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for EF_AxisLength"
  },
  ef_aspectratio: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "(EF_PosEquivRadius+EF_NegEquivRadius)/(2*EF_AxisLength)"
  },
  ef_proximityratio: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "(EF_PosEquivRadius-EF_NegEquivRadius)/(2*EF_AxisLength)"
  },
  maxmagfieldstrength: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum magnetic field strength"
  },
  maxmagfieldstrengthunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for maximum magnetic field strength (e.g. 'G' or 'Mx/cm2')"
  },
  outflow_length: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Length of outflow (can be for CoronalJet or SpraySurge)"
  },
  outflow_lengthunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for length of outflow (e.g. 'arcsec')"
  },
  outflow_width: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Width of outflow"
  },
  outflow_widthunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for width of outflow (e.g. 'arcsec')"
  },
  outflow_speed: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Outflow speed of outflow"
  },
  outflow_transspeed: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Transverse speed relative to outflow direction"
  },
  outflow_speedunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for speed (e.g. 'km/s')"
  },
  outflow_openingangle: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Opening angle of outflow (in degrees)"
  },
  obs_dataprepurl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "URL pointing to information about how data was reduced"
  },
  fl_peakflux: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Flux at peak time"
  },
  fl_peakfluxunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Peak flux unit (e.g. erg/cm^2/s)"
  },
  fl_peaktemp: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Temperature at peak time"
  },
  fl_peaktempunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit for FL_PeakTemp (K)"
  },
  fl_peakem: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Emission measure at peak time"
  },
  fl_peakemunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit for FL_PeakEM"
  },
  fl_efoldtime: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Flare e-folding time"
  },
  fl_efoldtimeunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit for FL_EFoldTime (s)"
  },
  fl_fluence: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Fluence of flare"
  },
  fl_fluenceunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit for FL_Fluence (e.g. erg/cm^2)"
  },
  cd_area: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Maximum area of dimming"
  },
  cd_areauncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of CD_Area"
  },
  cd_areaunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit for CD_Area ('millihemisphere' or 'steradians')'"
  },
  cd_volume: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Volume of dimming region"
  },
  cd_volumeuncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty of CD_Volume"
  },
  cd_volumeunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Units for CD_Volume (e.g. 'cm^3')"
  },
  cd_mass: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Mass estimate calculated for dimming event"
  },
  cd_massuncert: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Uncertainty for CD_Mass"
  },
  cd_massunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit for CD_Mass"
  },
  fi_length: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Length of Filament spine"
  },
  fi_lengthunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit for FI_Length"
  },
  fi_tilt: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Mean tilt angle (in degrees) of the Filament spine (given as Skel_ChainCode) w.r. to solar equator"
  },
  fi_barbstot: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Total number of filament barbs"
  },
  fi_barbsr: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Total number of Right Bearing Barbs"
  },
  fi_barbsl: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Total number of Left Bearing Barbs"
  },
  fi_chirality: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Chirality for filament (-1 for sinistral; +1 for dextral; 0 for ambiguous/uncertain)"
  },
  fi_barbsstartc1: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc:
      "List of Coord 1 of beginnings (closest to spine) of barbs (list delimited by commas for each numbered barb. e.g. 'x1, x2, x3')"
  },
  fi_barbsstartc2: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc:
      "List of Coord 2 of beginnings (closest to spine) of barbs (list delimited by commas for each numbered barb. e.g. 'y1, y2, y3')"
  },
  fi_barbsendc1: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "List of Coord 1 of ends of barbs (list delimited by commas for each numbered barb. e.g. 'x1, x2, x3')"
  },
  fi_barbsendc2: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "List of Coord 2 of ends of barbs (list delimited by commas for each numbered barb. e.g. 'y1, y2, y3')"
  },
  sg_shape: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Shape of sigmoid"
  },
  sg_chirality: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "integer",
    hek_desc: "Chirality of sigmoid (-1 for sinistral; +1 for dextral; 0 for ambiguous/uncertain)"
  },
  sg_orientation: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Angular rotation (ccw in degrees) of the main axis of the sigmoid to the active region"
  },
  sg_aspectratio: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "TBD"
  },
  sg_peakcontrast: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "TBD"
  },
  sg_meancontrast: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "TBD"
  },
  obs_firstprocessingdate: {
    hv_label: null,
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Earliest date of all images considered part of the event"
  },
  obs_lastprocessingdate: {
    hv_label: null,
    hv_desc: null,
    hv_type: "date",
    hek_type: "string",
    hek_desc: "Latest date of all images considered part of the event"
  },
  obs_levelnum: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Level of Data (e.g. 1.5) = LVL_NUM"
  },
  obs_includesnrt: {
    hv_label: null,
    hv_desc: null,
    hv_type: "boolean",
    hek_type: "string",
    hek_desc: "'T' if any image in the event has the NRT flag (bit 30 in QUALITY), 'F' otherwise"
  },
  ss_spinrate: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Spin/Rotation rate of sunspots"
  },
  ss_spinrateunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit Spin/Rotation rate of sunspots (e.g. Deg/day)"
  },
  cc_majoraxis: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Length of major axis of elliptical fit to cavity"
  },
  cc_minoraxis: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Length of minor axis of elliptical fit to cavity"
  },
  cc_axisunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit of measure for major and minor axes. Typically Rsun"
  },
  cc_tiltanglemajorfromradial: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "float",
    hek_desc: "Angle between major axis and local disk-projected radial vector, measured clockwise from radial vector."
  },
  cc_tiltangleunit: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Unit of measure for CC_TiltAngleMaorFromRadial. Typicall deg."
  },
  to_shape: {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: "Apparent shape of topological object. Example values can be X-point, cusp, dome, line."
  },
  FRM_URL: {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  OBS_DATAPREPURL: {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "SSW Context Image": {
    hv_label: null,
    hv_desc: null,
    hv_type: "image_url",
    hek_type: "string",
    hek_desc: null
  },
  "SSW Context Thumbnail": {
    hv_label: null,
    hv_desc: null,
    hv_type: "thumbnail_url",
    hek_type: "string",
    hek_desc: null
  },
  "NASA Solar Monitor": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "Module Image": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "SDO Movie": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "SSW Movie Menu": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  Publication: {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  Movie: {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "ER: HER Entry": {
    hv_label: null,
    hv_desc: null,
    hv_type: null,
    hek_type: "string",
    hek_desc: null
  },
  "Details of event": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "Event velocity scatterplot": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "Event movie": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  },
  "JSOC Link": {
    hv_label: null,
    hv_desc: null,
    hv_type: "url",
    hek_type: "string",
    hek_desc: null
  }
};

export default eventGlossary;
