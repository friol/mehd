<?php

function returnXML($rez,$msg)
{
	$doc = new DomDocument('1.0', 'UTF-8');
	
	$rezgroup = $doc->createElement("results");
	
	$progbody = $doc->createElement("result");
	$progbody->appendChild($doc->createTextNode($rez));
	$rezgroup->appendChild($progbody);

	$progbody = $doc->createElement("message");
	$progbody->appendChild($doc->createTextNode($msg));
	$rezgroup->appendChild($progbody);

	$doc->appendChild($rezgroup);
	  
	echo $doc->saveXML();
}

header('Access-Control-Allow-Origin: *');
header ("Content-Type:text/xml");  

/* */

$proggieName=$_POST["progName"];
$proggieText=$_POST["progText"];

$fp = fopen('savedir/' . $proggieName, 'w');
fwrite($fp, $proggieText);
fclose($fp);

returnXML("OK","Program saved.");
?>
