<?php
//per scaricare il file xml con il track_indexing rifatto
$string = $_POST["xmldata"];
$filename = "output.xml";
file_put_contents($filename, $string);
header("Content-Disposition: attachment; filename=\"" . basename($filename) . "\"");
header('Content-Type: "text/xml";charset="utf8"');
header("Content-Length: " . filesize($filename));
?>