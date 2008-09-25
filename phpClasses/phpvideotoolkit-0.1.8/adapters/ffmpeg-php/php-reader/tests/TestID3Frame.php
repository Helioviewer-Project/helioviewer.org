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
 * @version    $Id: TestID3Frame.php 111 2008-09-05 17:20:56Z svollbehr $
 */

/**#@+ @ignore */
require_once("PHPUnit/Framework.php");
require_once("Reader.php");
/**#@-*/

/**
 * Unit test case for all ID3 frames.
 *
 * @package    php-reader
 * @subpackage Tests
 * @author     Ryan Butterfield <buttza@gmail.com>
 * @copyright  Copyright (c) 2008 The PHP Reader Project Workgroup
 * @license    http://code.google.com/p/php-reader/wiki/License New BSD License
 * @version    $Rev: 111 $
 */
final class TestID3Frame extends PHPUnit_Framework_TestCase
{
  private $testText = "abcdefghijklmnopqrstuvwxyz1234567890!@#\$%^&*()-";
  private $testLink = "http://www.abcdefghijklmnopqrstuvwxyz.com.xyz/qwerty.php?asdf=1234&zxcv=%20";
  private $testDate = "20070707";
  private $testCurrency = "AUD";
  private $testIdentifier = "TEST";
  private $testPrice = "169.12";
  private $testInt8 = -0x7a;
  private $testInt16 = -0x7aff;
  private $testInt24 = 0x7affca;
  private $testInt32 = -0x7affcafe;
  private $testUInt8 = 0xfa;
  private $testUInt16 = 0xfaff;
  private $testUInt32 = 0xfaffcafe;

  /**
   * Data provider for the ID3 frame test case. Finds all frames and builds
   * input combinations necessary to test all variations of each frame.
   */
  public static function provider()
  {
    /* Ignore WIP frames */
    $ignore = array("ASPI.php", "MLLT.php");

    /* Load all frames */
    $dir = opendir("../src/ID3/Frame");
    while (($file = readdir($dir)) !== false)
      if (preg_match("/^.+\.php$/", $file) && !in_array($file, $ignore))
        require_once("ID3/Frame/" . $file);
    foreach (get_declared_classes() as $class)
      if (strpos($class, "ID3_Frame_") === 0)
        $identifiers[] = substr($class, 10);
    closedir($dir);

    /* Build up all valid combinations */
    $tests = array();
    foreach ($identifiers as $identifier)
    {
      if (!method_exists("TestID3Frame", "frame" . $identifier . "0"))
        continue; // skip if no handlers registered

      $class = "ID3_Frame_" . $identifier;
      $encodings = $languages = $timings = array(null);
      if (in_array("ID3_Encoding", class_implements($class)))
        array_push($encodings, ID3_Encoding::ISO88591, ID3_Encoding::UTF16,
          ID3_Encoding::UTF16BE, ID3_Encoding::UTF8);
      if (in_array("ID3_Language", class_implements($class)))
        array_push($languages, "eng", "und");
      if (in_array("ID3_Timing", class_implements($class)))
        array_push($timings, ID3_Timing::MPEG_FRAMES, ID3_Timing::MILLISECONDS);

      foreach ($encodings as $encoding)
        foreach ($languages as $language)
          foreach ($timings as $timing)
            $tests[] = array($identifier, $encoding, $language, $timing);
    }

    return $tests;
  }

