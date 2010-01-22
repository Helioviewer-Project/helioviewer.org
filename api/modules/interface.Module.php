<?php 

interface Module 
{
	public function execute();
	public function validate();
	public static function printDoc();
}

?>