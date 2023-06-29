<!DOCTYPE html>
<?php
session_start();
?>
<html xmlns="http://www.w3.org/1999/html">
<head>
	<meta charset="UTF-8">
    <title>Automatic audio and score synchronization</title>
</head>
<body onload="readXMLs();" style="background-color: white;">
<form action="./upload.php" method="post" enctype="multipart/form-data">
	<input type="file" id="XML1" name="XML1" accept=".xml"></input>
	<input type="file" id="XML2" name="XML2" accept=".xml"></input>
	<input type="submit">
</form>

<div>
<select id="tracks1" name="tracks1"></select>
<select id="tracks2" name="tracks2"></select>
</div>
<button id="gobutton" onclick="go();">Start</button>
<script type="text/javascript" src="main_code.js"></script>
<div id="dati">
</div>
</body>
</html>