<?php

	
	$Database = mysql_connect ("localhost", "root", "password")
		or die ('I cannot connect to the database because: ' . mysql_error());

	mysql_select_db ("esahelio_svdb0");	
	
	function ReturnInstruments()
	{
		$Query = "SELECT DISTINCT instrument FROM maps";
		$Result = mysql_query($Query);
		$ProcessedData = array();
		while($Data = mysql_fetch_array($Result, MYSQL_NUM))
		{
			array_push($ProcessedData, $Data);
		}
		
		echo json_encode($ProcessedData);
		mysql_close();
	}
	
	
	function ReturnYears($Instrument)
	{
		$Query = "SELECT DISTINCT year FROM maps WHERE instrument = '$Instrument'";
		$Result = mysql_query($Query);
		$ProcessedData = array();
		while($Data = mysql_fetch_array($Result, MYSQL_NUM))
		{
			array_push($ProcessedData, $Data);
		}
		
		echo json_encode($ProcessedData);
		mysql_close();
	}
	
	function ReturnMonths($Instrument, $Year)
	{	
		$Query = "SELECT DISTINCT month FROM maps WHERE year = '$Year' AND instrument = '$Instrument'";
		$Result = mysql_query($Query);
		$ProcessedData = array();
		while($Data = mysql_fetch_array($Result, MYSQL_NUM))
		{
			array_push($ProcessedData, $Data);
		}
		
		echo json_encode($ProcessedData);
		mysql_close();
	}
	
	function ReturnDays($Instrument, $Year, $Month)
	{
		$Month = (string) $Month;
		if (strlen($Month == 1))
		{
			$Month = "0$Month";
		}
		$Query = "SELECT DISTINCT day FROM maps WHERE year = '$Year' AND month = '$Month' AND instrument = '$Instrument'";
		$Result = mysql_query($Query);
		$ProcessedData = array();
		while($Data = mysql_fetch_array($Result, MYSQL_NUM))
		{
			array_push($ProcessedData, $Data);
		}
		
		echo json_encode($ProcessedData);
		mysql_close();
	}
	
	function LEGACY_ReturnMaps($Instrument, $Year, $Month, $Day)
	{
		$Month = (string) $Month;
		if (strlen($Month == 1))
		{
			$Month = "0$Month";
		}
		$Query = "SELECT * FROM maps WHERE year = '$Year' AND month = '$Month' AND instrument = '$Instrument' AND day = '$Day'";
		$Result = mysql_query($Query);
		$ProcessedData = array();
		while($Data = mysql_fetch_array($Result, MYSQL_NUM))
		{
			array_push($ProcessedData, $Data);
		}
		
		echo json_encode($ProcessedData);
		mysql_close();
	}
	
?>
