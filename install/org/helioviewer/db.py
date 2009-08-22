# -*- coding: utf-8 -*-
import sys

def setupDatabaseSchema(adminuser, adminpass, dbuser, dbpass, mysql):
    ''' Sets up Helioviewer.org database schema '''
    if mysql:
        import MySQLdb
        adaptor = MySQLdb
    else:
        import pgdb
        adaptor = pgdb

    createDB(adminuser, adminpass, dbuser, dbpass, mysql, adaptor)

    # connect to helioviewer database
    if mysql:
        db = MySQLdb.connect(host="localhost", db="helioviewer", user=dbuser, passwd=dbpass)
    else:
        db = pgdb.connect(database="helioviewer", user=dbuser, password=dbpass)
    cursor = db.cursor()

    createSourceTable(cursor)
    createObservatoryTable(cursor)
    createInstrumentTable(cursor)
    createDetectorTable(cursor)
    createMeasurementTable(cursor)
    createImageTable(cursor)

    return cursor

def checkDBInfo(adminuser, adminpass, mysql):
    ''' Validate database login information '''
    try:
        if mysql:
            import MySQLdb
            db = MySQLdb.connect(user=adminuser, passwd=adminpass)
        else:
            import pgdb
            db = pgdb.connect(database="postgres", user=adminuser, password=adminpass)
    except MySQLdb.Error, e:
        print e
        return False

    db.close()
    return True

def createDB(adminuser, adminpass, dbuser, dbpass, mysql, adaptor):
    ''' Creates database
        TODO (2009/08/18) Catch error case when db already exists, and gracefully exit '''
    if mysql:
        try:
           db = adaptor.connect(user=adminuser, passwd=adminpass)
           cursor = db.cursor()
           cursor.execute("CREATE DATABASE IF NOT EXISTS helioviewer;")
           cursor.execute("GRANT ALL ON helioviewer.* TO '%s'@'localhost' IDENTIFIED BY '%s';" % (dbuser, dbpass))
        except adaptor.Error, e:
            print "Error: " + e.args[1]
            sys.exit(2)
    else:
        try:
            db = adaptor.connect(database="postgres", user=adminuser, password=adminpass)
            cursor = db.cursor()
            cursor.execute("CREATE DATABASE IF NOT EXISTS helioviewer;")
            cursor.execute("GRANT ALL ON helioviewer.* TO '%s'@'localhost' IDENTIFIED BY '%s';" % (dbuser, dbpass))
        except Exception, e:
            print "Error: " + e.args[1]
            sys.exit(2)

    cursor.close()

def createImageTable(cursor):
    sql = \
    '''CREATE TABLE `image` (
      `id`            INT unsigned NOT NULL auto_increment,
      `uri`            VARCHAR(255) NOT NULL,
      `timestamp`    datetime NOT NULL default '0000-00-00 00:00:00',
      `sourceId`    SMALLINT unsigned NOT NULL,
      `corrupt`        BOOL default 0,
      PRIMARY KEY  (`id`), INDEX (`id`)
    );'''
    cursor.execute(sql)

def createSourceTable(cursor):
    cursor.execute(
    '''CREATE TABLE `datasource` (
        `id`            SMALLINT unsigned NOT NULL,
        `name`          VARCHAR(127) NOT NULL,
        `description`   VARCHAR(255),
        `observatoryId` SMALLINT unsigned NOT NULL,
        `instrumentId`  SMALLINT unsigned NOT NULL,
        `detectorId`    SMALLINT unsigned NOT NULL,
        `measurementId` SMALLINT unsigned NOT NULL,
        `layeringOrder` TINYINT NOT NULL,
        `dateField`        VARCHAR(127) NOT NULL,
        `dateFormat`    VARCHAR(127) NOT NULL,
      PRIMARY KEY  (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `datasource` VALUES
        (0, 'EIT 171', 'SOHO EIT 171', 0, 0, 0, 0, 1, 'DATE_OBS','TEST')
    ''')

def createObservatoryTable(cursor):
    """ Creates table to store observatory information """

    cursor.execute('''
    CREATE TABLE `observatory` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `observatory` VALUES
        (0, 'SOHO', 'Solar and Heliospheric Observatory'),
        (1, 'TRACE', 'The Transition Region and Coronal Explorer');
    ''')

def createInstrumentTable(cursor):
    """ Creates table to store instrument information """

    cursor.execute('''
    CREATE TABLE `instrument` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `instrument` VALUES
        (0, 'EIT',   'Extreme ultraviolet Imaging Telescope'),
        (1, 'LASCO', 'The Large Angle Spectrometric Coronagraph'),
        (2, 'MDI',   'Michelson Doppler Imager'),
        (3, 'TRACE', 'TRACE');
    ''')



def createDetectorTable(cursor):
    """ Creates table to store detector information """

    cursor.execute('''
    CREATE TABLE `detector` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `detector` VALUES
        (0, '', 'EIT'),
        (1, 'C2', 'LASCO C2'),
        (2, 'C3', 'LASCO C3'),
        (3, '', 'MDI'),
        (4, '', 'TRACE');''')


def createMeasurementTable(cursor):
    """ Creates table to store measurement information """

    cursor.execute('''
    CREATE TABLE `measurement` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
      `units`       VARCHAR(20)  NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `measurement` VALUES
        (0, '171', '171 ￃﾅngstrￃﾶm extreme ultraviolet', 'ￃﾅ'),
        (1, '195', '195 ￃﾅngstrￃﾶm extreme ultraviolet', 'ￃﾅ'),
        (2, '284', '284 ￃﾅngstrￃﾶm extreme ultraviolet', 'ￃﾅ'),
        (3, '304', '304 ￃﾅngstrￃﾶm extreme ultraviolet', 'ￃﾅ'),
        (4, 'int', 'Intensitygram', 'DN'),
        (5, 'mag', 'Magnetogram', 'Mx'),
        (6, 'WL', 'White Light', 'DN');''')

def getDataSources(cursor):
    ''' Returns a list of the known datasources '''

    sql = \
    ''' SELECT
            datasource.id as id,
            observatory.name as observatory,
            instrument.name as instrument,
            detector.name as detector,
            measurement.name as measurement
        FROM datasource
            LEFT JOIN observatory ON datasource.observatoryId = observatory.id 
            LEFT JOIN instrument ON datasource.instrumentId = instrument.id 
            LEFT JOIN detector ON datasource.detectorId = detector.id 
            LEFT JOIN measurement ON datasource.measurementId = measurement.id;'''

    cursor.execute(sql)
    return cursor.fetchall()
