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
 * @version    $Id: TestID3v2.php 107 2008-08-03 19:09:16Z svollbehr $
 */

/**#@+ @ignore */
require_once("PHPUnit/Framework.php");
require_once("ID3v2.php");
/**#@-*/

/**
 * Unit test case for ID3v2 class.
 *
 * @package    php-reader
 * @subpackage Tests
 * @author     Sven Vollbehr <svollbehr@gmail.com>
 * @copyright  Copyright (c) 2008 The PHP Reader Project Workgroup
 * @license    http://code.google.com/p/php-reader/wiki/License New BSD License
 * @version    $Rev: 107 $
 */
final class TestID3v2 extends PHPUnit_Framework_TestCase
{
  function testTagCreate()
  {
    $id3 = new ID3v2();
    
    $id3->tit2->text = "Title 1";
    $this->assertEquals("Title 1",   $id3->tit2->text);
    $id3->tope->text = "Artist 1";
    $this->assertEquals("Artist 1",  $id3->tope->text);
    $id3->talb->text = "Album 1";
    $this->assertEquals("Album 1",   $id3->talb->text);
    $id3->tdrc->text = "2008";
    $this->assertEquals("2008",      $id3->tdrc->text);
    $id3->comm->text = "Comment 1";
    $this->assertEquals("Comment 1", $id3->comm->text);
    $id3->trck->text = "11/13";
    $this->assertEquals("11/13",     $id3->trck->text);
    $id3->tcon->text = "Classical";
    $this->assertEquals("Classical", $id3->tcon->text);
    
    $id3->write("id3v2.tag");
  }

  function testTagReadAfterCreate()
  {
    $id3 = new ID3v2("id3v2.tag");
    
    $this->assertEquals("Title 1",   $id3->tit2->text);
    $this->assertEquals("Artist 1",  $id3->tope->text);
    $this->assertEquals("Album 1",   $id3->talb->text);
    $this->assertEquals("2008",      $id3->tdrc->text);
    $this->assertEquals("Comment 1", $id3->comm->text);
    $this->assertEquals("11/13",     $id3->trck->text);
    $this->assertEquals("Classical", $id3->tcon->text);
  }

  function testTagChange()
  {
    $id3 = new ID3v2("id3v2.tag");
    
    $id3->tit2->text = "Title 2";
    $this->assertEquals("Title 2",   $id3->tit2->text);
    $id3->tope->text = "Artist 2";
    $this->assertEquals("Artist 2",  $id3->tope->text);
    $id3->talb->text = "Album 2";
    $this->assertEquals("Album 2",   $id3->talb->text);
    $id3->tdrc->text = "2020";
    $this->assertEquals("2020",      $id3->tdrc->text);
    $id3->comm->text = "Comment 2";
    $this->assertEquals("Comment 2", $id3->comm->text);
    $id3->trck->text = "13/13";
    $this->assertEquals("13/13",     $id3->trck->text);
    $id3->tcon->text = "Trance";
    $this->assertEquals("Trance",    $id3->tcon->text);
    
    $id3->write();
  }

  function testTagReadAfterChange()
  {
    $id3 = new ID3v2("id3v2.tag");
    
    $this->assertEquals("Title 2",   $id3->tit2->text);
    $this->assertEquals("Artist 2",  $id3->tope->text);
    $this->assertEquals("Album 2",   $id3->talb->text);
    $this->assertEquals("2020",      $id3->tdrc->text);
    $this->assertEquals("Comment 2", $id3->comm->text);
    $this->assertEquals("13/13",     $id3->trck->text);
    $this->assertEquals("Trance",    $id3->tcon->text);
  }
  
  function testUnsynchronisation()
  {
    $id3 = new ID3v2("id3v2.tag");
    $id3->tit2->text = "\xff\xf0";
    $id3->tcon->text = "\xff\xe0\xf0";
    $id3->write();
    
    $this->assertEquals
      ("TIT2\0\0\0\x08\0\x03\0\0\0\x03\x03\xff\x00\xf0", "" . $id3->tit2);
    
    $id3 = new ID3v2("id3v2.tag");
    $this->assertEquals("\xff\xf0",     $id3->tit2->text);
    $this->assertEquals("\xff\xe0\xf0", $id3->tcon->text);
  }
}
