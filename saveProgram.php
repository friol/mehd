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

mysql_connect("localhost", "kcrupxyn_data", "mos6581sid");
mysql_select_db("kcrupxyn_basicdata");

/* */

//$linenum="10";
//$line="10 print \"ciao\"";
//$progid=1;
//$deleteAll="Y";

$linenum=$_POST["lineNum"];
$line=$_POST["lineText"];
$progid=$_POST["progId"];
$deleteAll=$_POST["deleteAll"];

if ($deleteAll=="Y")
{
	$sql="delete from program_lines where program_id=".$progid;
	mysql_query($sql);
}

$sql="INSERT INTO program_lines(program_id,linenum,linetext) VALUES (".$progid.",".$linenum.",'".mysql_escape_string($line)."')";
if ($result = mysql_query($sql))
{
	returnXML("OK","inserted");
}
else
{
	returnXML("KO",mysql_error());
}
?>
