-- Helioviewer Database Structure --
-- last update: 04-28-2009        --

--
-- Create schema & user
--
CREATE DATABASE IF NOT EXISTS hv;
GRANT ALL ON hv.* TO 'helioviewer'@'localhost' IDENTIFIED BY 'helioviewer';
USE hv;

--
-- Create tables
--

-- --------------------------------------------------------
--
-- Table structure for table `observatory`
-- (id, abbreviation, name, description)
--
-- --------------------------------------------------------
CREATE TABLE `observatory` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(3) NOT NULL default '',
  `name` varchar(255) default NULL,
  `description` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

INSERT INTO `observatory` VALUES(1, 'SOH', 'SOHO', 'Solar and Heliospheric Observatory');
INSERT INTO `observatory` VALUES(2, 'TRA', 'TRACE', 'The Transition Region and Coronal Explorer');


-- --------------------------------------------------------
--
-- Table structure for table `instrument`
-- (id, abbreviation, name, description, observatoryId)
--
-- --------------------------------------------------------

CREATE TABLE `instrument` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(3) NOT NULL default '',
  `name` varchar(255) default NULL,
  `description` varchar(255) default NULL,
  `observatoryId` int(10) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

INSERT INTO `instrument` VALUES(1, 'EIT', 'EIT', 'Extreme ultraviolet Imaging Telescope', 1);
INSERT INTO `instrument` VALUES(2, 'LAS', 'LASCO', 'The Large Angle Spectrometric Coronagraph', 1);
INSERT INTO `instrument` VALUES(3, 'MDI', 'MDI', 'Michelson Doppler Imager', 1);
INSERT INTO `instrument` VALUES(4, 'TRA', 'TRACE', 'TRACE', 2);

-- --------------------------------------------------------
--
-- Table structure for table `detector`
-- (id, abbreviation, name, description, instrumentId, minZoom, opacityGroupId)
--
-- --------------------------------------------------------
CREATE TABLE `detector` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(3) NOT NULL default '',
  `name` varchar(255) default NULL,
  `description` varchar(255) default NULL,
  `instrumentId` int(10) unsigned NOT NULL default '0',
  `minZoom` tinyint(4) default NULL,
  `opacityGroupId` int(10) unsigned NOT NULL default '1',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

INSERT INTO `detector` VALUES(1, '0C2', 'C2', 'LASCO C2', 2, 12, 2);
INSERT INTO `detector` VALUES(2, '0C3', 'C3', 'LASCO C3', 2, 14, 3);
INSERT INTO `detector` VALUES(3, 'EIT', '', 'EIT', 1, 10, 1);
INSERT INTO `detector` VALUES(4, 'MDI', '', 'MDI', 3, 9, 1);
INSERT INTO `detector` VALUES(5, 'TRA', '', 'TRACE', 4, 9, 1);

-- --------------------------------------------------------
--
-- Table structure for table `measurement`
-- (id, measurementTypeId, detectorId, abbreviation, name, description)
--
-- --------------------------------------------------------
CREATE TABLE `measurement` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementTypeId` int(10) unsigned NOT NULL default '0',
  `detectorId` int(10) unsigned NOT NULL default '0',
  `abbreviation` varchar(3) NOT NULL default '',
  `name` varchar(255) default NULL,
  `description` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

INSERT INTO `measurement` VALUES(1, 2, 3, '171', '171', '171 Angstrom extreme ultraviolet');
INSERT INTO `measurement` VALUES(2, 2, 3, '195', '195', '195 Angstrom extreme ultraviolet');
INSERT INTO `measurement` VALUES(3, 2, 3, '284', '284', '284 Angstrom extreme ultraviolet');
INSERT INTO `measurement` VALUES(4, 2, 3, '304', '304', '304 Angstrom extreme ultraviolet');
INSERT INTO `measurement` VALUES(5, 2, 5, '171', '171', '171 Angstrom extreme ultraviolet');
INSERT INTO `measurement` VALUES(6, 1, 4, 'int', 'int', 'Intensitygram');
INSERT INTO `measurement` VALUES(7, 1, 4, 'mag', 'mag', 'Magnetogram');
INSERT INTO `measurement` VALUES(8, 1, 2, '0WL', 'WL', 'White Light');
INSERT INTO `measurement` VALUES(9, 1, 1, '0WL', 'WL', 'White Light');


-- --------------------------------------------------------
--
-- Table structure for table `measurementType`
-- (id, name, unit)
--
-- --------------------------------------------------------

CREATE TABLE `measurementType` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) NOT NULL default '',
  `unit` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

INSERT INTO `measurementType` VALUES(1, 'other', NULL);
INSERT INTO `measurementType` VALUES(2, 'wavelength', 'nm');

-- --------------------------------------------------------
--
-- Table structure for table `opacityGroup`
-- (id, description)
--
-- --------------------------------------------------------
CREATE TABLE `opacityGroup` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;


INSERT INTO `opacityGroup` VALUES(1, 'Full Disc Image');
INSERT INTO `opacityGroup` VALUES(2, 'Coronagraph Image, in the range of LASCO C2');
INSERT INTO `opacityGroup` VALUES(3, 'Coronagraph Image, in the range of LASCO C3');
INSERT INTO `opacityGroup` VALUES(4, 'Sub-field');

-- --------------------------------------------------------
--
-- Table structure for table `image`
-- (id, measurementId, timestamp, centering, centerX, centerY, lengthX, lengthY, imgScaleX, imgScaleY, solarRadius, 
--  width, height, opacityGrp, uri)
--
-- --------------------------------------------------------
CREATE TABLE  `image` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementId` int(10) unsigned NOT NULL default '0',
  `timestamp` datetime NOT NULL default '0000-00-00 00:00:00',
  `centering`    bool NOT NULL,
  `centerX`      float(6) NOT NULL,
  `centerY`      float(6) NOT NULL,
  `lengthX`      float(6) NOT NULL,
  `lengthY`      float(6) NOT NULL,  
  `imgScaleX`    float(6) NOT NULL,
  `imgScaleY`    float(6) NOT NULL,
  `solarRadius`  float(6) NOT NULL,
  `width`        int(10) NOT NULL,
  `height`       int(10) NOT NULL,
  `opacityGrp`   tinyint NOT NULL,
  `uri`          varchar(255) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;