  /**
   * Test a given frame by identifier, its text encoding (if provided),
   * its language (if provided) and its timing (also if provided).
   *
   * The test involves finding frame functions that will test the given frame
   * identifier, constructing and setting up the frame, testing the constructed
   * frame, saving the frame to a string then re-creating the frame using the
   * string and testing for a final time.
   *
   * @param string $identifier The frame identifier.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   *
   * @dataProvider provider
   */
  public function testFrame($identifier, $encoding, $language, $timing)
  {
    /* Iterate through all test case functions for this frame identifier */
    $class = "ID3_Frame_" . $identifier;
    $test = 0;
    while (method_exists($this, $method = "frame" . $identifier . $test++)) {

      /* Setup and verify the frame */
      $frame = new $class();
      call_user_func(array($this, $method),
        $frame, true, $encoding, $language, $timing);
      call_user_func(array($this, $method),
        $frame, false, $encoding, $language, $timing);

      if (isset($encoding)) {
        $this->assertTrue(method_exists($frame, "setEncoding"));
        $frame->setEncoding($encoding);
        $this->assertTrue(method_exists($frame, "getEncoding"));
        $this->assertEquals($encoding, $frame->getEncoding());
      }
      if (isset($language)) {
        $this->assertTrue(method_exists($frame, "setLanguage"));
        $frame->setLanguage($language);
        $this->assertTrue(method_exists($frame, "getLanguage"));
        $this->assertEquals($language, $frame->getLanguage());
      }
      if (isset($timing)) {
        $this->assertTrue(method_exists($frame, "setFormat"));
        $frame->setFormat($timing);
        $this->assertTrue(method_exists($frame, "getFormat"));
        $this->assertEquals($timing, $frame->getFormat());
      }

      for ($i = 0; $i < 2; $i++) {
        /* Convert to string representation and store in an in-memory buffer */
        if ($i > 0)
          $existing = $data;
        $length = strlen($data = "" . $frame);
        if ($i > 0)
          $this->assertEquals($existing, $data);
        $this->assertTrue(($fd = fopen("php://temp", "r+b")) !== false);
        $this->assertEquals($length, fwrite($fd, $data, $length));
        $this->assertTrue(rewind($fd));

        /* Construct a frame using the reader and verify */
        $frame = new $class($reader = new Reader($fd));
        call_user_func(array($this, $method),
          $frame, false, $encoding, $language, $timing);
        if (isset($encoding))
          $this->assertEquals($encoding, $frame->getEncoding());
        if (isset($language))
          $this->assertEquals($language, $frame->getLanguage());
        if (isset($timing))
          $this->assertEquals($timing, $frame->getFormat());
      }
    }
  }

  /**
   * The first AbstractLink frame test.
   *
   * @param ID3_Frame_AbstractLink $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  /*private function frameAbstractLink0(&$frame, $construct, $encoding, $language, $timing) {
    $link = $this->testLink;

    if ($construct)
      $frame->setLink($link);
    else
      $this->assertEquals($link, $frame->getLink());
  }*/

  /**
   * The first AbstractText frame test.
   *
   * @param ID3_Frame_AbstractText $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  /*private function frameAbstractText0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $text = $this->convert($this->testText, $encoding);

    if ($construct)
      $frame->setText($text);
    else
      $this->assertEquals($text, $frame->getText());
  }*/

