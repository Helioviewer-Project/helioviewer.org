<?php
/**
 * PHP Reader Library
 *
 * Copyright (c) 2008 The PHP Reader Project Workgroup. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *  - Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *  - Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *  - Neither the name of the project workgroup nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 * @package    php-reader
 * @subpackage Tests
 * @copyright  Copyright (c) 2008 The PHP Reader Project Workgroup
 * @license    http://code.google.com/p/php-reader/wiki/License New BSD License
 * @version    $Id: TestID3v1.php 64 2008-04-01 10:38:12Z svollbehr $
 */

/**#@+ @ignore */
require_once("PHPUnit/Framework.php");
require_once("ID3v1.php");
/**#@-*/

/**
 * Unit test case for ID3v1 class.
 *
 * @package    php-reader
 * @subpackage Tests
 * @author     Sven Vollbehr <svollbehr@gmail.com>
 * @copyright  Copyright (c) 2008 The PHP Reader Project Workgroup
 * @license    http://code.google.com/p/php-reader/wiki/License New BSD License
 * @version    $Rev: 64 $
 */
final class TestID3v1 extends PHPUnit_Framework_TestCase
{
  function testTagCreate()
  {
    $id3 = new ID3v1();
    
    $id3->title   = "Title 1";
    $this->assertEquals("Title 1",   $id3->title);

    $id3->artist  = "Artist 1";
    $this->assertEquals("Artist 1",  $id3->artist);

    $id3->album   = "Album 1";
    $this->assertEquals("Album 1",   $id3->album);
    
    $id3->year    = "2008";
    $this->assertEquals("2008",      $id3->year);

    $id3->comment = "Comment 1";
    $this->assertEquals("Comment 1", $id3->comment);
    
    $id3->track = 30;
    $this->assertEquals(30, $id3->track);
    
    $id3->genre = array_search("Classical", ID3v1::$genres);
    $this->assertEquals("Classical", $id3->genre);
    
    $id3->write("id3v1.tag");
  }

  function testTagReadAfterCreate()
  {
    $id3 = new ID3v1("id3v1.tag");
    $this->assertEquals("Title 1",   $id3->title);
    $this->assertEquals("Artist 1",  $id3->artist);
    $this->assertEquals("Album 1",   $id3->album);
    $this->assertEquals("2008",      $id3->year);
    $this->assertEquals("Comment 1", $id3->comment);
    $this->assertEquals(30,          $id3->track);
    $this->assertEquals("Classical", $id3->genre);
  }

  function testTagChange()
  {
    $id3 = new ID3v1("id3v1.tag");
    
    $id3->title   = "Title 2";
    $this->assertEquals("Title 2",   $id3->title);

    $id3->artist  = "Artist 2";
    $this->assertEquals("Artist 2",  $id3->artist);

    $id3->album   = "Album 2";
    $this->assertEquals("Album 2",   $id3->album);
    
    $id3->year    = "2045";
    $this->assertEquals("2045",      $id3->year);

    $id3->comment = "Comment 2";
    $this->assertEquals("Comment 2", $id3->comment);
    
    $id3->track   = 10;
    $this->assertEquals(10, $id3->track);
    
    $id3->genre   = array_search("Trance", ID3v1::$genres);
    $this->assertEquals("Trance",    $id3->genre);
    
    $id3->write();
  }

  function testTagReadAfterChange()
  {
    $id3 = new ID3v1("id3v1.tag");
    $this->assertEquals("Title 2",   $id3->title);
    $this->assertEquals("Artist 2",  $id3->artist);
    $this->assertEquals("Album 2",   $id3->album);
    $this->assertEquals("2045",      $id3->year);
    $this->assertEquals("Comment 2", $id3->comment);
    $this->assertEquals(10,          $id3->track);
    $this->assertEquals("Trance",    $id3->genre);
  }
  
  function testTagReplace()
  {
    $id3 = new ID3v1();
    
    $id3->title = "Title 3";
    $this->assertEquals("Title 3", $id3->title);
    $this->assertEquals("Unknown", $id3->genre);
    
    $id3->write("id3v1.tag");
  }

  function testTagReadAfterReplace()
  {
    $id3 = new ID3v1("id3v1.tag");
    $this->assertEquals("Title 3", $id3->title);
    $this->assertEquals("",        $id3->artist);
    $this->assertEquals("",        $id3->album);
    $this->assertEquals("",        $id3->year);
    $this->assertEquals("",        $id3->comment);
    $this->assertEquals("",        $id3->track);
    $this->assertEquals("Unknown", $id3->genre);
  }

  function testTagCreateVersion10()
  {
    $id3 = new ID3v1();
    
    $id3->title   = "Title 4";
    $this->assertEquals("Title 4",   $id3->title);

    $id3->artist  = "Artist 4";
    $this->assertEquals("Artist 4",  $id3->artist);

    $id3->album   = "Album 4";
    $this->assertEquals("Album 4",   $id3->album);
    
    $id3->year    = "2020";
    $this->assertEquals("2020",      $id3->year);

    $id3->comment = "A comment field with 30 chars.";
    $this->assertEquals("A comment field with 30 chars.", $id3->comment);
    
    $id3->genre   = array_search("Classical", ID3v1::$genres);
    $this->assertEquals("Classical", $id3->genre);
    
    $id3->write("id3v1.tag");
  }

  function testTagReadAfterCreateVersion10()
  {
    $id3 = new ID3v1("id3v1.tag");
    $this->assertEquals("Title 4",   $id3->title);
    $this->assertEquals("Artist 4",  $id3->artist);
    $this->assertEquals("Album 4",   $id3->album);
    $this->assertEquals("2020",      $id3->year);
    $this->assertEquals("A comment field with 30 chars.", $id3->comment);
    $this->assertEquals("",          $id3->track);
    $this->assertEquals("Classical", $id3->genre);
  }
}
