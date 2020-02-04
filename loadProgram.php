<?php

function errorXML()
{
	$doc = new DomDocument('1.0', 'UTF-8');
	
	$r = $doc->createElement("program");
	$doc->appendChild($r);

	$esito = $doc->createElement("retval");
	$esito->appendChild($doc->createTextNode("KO"));
	$r->appendChild($esito);

	echo $doc->saveXML();
}

header('Access-Control-Allow-Origin: *');
header ("Content-Type:text/xml");  

$pname=$_POST["programName"];

/* */

$fileContent = file_get_contents($pname);

$doc = new DomDocument('1.0', 'UTF-8');

$r = $doc->createElement("program");
$doc->appendChild($r);

$esito = $doc->createElement("retval");
$esito->appendChild($doc->createTextNode("OK"));
$r->appendChild($esito);

$progbody = $doc->createElement("programText");
$progbody->appendChild($fileContent);

$r->appendChild($progbody);
  
echo $doc->saveXML();

?>
