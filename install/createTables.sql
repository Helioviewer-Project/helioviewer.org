-- Helioviewer Database Structure --
-- last update: 2009/08/18        --

--
-- Create schema & user
--
CREATE DATABASE IF NOT EXISTS helioviewer;
GRANT ALL ON helioviewer.* TO 'helioviewer'@'localhost' IDENTIFIED BY 'helioviewer';
USE helioviewer;

--
-- Create tables
--

-- --------------------------------------------------------
--
-- image
-- (id, uri, timestamp, sourceId, corrupt)
--
-- --------------------------------------------------------
CREATE TABLE `image` (
    `id`          INT unsigned NOT NULL auto_increment,
    `uri`         VARCHAR(255) NOT NULL,
    `timestamp`   datetime NOT NULL default '0000-00-00 00:00:00',
    `sourceId`    SMALLINT unsigned NOT NULL,
    `corrupt`     BOOL default 0,
  PRIMARY KEY  (`id`), INDEX (`id`)
);

-- --------------------------------------------------------
--
-- datasource
-- (id, name, description, observatoryId, instrumentId, detectorId, measurementId, layeringOrder)
--
-- TODO: Add INSERT's
-- --------------------------------------------------------
CREATE TABLE `datasource` (
    `id`            SMALLINT unsigned NOT NULL,
    `name`          VARCHAR(127) NOT NULL,
    `description`   VARCHAR(255),
    `observatoryId` SMALLINT unsigned NOT NULL,
    `instrumentId`  SMALLINT unsigned NOT NULL,
    `detectorId`    SMALLINT unsigned NOT NULL,
    `measurementId` SMALLINT unsigned NOT NULL,
    `layeringOrder` TINYINT NOT NULL,
    `dateField`		VARCHAR(127) NOT NULL,
    `dateFormat`	VARCHAR(127) NOT NULL,
  PRIMARY KEY  (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

-- --------------------------------------------------------
--
-- observatory
-- (id, name, description)
--
-- --------------------------------------------------------
CREATE TABLE `observatory` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `observatory` VALUES
	(0, 'SOHO', 'Solar and Heliospheric Observatory'),
	(1, 'TRACE', 'The Transition Region and Coronal Explorer');


-- --------------------------------------------------------
--
-- instrument
-- (id, name, description)
--
-- --------------------------------------------------------

CREATE TABLE `instrument` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `instrument` VALUES
	(0, 'EIT',   'Extreme ultraviolet Imaging Telescope'),
	(1, 'LASCO', 'The Large Angle Spectrometric Coronagraph'),
	(2, 'MDI',   'Michelson Doppler Imager'),
	(3, 'TRACE', 'TRACE');

-- --------------------------------------------------------
--
-- detector
-- (id, name, description)
--
-- --------------------------------------------------------
CREATE TABLE `detector` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `detector` VALUES
	(0, '', 'EIT'),
	(1, 'C2', 'LASCO C2'),
	(2, 'C3', 'LASCO C3'),
	(3, '', 'MDI'),
	(4, '', 'TRACE');

-- --------------------------------------------------------
--
-- measurement
-- (id, name, description, units)
--
-- TODO: Remove redundant items and adjust source table
-- --------------------------------------------------------
CREATE TABLE `measurement` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `units`       VARCHAR(20)  NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `measurement` VALUES
	(0, '171', '171 Ångström extreme ultraviolet', 'Å'),
	(1, '195', '195 Ångström extreme ultraviolet', 'Å'),
	(2, '284', '284 Ångström extreme ultraviolet', 'Å'),
	(3, '304', '304 Ångström extreme ultraviolet', 'Å'),
	(4, 'int', 'Intensitygram', 'DN'),
	(5, 'mag', 'Magnetogram', 'Mx'),
	(6, 'WL', 'White Light', 'DN');

