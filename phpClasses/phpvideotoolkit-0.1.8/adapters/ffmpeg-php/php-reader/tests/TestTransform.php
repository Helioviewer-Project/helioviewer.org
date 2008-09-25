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
 * @version    $Id: TestTransform.php 107 2008-08-03 19:09:16Z svollbehr $
 */

/**#@+ @ignore */
require_once("PHPUnit/Framework.php");
require_once("Transform.php");
/**#@-*/

/**
 * Unit test case for Transform class.
 *
 * @package    php-reader
 * @subpackage Tests
 * @author     Sven Vollbehr <svollbehr@gmail.com>
 * @author     Ryan Butterfield <buttza@gmail.com>
 * @copyright  Copyright (c) 2008 The PHP Reader Project Workgroup
 * @license    http://code.google.com/p/php-reader/wiki/License New BSD License
 * @version    $Rev: 107 $
 */
final class TestTransform extends PHPUnit_Framework_TestCase
{
  function testInt64LE()
  {
    $this->assertEquals
      (0x7fffffffffffffff, Transform::fromInt64BE
       (Transform::toInt64BE(0x7fffffffffffffff)));
  }

  function testInt64BE()
  {
    $this->assertEquals
      (0x7fffffffffffffff, Transform::fromInt64BE
       (Transform::toInt64BE(0x7fffffffffffffff)));
  }

  function testInt32()
  {
    $this->assertEquals
      (0x7fffffff, Transform::fromInt32(Transform::toInt32(0x7fffffff)));
    $this->assertEquals
      (-0x7fffffff, Transform::fromInt32(Transform::toInt32(-0x7fffffff)));
    $this->assertEquals(-1, Transform::fromInt32(Transform::toInt32(-1)));
  }

  function testInt32LE()
  {
    $this->assertEquals(1, Transform::fromInt32LE("\x01\x00\x00\x00"));
    $this->assertEquals
      (0x7fffffff, Transform::fromInt32LE(Transform::toInt32LE(0x7fffffff)));
    $this->assertEquals
      (-0x7fffffff, Transform::fromInt32LE(Transform::toInt32LE(-0x7fffffff)));
    $this->assertEquals(-1, Transform::fromInt32LE(Transform::toInt32LE(-1)));
  }

  function testInt32BE()
  {
    $this->assertEquals(1, Transform::fromInt32BE("\x00\x00\x00\x01"));
    $this->assertEquals
      (0x7fffffff, Transform::fromInt32BE(Transform::toInt32BE(0x7fffffff)));
    $this->assertEquals
      (-0x7fffffff, Transform::fromInt32BE(Transform::toInt32BE(-0x7fffffff)));
  }

  function testUInt32LE()
  {
    $this->assertEquals
      ("78563412", Transform::fromHHex(Transform::toUInt32LE(0x12345678)));
    $this->assertEquals
      (0xffffffff, Transform::fromUInt32LE(Transform::toUInt32LE(0xffffffff)));
  }

  function testUInt32BE()
  {
    $this->assertEquals
      ("12345678", Transform::fromHHex(Transform::toUInt32BE(0x12345678)));
    $this->assertEquals
      (0xffffffff, Transform::fromUInt32BE(Transform::toUInt32BE(0xffffffff)));
  }

  function testInt16()
  {
    $this->assertEquals
      (0x7fff, Transform::fromInt16(Transform::toInt16(0x7fff)));
    $this->assertEquals(-1, Transform::fromInt16(Transform::toInt16(-1)));
  }

  function testInt16LE()
  {
    $this->assertEquals(1, Transform::fromInt16LE("\x01\x00"));
    $this->assertEquals
      (0x7fff, Transform::fromInt16LE(Transform::toInt16LE(0x7fff)));
    $this->assertEquals(-1, Transform::fromInt16LE(Transform::toInt16LE(-1)));
  }

  function testInt16BE()
  {
    $this->assertEquals(1, Transform::fromInt16BE("\x00\x01"));
    $this->assertEquals
      (0x7fff, Transform::fromInt16BE(Transform::toInt16BE(0x7fff)));
    $this->assertEquals(-1, Transform::fromInt16BE(Transform::toInt16BE(-1)));
  }

  function testUInt16LE()
  {
    $this->assertEquals
      ("fffe", Transform::fromHHex(Transform::toUInt16LE(0xfeff)));
    $this->assertEquals
      (0xffff, Transform::fromUInt16LE(Transform::toUInt16LE(0xffff)));
  }

  function testUInt16BE()
  {
    $this->assertEquals
      ("feff", Transform::fromHHex(Transform::toUInt16BE(0xfeff)));
    $this->assertEquals
      (0xffff, Transform::fromUInt16BE(Transform::toUInt16BE(0xffff)));
  }

  function testInt8()
  {
    $this->assertEquals(0x7f, Transform::fromInt8(Transform::toInt8(0x7f)));
  }

  function testString16()
  {
    $this->assertEquals("00e4", Transform::fromHHex
      (Transform::fromString16(Transform::toString16("\x00\xe4"))));
    $this->assertEquals
      ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
       Transform::fromString16(Transform::toString16LE
        ("\xff\xfe\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.")));
    $this->assertEquals
      ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
       Transform::fromString16(Transform::toString16BE
        ("\xff\xfe\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.")));
    $this->assertEquals
      ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
       Transform::fromString16(Transform::toString16
        ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
         Transform::LITTLE_ENDIAN_ORDER)));
    $this->assertEquals
      ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
       Transform::fromString16(Transform::toString16
        ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
         Transform::BIG_ENDIAN_ORDER)));
  }

  function testString16LE()
  {
    $this->assertEquals
      ("fffe", Transform::fromHHex(Transform::toString16LE("\xff\xfe")));
    $this->assertEquals
      ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
       Transform::fromString16LE(Transform::toString16LE
        ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.")));
  }

  function testString16BE()
  {
    $this->assertEquals
      ("feff", Transform::fromHHex(Transform::toString16BE("\xff\xfe")));
    $this->assertEquals
      ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.",
       Transform::fromString16BE(Transform::toString16BE
        ("\0T\0h\0i\0s\0 \0i\0s\0 \0a\0 \0t\0e\0s\0t\0.")));
  }

  function testHHex()
  {
    $this->assertEquals("6c34", bin2hex(Transform::toHHex("6c34")));
    $this->assertEquals("6c34", Transform::fromHHex(Transform::toHHex("6c34")));
  }

  function testLHex()
  {
    $this->assertEquals("c643", bin2hex(Transform::toLHex("6c34")));
    $this->assertEquals("6c34", Transform::fromLHex(Transform::toLHex("6c34")));
  }

  function testGUID()
  {
    $this->assertEquals
      ("75b22630-668e-11cf-a6d9-00aa0062ce6c",
       Transform::fromGUID(Transform::toGUID
         ("75b22630-668e-11cf-a6d9-00aa0062ce6c")));
  }
}
