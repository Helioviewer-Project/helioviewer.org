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
CREATE TABLE  `esahelio_svdb0`.`detector` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  `instrumentId` int(10) unsigned NOT NULL default '0',
  `imgSunRatio` float(6,3) default NULL,
  `lowestRegularZoomLevel` tinyint(4) default NULL,
  `opacityGroupId` int(10) unsigned NOT NULL default '1',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8;

CREATE TABLE  `esahelio_svdb0`.`image` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementId` int(10) unsigned NOT NULL default '0',
  `timestamp` datetime NOT NULL default '0000-00-00 00:00:00',
  `filetype` varchar(4) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9198 DEFAULT CHARSET=utf8;

CREATE TABLE  `esahelio_svdb0`.`instrument` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  `observatoryId` int(10) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

CREATE TABLE  `esahelio_svdb0`.`measurement` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementTypeId` int(10) unsigned NOT NULL default '0',
  `detectorId` int(10) unsigned NOT NULL default '0',
  `name` varchar(255) default NULL,
  `abbreviation` varchar(4) NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;

CREATE TABLE  `esahelio_svdb0`.`measurementType` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) NOT NULL default '',
  `unit` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=87 DEFAULT CHARSET=utf8;

CREATE TABLE  `esahelio_svdb0`.`observatory` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

CREATE TABLE  `esahelio_svdb0`.`opacityGroup` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

CREATE TABLE  `esahelio_svdb0`.`tile` (
  `imageId` int(11) NOT NULL default '0',
  `x` int(11) NOT NULL default '0',
  `y` int(11) NOT NULL default '0',
  `zoom` int(11) NOT NULL default '0',
  `url` varchar(255) default NULL,
  `tile` blob,
  PRIMARY KEY  (`imageId`,`x`,`y`,`zoom`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- data for table `opacityGroup`
--

INSERT INTO `esahelio_svdb0`.`opacityGroup` VALUES(1, 'Full Disc Image');
INSERT INTO `esahelio_svdb0`.`opacityGroup` VALUES(2, 'Coronagraph Image, in the range of LASCO C2');
INSERT INTO `esahelio_svdb0`.`opacityGroup` VALUES(3, 'Coronagraph Image, in the range of LASCO C3');

--
-- Dumping data for table `detector`
--

INSERT INTO `esahelio_svdb0`.`detector` VALUES
(11, 'MDI', 'MDI', 8, NULL, NULL, 1),
(12, '0C3', '0C3', 9, NULL, NULL, 3),
(13, '0C2', '0C2', 9, NULL, NULL, 2),
(14, 'EIT', 'EIT', 10, NULL, NULL, 1);

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

