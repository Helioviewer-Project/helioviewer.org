<?php 

interface Module {
	abstract function execute();
	abstract function validate();
	abstract function printDoc();
}

?>