  /**
   * The first AENC frame test.
   *
   * @param ID3_Frame_AENC $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameAENC0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $owner = $this->testText;
    $previewStart = $this->testUInt16;
    $previewLength = $this->testUInt16 - 1;
    $encryptionInfo = $this->testText;

    if ($construct) {
      $frame->setOwner($owner);
      $frame->setPreviewStart($previewStart);
      $frame->setPreviewLength($previewLength);
      $frame->setEncryptionInfo($encryptionInfo);
    } else {
      $this->assertEquals($owner, $frame->getOwner());
      $this->assertEquals($previewStart, $frame->getPreviewStart());
      $this->assertEquals($previewLength, $frame->getPreviewLength());
      $this->assertEquals($encryptionInfo, $frame->getEncryptionInfo());
    }
  }

  /**
   * The first APIC frame test.
   *
   * @param ID3_Frame_APIC $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameAPIC0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $mimeType = $this->testText;
    $imageType = $this->testUInt8;
    $description = $this->convert($this->testText, $encoding);
    $imageData = $this->testText;
    $imageSize = strlen($imageData);

    if ($construct) {
      $frame->setMimeType($mimeType);
      $frame->setImageType($imageType);
      $frame->setDescription($description);
      $frame->setImageData($imageData);
    } else {
      $this->assertEquals($mimeType, $frame->getMimeType());
      $this->assertEquals($imageType, $frame->getImageType());
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($imageData, $frame->getImageData());
      $this->assertEquals($imageSize, $frame->getImageSize());
    }
  }

  /**
   * The first COMM frame test.
   *
   * @param ID3_Frame_COMM $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameCOMM0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $description = $this->convert($this->testText, $encoding);
    $text = $this->convert($this->testText, $encoding);

    if ($construct) {
      $frame->setDescription($description);
      $frame->setText($text);
    } else {
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($text, $frame->getText());
    }
  }

  /**
   * The first COMR frame test.
   *
   * @param ID3_Frame_COMR $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameCOMR0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $currency = $this->testCurrency;
    $price = $this->testText;
    $date = $this->testDate;
    $contact = $this->testLink;
    $delivery = $this->testUInt8;
    $seller = $this->convert($this->testText, $encoding);
    $description = $this->convert($this->testText, $encoding);
    $mimeType = $this->testText;
    $imageData = $this->testText;
    $imageSize = strlen($imageData);

    if ($construct) {
      $frame->setCurrency($currency);
      $frame->setPrice($price);
      $frame->setDate($date);
      $frame->setContact($contact);
      $frame->setDelivery($delivery);
      $frame->setSeller($seller);
      $frame->setDescription($description);
      $frame->setMimeType($mimeType);
      $frame->setImageData($imageData);
    } else {
      $this->assertEquals($currency, $frame->getCurrency());
      $this->assertEquals($price, $frame->getPrice());
      $this->assertEquals($date, $frame->getDate());
      $this->assertEquals($contact, $frame->getContact());
      $this->assertEquals($delivery, $frame->getDelivery());
      $this->assertEquals($seller, $frame->getSeller());
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($mimeType, $frame->getMimeType());
      $this->assertEquals($imageData, $frame->getImageData());
      $this->assertEquals($imageSize, $frame->getImageSize());
    }
  }

  /**
   * The first ENCR frame test.
   *
   * @param ID3_Frame_ENCR $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameENCR0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $owner = $this->testLink;
    $method = $this->testInt8;
    $encryptionData = $this->testText;

    if ($construct) {
      $frame->setOwner($owner);
      $frame->setMethod($method);
      $frame->setEncryptionData($encryptionData);
    } else {
      $this->assertEquals($owner, $frame->getOwner());
      $this->assertEquals($method, $frame->getMethod());
      $this->assertEquals($encryptionData, $frame->getEncryptionData());
    }
  }

  /**
   * The first EQU2 frame test.
   *
   * @param ID3_Frame_EQU2 $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameEQU20
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $interpolation = $this->testInt8;
    $device = $this->testText;
    $adjustments[0] = -32767.0 / 512.0;
    $adjustments[2047] = -1.0;
    $adjustments[8191] = 0.0;
    $adjustments[16383] = 1.0;
    $adjustments[32767] = 32767.0 / 512.0;

    if ($construct) {
      foreach ($adjustments as $frequency => $adjustment)
        $frame->addAdjustment($frequency, $adjustment);
      $this->assertEquals($adjustments, $frame->getAdjustments());

      $frame->setInterpolation($interpolation);
      $frame->setDevice($device);
      $frame->setAdjustments($adjustments);
    } else {
      $this->assertEquals($interpolation, $frame->getInterpolation());
      $this->assertEquals($device, $frame->getDevice());
      $this->assertEquals($adjustments, $frame->getAdjustments());
    }
  }

  /**
   * The first EQUA frame test.
   *
   * @param ID3_Frame_EQUA $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameEQUA0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $adjustments[0] = -65535;
    $adjustments[2047] = -4096;
    $adjustments[8191] = 0;
    $adjustments[16383] = 4096;
    $adjustments[32767] = 65535;

    if ($construct) {
      foreach ($adjustments as $frequency => $adjustment)
        $frame->addAdjustment($frequency, $adjustment);
      $this->assertEquals($adjustments, $frame->getAdjustments());

      $frame->setAdjustments($adjustments);
    } else {
      $this->assertEquals($adjustments, $frame->getAdjustments());
    }
  }

  /**
   * The first ETCO frame test.
   *
   * @param ID3_Frame_ETCO $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameETCO0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $events[0] = array_search("Intro end", ID3_Frame_ETCO::$types);
    $events[0xFFFF] = array_search("Verse start", ID3_Frame_ETCO::$types);
    $events[0xFFFFF] = array_search("Verse end", ID3_Frame_ETCO::$types);
    $events[0xFFFFFF] = array_search
      ("Audio end (start of silence)", ID3_Frame_ETCO::$types);
    $events[0xFFFFFFFF] = array_search
      ("Audio file ends", ID3_Frame_ETCO::$types);

    if ($construct)
      $frame->setEvents($events);
    else
      $this->assertEquals($events, $frame->getEvents());
  }

  /**
   * The first GEOB frame test.
   *
   * @param ID3_Frame_GEOB $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameGEOB0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $mimeType = $this->testText;
    $filename = $this->convert($this->testText, $encoding);
    $description = $this->convert($this->testText, $encoding);
    $objectData = $this->testText;

    if ($construct) {
      $frame->setMimeType($mimeType);
      $frame->setFilename($filename);
      $frame->setDescription($description);
      $frame->setObjectData($objectData);
    } else {
      $this->assertEquals($mimeType, $frame->getMimeType());
      $this->assertEquals($filename, $frame->getFilename());
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($objectData, $frame->getObjectData());
    }
  }

  /**
   * The first GRID frame test.
   *
   * @param ID3_Frame_GRID $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameGRID0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $owner = $this->testLink;
    $group = $this->testUInt8;
    $groupData = $this->testText;

    if ($construct) {
      $frame->setOwner($owner);
      $frame->setGroup($group);
      $frame->setGroupData($groupData);
    } else {
      $this->assertEquals($owner, $frame->getOwner());
      $this->assertEquals($group, $frame->getGroup());
      $this->assertEquals($groupData, $frame->getGroupData());
    }
  }

  /**
   * The first IPLS frame test.
   *
   * @param ID3_Frame_IPLS $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameIPLS0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $testText = $this->convert($this->testText, $encoding);
    for ($i = 0; $i < 3; $i++)
      $people[] = array($testText => $testText);

    if ($construct) {
      foreach ($people as $entry)
        foreach ($entry as $involvement => $person)
          $frame->addPerson($involvement, $person);
      $this->assertEquals($people, $frame->getPeople());

      $frame->setPeople($people);
    } else {
      $this->assertEquals($people, $frame->getPeople());
    }
  }

  /**
   * The first LINK frame test.
   *
   * @param ID3_Frame_LINK $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameLINK0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $target = $this->testIdentifier;
    $url = $this->testLink;
    $qualifier = $this->testText;

    if ($construct) {
      $frame->setTarget($target);
      $frame->setUrl($url);
      $frame->setQualifier($qualifier);
    } else {
      $this->assertEquals($target, $frame->getTarget());
      $this->assertEquals($url, $frame->getUrl());
      $this->assertEquals($qualifier, $frame->getQualifier());
    }
  }

  /**
   * The first MCDI frame test.
   *
   * @param ID3_Frame_MCDI $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameMCDI0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $data = $this->testText;

    if ($construct)
      $frame->setData($data);
    else
      $this->assertEquals($data, $frame->getData());
  }

  /**
   * The first OWNE frame test.
   *
   * @param ID3_Frame_OWNE $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameOWNE0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $currency = $this->testCurrency;
    $price = $this->testPrice;
    $date = $this->testDate;
    $seller = $this->convert($this->testText, $encoding);

    if ($construct) {
      $frame->setCurrency($currency);
      $frame->setPrice(0.0 + $price);
      $frame->setDate($date);
      $frame->setSeller($seller);
    } else {
      $this->assertEquals($currency, $frame->getCurrency());
      $this->assertEquals($price, $frame->getPrice());
      $this->assertEquals($date, $frame->getDate());
      $this->assertEquals($seller, $frame->getSeller());
    }
  }

  /**
   * The first PCNT frame test.
   *
   * @param ID3_Frame_PCNT $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function framePCNT0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $counter = $this->testUInt32;

    if ($construct) {
      for ($i = 0; $i < 123; $i++)
        $frame->addCounter();
      $this->assertEquals(123, $frame->getCounter());

      $frame->setCounter($counter);
    } else {
      $this->assertEquals($counter, $frame->getCounter());
    }
  }

  /**
   * The first POPM frame test.
   *
   * @param ID3_Frame_POPM $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function framePOPM0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $owner = $this->testLink;
    $rating = $this->testUInt8;
    $counter = $this->testUInt32;

    if ($construct) {
      $frame->setOwner($owner);
      $frame->setRating($rating);
      $frame->setCounter($counter);
    } else {
      $this->assertEquals($owner, $frame->getOwner());
      $this->assertEquals($rating, $frame->getRating());
      $this->assertEquals($counter, $frame->getCounter());
    }
  }

  /**
   * The first POSS frame test.
   *
   * @param ID3_Frame_POSS $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function framePOSS0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $position = $this->testUInt32;

    if ($construct)
      $frame->setPosition($position);
    else
      $this->assertEquals($position, $frame->getPosition());
  }

  /**
   * The first PRIV frame test.
   *
   * @param ID3_Frame_PRIV $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function framePRIV0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $owner = $this->testText;
    $privateData = $this->testText;

    if ($construct) {
      $frame->setOwner($owner);
      $frame->setPrivateData($privateData);
    } else {
      $this->assertEquals($owner, $frame->getOwner());
      $this->assertEquals($privateData, $frame->getPrivateData());
    }
  }

  /**
   * The first RBUF frame test.
   *
   * @param ID3_Frame_RBUF $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameRBUF0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $bufferSize = $this->testInt24;
    $flags = $this->testInt8;
    $offset = $this->testInt32;

    if ($construct) {
      $frame->setBufferSize($bufferSize);
      $frame->setInfoFlags($flags);
      $frame->setOffset($offset);
    } else {
      $this->assertEquals($bufferSize, $frame->getBufferSize());
      $this->assertEquals($flags, $frame->getInfoFlags());
      $this->assertEquals($offset, $frame->getOffset());
    }
  }

  /**
   * The first RVA2 frame test.
   *
   * @param ID3_Frame_RVA2 $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameRVA20
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $device = $this->testText;
    $adjustments[0] = array(ID3_Frame_RVA2::channelType => 0,
      ID3_Frame_RVA2::volumeAdjustment => -32767.0 / 512.0,
      ID3_Frame_RVA2::peakVolume => 0x0);
    $adjustments[1] = array(ID3_Frame_RVA2::channelType => 1,
      ID3_Frame_RVA2::volumeAdjustment => -8191.0 / 512.0,
      ID3_Frame_RVA2::peakVolume => 0x7f);
    $adjustments[2] = array(ID3_Frame_RVA2::channelType => 2,
      ID3_Frame_RVA2::volumeAdjustment => -2047.0 / 512.0,
      ID3_Frame_RVA2::peakVolume => 0xff);
    $adjustments[3] = array(ID3_Frame_RVA2::channelType => 3,
      ID3_Frame_RVA2::volumeAdjustment => -1.0,
      ID3_Frame_RVA2::peakVolume => 0x7fff);
    $adjustments[4] = array(ID3_Frame_RVA2::channelType => 4,
      ID3_Frame_RVA2::volumeAdjustment => 0.0,
      ID3_Frame_RVA2::peakVolume => 0xffff);
    $adjustments[5] = array(ID3_Frame_RVA2::channelType => 5,
      ID3_Frame_RVA2::volumeAdjustment => 1.0,
      ID3_Frame_RVA2::peakVolume => 0x7fffff);
    $adjustments[6] = array(ID3_Frame_RVA2::channelType => 6,
      ID3_Frame_RVA2::volumeAdjustment => 2047.0 / 512.0,
      ID3_Frame_RVA2::peakVolume => 0xffffff);
    $adjustments[7] = array(ID3_Frame_RVA2::channelType => 7,
      ID3_Frame_RVA2::volumeAdjustment => 8191.0 / 512.0,
      ID3_Frame_RVA2::peakVolume => 0x7fffffff);
    $adjustments[8] = array(ID3_Frame_RVA2::channelType => 8,
      ID3_Frame_RVA2::volumeAdjustment => 32767.0 / 512.0,
      ID3_Frame_RVA2::peakVolume => 0xffffffff);

    if ($construct) {
      $frame->setDevice($device);
      $frame->setAdjustments($adjustments);
    } else {
      $this->assertEquals($device, $frame->getDevice());
      $this->assertEquals($adjustments, $frame->getAdjustments());
    }
  }

  /**
   * The first RVAD frame test.
   *
   * @param ID3_Frame_RVAD $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameRVAD0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $adjustments[ID3_Frame_RVAD::right] = -0xffff;
    $adjustments[ID3_Frame_RVAD::left] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakRight] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakLeft] = 0xfff;

    if ($construct)
      $frame->setAdjustments($adjustments);
    else
      $this->assertEquals($adjustments, $frame->getAdjustments());
  }

  /**
   * The second RVAD frame test.
   *
   * @param ID3_Frame_RVAD $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameRVAD1
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $adjustments[ID3_Frame_RVAD::right] = -0xffff;
    $adjustments[ID3_Frame_RVAD::left] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakRight] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakLeft] = 0xfff;
    $adjustments[ID3_Frame_RVAD::rightBack] = -0xff;
    $adjustments[ID3_Frame_RVAD::leftBack] = 0xff;
    $adjustments[ID3_Frame_RVAD::peakRightBack] = 0xff;
    $adjustments[ID3_Frame_RVAD::peakLeftBack] = 0xf;

    if ($construct)
      $frame->setAdjustments($adjustments);
    else
      $this->assertEquals($adjustments, $frame->getAdjustments());
  }

  /**
   * The third RVAD frame test.
   *
   * @param ID3_Frame_RVAD $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameRVAD2
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $adjustments[ID3_Frame_RVAD::right] = -0xffff;
    $adjustments[ID3_Frame_RVAD::left] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakRight] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakLeft] = 0xfff;
    $adjustments[ID3_Frame_RVAD::rightBack] = -0xff;
    $adjustments[ID3_Frame_RVAD::leftBack] = 0xff;
    $adjustments[ID3_Frame_RVAD::peakRightBack] = 0xff;
    $adjustments[ID3_Frame_RVAD::peakLeftBack] = 0xf;
    $adjustments[ID3_Frame_RVAD::center] = 0xf;
    $adjustments[ID3_Frame_RVAD::peakCenter] = 0x7;

    if ($construct)
      $frame->setAdjustments($adjustments);
    else
      $this->assertEquals($adjustments, $frame->getAdjustments());
  }

  /**
   * The fourth RVAD frame test.
   *
   * @param ID3_Frame_RVAD $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameRVAD3
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $adjustments[ID3_Frame_RVAD::right] = -0xffff;
    $adjustments[ID3_Frame_RVAD::left] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakRight] = 0xffff;
    $adjustments[ID3_Frame_RVAD::peakLeft] = 0xfff;
    $adjustments[ID3_Frame_RVAD::rightBack] = -0xff;
    $adjustments[ID3_Frame_RVAD::leftBack] = 0xff;
    $adjustments[ID3_Frame_RVAD::peakRightBack] = 0xff;
    $adjustments[ID3_Frame_RVAD::peakLeftBack] = 0xf;
    $adjustments[ID3_Frame_RVAD::center] = 0xf;
    $adjustments[ID3_Frame_RVAD::peakCenter] = 0x7;
    $adjustments[ID3_Frame_RVAD::bass] = 0x0;
    $adjustments[ID3_Frame_RVAD::peakBass] = 0x0;

    if ($construct)
      $frame->setAdjustments($adjustments);
    else
      $this->assertEquals($adjustments, $frame->getAdjustments());
  }

  /**
   * The first RVRB frame test.
   *
   * @param ID3_Frame_RVRB $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameRVRB0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $reverbLeft = $this->testUInt16;
    $reverbRight = $this->testUInt16 - 1;
    $reverbBouncesLeft = $this->testUInt8;
    $reverbBouncesRight = $this->testUInt8 - 1;
    $reverbFeedbackLtoL = $this->testUInt8 - 2;
    $reverbFeedbackLtoR = $this->testUInt8 - 3;
    $reverbFeedbackRtoR = $this->testUInt8 - 4;
    $reverbFeedbackRtoL = $this->testUInt8 - 5;
    $premixLtoR = $this->testUInt8 - 6;
    $premixRtoL = $this->testUInt8 - 7;

    if ($construct) {
      $frame->setReverbLeft($reverbLeft);
      $frame->setReverbRight($reverbRight);
      $frame->setReverbBouncesLeft($reverbBouncesLeft);
      $frame->setReverbBouncesRight($reverbBouncesRight);
      $frame->setReverbFeedbackLtoL($reverbFeedbackLtoL);
      $frame->setReverbFeedbackLtoR($reverbFeedbackLtoR);
      $frame->setReverbFeedbackRtoR($reverbFeedbackRtoR);
      $frame->setReverbFeedbackRtoL($reverbFeedbackRtoL);
      $frame->setPremixLtoR($premixLtoR);
      $frame->setPremixRtoL($premixRtoL);
    } else {
      $this->assertEquals($reverbLeft, $frame->getReverbLeft());
      $this->assertEquals($reverbRight, $frame->getReverbRight());
      $this->assertEquals($reverbBouncesLeft, $frame->getReverbBouncesLeft());
      $this->assertEquals($reverbBouncesRight, $frame->getReverbBouncesRight());
      $this->assertEquals($reverbFeedbackLtoL, $frame->getReverbFeedbackLtoL());
      $this->assertEquals($reverbFeedbackLtoR, $frame->getReverbFeedbackLtoR());
      $this->assertEquals($reverbFeedbackRtoR, $frame->getReverbFeedbackRtoR());
      $this->assertEquals($reverbFeedbackRtoL, $frame->getReverbFeedbackRtoL());
      $this->assertEquals($premixLtoR, $frame->getPremixLtoR());
      $this->assertEquals($premixRtoL, $frame->getPremixRtoL());
    }
  }

  /**
   * The first SEEK frame test.
   *
   * @param ID3_Frame_SEEK $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameSEEK0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $minOffset = $this->testInt32;

    if ($construct)
      $frame->setMinimumOffset($minOffset);
    else
      $this->assertEquals($minOffset, $frame->getMinimumOffset());
  }

  /**
   * The first SIGN frame test.
   *
   * @param ID3_Frame_SIGN $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameSIGN0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $group = $this->testUInt8;
    $signature = $this->testText;

    if ($construct) {
      $frame->setGroup($group);
      $frame->setSignature($signature);
    } else {
      $this->assertEquals($group, $frame->getGroup());
      $this->assertEquals($signature, $frame->getSignature());
    }
  }

  /**
   * The first SYLT frame test.
   *
   * @param ID3_Frame_SYLT $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameSYLT0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $type = $this->testUInt8;
    $description = $this->convert($this->testText, $encoding);
    $events[0] = $description;
    $events[0xFFFF] = $description;
    $events[0xFFFFF] = $description;
    $events[0xFFFFFF] = $description;
    $events[0xFFFFFFFF] = $description;

    if ($construct) {
      $frame->setType($type);
      $frame->setDescription($description);
      $frame->setEvents($events);
    } else {
      $this->assertEquals($type, $frame->getType());
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($events, $frame->getEvents());
    }
  }

  /**
   * The first SYTC frame test.
   *
   * @param ID3_Frame_SYTC $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameSYTC0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $events[0] = ID3_Frame_SYTC::BEAT_FREE;
    $events[0xFFFF] = ID3_Frame_SYTC::SINGLE_BEAT;
    $events[0xFFFFF] = 0xFF;
    $events[0xFFFFFF] = 0xFF + 1;
    $events[0xFFFFFFFF] = 0xFF + 0xFF;

    if ($construct)
      $frame->setEvents($events);
    else
      $this->assertEquals($events, $frame->getEvents());
  }

  /**
   * The first TXXX frame test.
   *
   * @param ID3_Frame_TXXX $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameTXXX0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $description = $this->convert($this->testText, $encoding);
    $text = $this->convert($this->testText, $encoding);

    if ($construct) {
      $frame->setDescription($description);
      $frame->setText($text);
    } else {
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($text, $frame->getText());
    }
  }

  /**
   * The first USER frame test.
   *
   * @param ID3_Frame_USER $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameUSER0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $text = $this->convert($this->testText, $encoding);

    if ($construct)
      $frame->setText($text);
    else
      $this->assertEquals($text, $frame->getText());
  }

  /**
   * The first USLT frame test.
   *
   * @param ID3_Frame_USLT $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameUSLT0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $description = $this->convert($this->testText, $encoding);
    $text = $this->convert($this->testText, $encoding);

    if ($construct) {
      $frame->setDescription($description);
      $frame->setText($text);
    } else {
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($text, $frame->getText());
    }
  }

  /**
   * The first WXXX frame test.
   *
   * @param ID3_Frame_WXXX $frame The frame to test.
   * @param boolean $construct Whether construction or testing should occur.
   * @param integer $encoding The {@link ID3_Encoding text encoding} for strings
   *        in this frame.
   * @param string $language The language code.
   * @param integer $timing The timing format.
   */
  private function frameWXXX0
      (&$frame, $construct, $encoding, $language, $timing)
  {
    $description = $this->convert($this->testText, $encoding);
    $link = $this->testLink;

    if ($construct) {
      $frame->setDescription($description);
      $frame->setLink($link);
    } else {
      $this->assertEquals($description, $frame->getDescription());
      $this->assertEquals($link, $frame->getLink());
    }
  }

  /**
   * Helper function to convert a string into a string of the given encoding.
   *
   * @param string $text The string to convert.
   * @param integer $encoding The text encoding to convert to.
   * @return string
   */
  private static function convert($text, $encoding)
  {
    switch ($encoding) {
    case ID3_Encoding::ISO88591:
      return iconv("ascii", "ISO-8859-1", $text);
    case ID3_Encoding::UTF16:
      return iconv("ascii", "UTF-16", $text);
    case ID3_Encoding::UTF16LE:
      return substr(iconv("ascii", "UTF-16LE", $text), 2);
    case ID3_Encoding::UTF16BE:
      return iconv("ascii", "UTF-16BE", $text);
    default: // ID3_Encoding::UTF8
      return iconv("ascii", "UTF-8", $text);
    }
  }
}