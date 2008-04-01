<?php

	
	$Database = mysql_connect ("localhost", "root", "password")
		or die ('I cannot connect to the database because: ' . mysql_error());

	mysql_select_db ("esahelio_svdb0");	
	
	//Instrument=EIT&From=2003-10-1&To=2003-10-7
	//SELECT * FROM maps WHERE (Instrument = 'EIT' AND timestamp BETWEEN '2003-10-1 00:00:00' AND '2003-10-7 00:00:00') ORDER BY timestamp;
	function Filter($Observatory, $Instrument, $Detector, $Measurement, $From, $To)
	{
		function AppendAND()
		{
			global $MultipleCriteria, $Query;
			if ($MultipleCriteria == true)
			{
				$Query = "$Query AND ";
			}	
		}
		
		
		$MultipleCriteria = false;
		$Query = "SELECT * FROM maps WHERE (";
		
		if ($Instrument != null)
		{
			AppendAND();
			$Query = "$Query Instrument = '$Instrument'";
			$MultipleCriteria = true;
		}

		AppendAND();
		//$Query = "$Query timestamp BETWEEN '$From 00:00:00' AND '$To 00:00:00') ORDER BY timestamp";
		$Query = "$Query AND timestamp BETWEEN '$From 00:00:00' AND '$To 00:00:00') ORDER BY timestamp";
		$Result = mysql_query($Query);
		$ResultStore = array();

		while ($Row = mysql_fetch_array($Result, MYSQL_NUM))
		{
			array_push($ResultStore, $Row);
		}

		echo json_encode($ResultStore);
	}
	
	function ReturnInstruments()
	{
		$Query = "SELECT DISTINCT instrument FROM maps ORDER BY instrument";
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
		$Query = "SELECT DISTINCT year FROM maps WHERE instrument = '$Instrument' ORDER BY year";
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
		$Query = "SELECT DISTINCT month FROM maps WHERE year = '$Year' AND instrument = '$Instrument' ORDER BY month";
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
		$Query = "SELECT DISTINCT day FROM maps WHERE year = '$Year' AND month = '$Month' AND instrument = '$Instrument' ORDER BY day";
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
		$Query = "SELECT * FROM maps WHERE year = '$Year' AND month = '$Month' AND instrument = '$Instrument' AND day = '$Day' ORDER BY timestamp";
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
