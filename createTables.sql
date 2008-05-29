CREATE TABLE  `detector` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  `instrumentId` int(10) unsigned NOT NULL default '0',
  `imgSunRatio` float(6,3) default NULL,
  `lowestRegularZoomLevel` tinyint(4) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;

CREATE TABLE  `image` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementId` int(10) unsigned NOT NULL default '0',
  `timestamp` datetime NOT NULL default '0000-00-00 00:00:00',
  `filetype` varchar(4) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6100 DEFAULT CHARSET=utf8;

CREATE TABLE  `instrument` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  `observatoryId` int(10) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

CREATE TABLE  `measurement` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementTypeId` int(10) unsigned NOT NULL default '0',
  `detectorId` int(10) unsigned NOT NULL default '0',
  `name` varchar(255) default NULL,
  `abbreviation` varchar(4) NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;

CREATE TABLE  `measurementType` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(255) NOT NULL default '',
  `unit` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

CREATE TABLE  `observatory` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `abbreviation` varchar(4) NOT NULL default '',
  `name` varchar(255) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

CREATE TABLE  `tile` (
  `imageId` int(11) NOT NULL default '0',
  `x` int(11) NOT NULL default '0',
  `y` int(11) NOT NULL default '0',
  `zoom` int(11) NOT NULL default '0',
  `url` varchar(255) default NULL,
  `tile` blob,
  PRIMARY KEY  (`imageId`,`x`,`y`,`zoom`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8