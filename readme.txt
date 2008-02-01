SunViewer Version 0.1
7/25/07
NASA Goddard Space Flight Center, Greenbelt, MD

Written By
Patrick Schmiedel <patrick.schmiedel@gmx.net>
University of Karlsruhe, Germany

This software uses part of the code of the
Giant Scalable Image Viewer (GSIV) 1.0

Written by
Michal Migurski <mike-gsv@teczno.com>
Dan Allen <dan.allen@mojavelinux.com>

Extended by
Shane Maloney <shane.maloney98@gmail.com>


I. INTRODUCTION

This software has been developed during an internship at the Solar 
Heliospheric Observatory (SOHO) at NASA GSFC from May 13 to July 27, 2007. 

It is based on the Giant Scalable Image Viewer (GSIV), but the code has been
almost completely rewritten to allow for more modularity and extensibility.

It has been tested on Mozilla Firefox and Safari on a Mac.


II. FEATURES

- Using existing technologies, no need to install further software.
- Asynchronously loading content, improves user interface responsiveness.
- Tiled images: Only loading the currently visible part of the complete image,
  thus reducing transferred data.
- Allows easy browsing of large datasets.
- Physical length-scales of several magnitudes can be displayed.


III. FUNCTIONALITY

- Viewing images of the sun in a browser
- Zooming in
- Panning in the viewport
- Selecting the shown image
- Overlaying multiple images
- Showing NOAA Active Regions and info if clicked
- A resizable and movable size indicator bar


IV. FUTURE WORK

- Develop a method to tile the images so that the sun always occupies the same
  percentage of the complete image.
- Also retrieve meta data from the FITS files
- Store the meta data and the image location in a database
- Specify an interface for retrieving data from the database
  (e.g. client --Ajax(JSON/XML)-> server(PHP script) --SQL-> database)
- Test and debug on different browsers (IE 5.x/6/7, Opera, Konqueror...)
- Performance tuning:
  Change the tile algorithm, move the tile container (or the tile container 
  container) instead of the tiles. Also allows for various different tile
  sizes (over-zooming...). (See Google Maps in the Firefox DOM inspector)
- The application is really fast in Safari when started up but gets awfully
  slow after a long time browsing. Restarting Safari solves the problem. Check
  if there is a fix for that.
- Measure the position of the viewer in world coordinates, not pixels =>
  Easier zooming
- Add/remove/configure Marker/Overlay layers in the Layer Manager. Make it
  possible to link them to Tile layers (use the date of their image).
- Avoid "jumping" effect when zooming in Firefox (possibly solved by changes
  above)
- Join and compress the JavaScript and CSS files for use on a web server (can
  be done in Aptana)
- Generate HTML Documentation from ScriptDoc in JavaScript files. Wait for
  future Aptana versions to implement this.
- Enable to show a grid overlay. Take angle towards the sun depending on time
  of year into account. Maybe create one grid for each month or so.
- Limit the amount the user can move the viewport.


V. REQUIREMENTS

- Python (tested with 2.4)
- Python MySQLdb
- PHP 5
- MySQL
- Any webserver configured to use PHP


VI. INSTALLATION

- In order for the AJAX and PHP to work a web server is required.
- Configure /lib/HV_Database/database_functions.php for use with your database.
- Configure dirwalk.py to tell it where the data you will be indexing is and set the database info. (a test dataset is not included)
- Create the database (whatever you set it to in database_functions.php and dirwalk.py) in MySQL. No need to create any tables.
- Index the data by running dirwalk.py
- And you're good to go. Just open up index.html via your web browser (http://localhost/...wherever...)

