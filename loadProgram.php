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

$fileContent = file_get_contents('savedir/' . $pname);

$doc = new DomDocument('1.0', 'UTF-8');

$r = $doc->createElement("program");
$r->appendChild($doc->createTextNode($fileContent));

$doc->appendChild($r);

echo $doc->saveXML();
?>
