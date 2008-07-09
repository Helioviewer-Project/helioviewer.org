-- HelioViewer Database Structure --
-- last update: 06-25-2008        --

--
-- Create schema esahelio_svdb0
--
CREATE DATABASE IF NOT EXISTS esahelio_svdb0;
USE esahelio_svdb0;

--
-- Create tables
--

--
-- Table structure for table `image`
--
CREATE TABLE  `esahelio_svdb0`.`image` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementId` int(10) unsigned NOT NULL default '0',
  `timestamp` datetime NOT NULL default '0000-00-00 00:00:00',
  `filetype` varchar(4) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9198 DEFAULT CHARSET=utf8;

--
-- Table structure for table `tile`
--
DROP TABLE IF EXISTS `tile`;
CREATE TABLE IF NOT EXISTS `tile` (
  `imageId` int(11) NOT NULL default '0',
  `x` int(11) NOT NULL default '0',
  `y` int(11) NOT NULL default '0',
  `zoom` int(11) NOT NULL default '0',
  `url` varchar(255) default NULL,
  `tile` blob,
  PRIMARY KEY  (`imageId`,`x`,`y`,`zoom`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE `detector` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  `instrumentId` int(10) unsigned NOT NULL default '0',
  `imgSunRatio` float(6,3) default NULL,
  `lowestRegularZoomLevel` tinyint(4) default NULL,
  `opacityGroupId` int(10) unsigned NOT NULL default '1',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=15 ;

--
-- Dumping data for table `detector`
--

INSERT INTO `detector` VALUES(11, 'MDI', 'MDI', 8, NULL, NULL, 1);
INSERT INTO `detector` VALUES(12, '0C3', '0C3', 9, NULL, NULL, 3);
INSERT INTO `detector` VALUES(13, '0C2', '0C2', 9, NULL, NULL, 2);
INSERT INTO `detector` VALUES(14, 'EIT', 'EIT', 10, NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `instrument`
--

CREATE TABLE `instrument` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  `observatoryId` int(10) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=11 ;

--
-- Dumping data for table `instrument`
--

INSERT INTO `instrument` VALUES(8, 'MDI', 'MDI', 3);
INSERT INTO `instrument` VALUES(9, 'LAS', 'LAS', 3);
INSERT INTO `instrument` VALUES(10, 'EIT', 'EIT', 3);

-- --------------------------------------------------------

--
-- Table structure for table `measurement`
--

CREATE TABLE `measurement` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementTypeId` int(10) unsigned NOT NULL default '0',
  `detectorId` int(10) unsigned NOT NULL default '0',
  `name` varchar(255) default NULL,
  `abbreviation` varchar(4) NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=25 ;

--
-- Dumping data for table `measurement`
--

INSERT INTO `measurement` VALUES(17, 0, 11, 'mag', 'mag');
INSERT INTO `measurement` VALUES(18, 0, 11, 'int', 'int');
INSERT INTO `measurement` VALUES(19, 0, 12, '0WL', '0WL');
INSERT INTO `measurement` VALUES(20, 0, 13, '0WL', '0WL');
INSERT INTO `measurement` VALUES(21, 1, 14, '195', '195');
INSERT INTO `measurement` VALUES(22, 1, 14, '171', '171');
INSERT INTO `measurement` VALUES(23, 1, 14, '304', '304');
INSERT INTO `measurement` VALUES(24, 1, 14, '284', '284');

-- --------------------------------------------------------

--
-- Table structure for table `measurementType`
--

CREATE TABLE `measurementType` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) NOT NULL default '',
  `unit` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `measurementType`
--

INSERT INTO `measurementType` VALUES(0, 'measurement', NULL);
INSERT INTO `measurementType` VALUES(1, 'wavelength', 'nm');

-- --------------------------------------------------------

--
-- Table structure for table `observatory`
--

CREATE TABLE `observatory` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `observatory`
--

INSERT INTO `observatory` VALUES(3, 'soho', 'soho');

-- --------------------------------------------------------

--
-- Table structure for table `opacityGroup`
--

CREATE TABLE `opacityGroup` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `opacityGroup`
--

INSERT INTO `opacityGroup` VALUES(1, 'Full Disc Image');
INSERT INTO `opacityGroup` VALUES(2, 'Coronagraph Image, in the range of LASCO C2');
INSERT INTO `opacityGroup` VALUES(3, 'Coronagraph Image, in the range of LASCO C3');
