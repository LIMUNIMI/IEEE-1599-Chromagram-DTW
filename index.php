<!DOCTYPE html>
<?php
session_start();
?>
<html xmlns="http://www.w3.org/1999/html">
<head>
	<meta charset="UTF-8">
    <title>Automatic audio and score synchronization</title>
</head>
<body style="background-color: white;">
<h2>Automatic audio and score synchronization</h2>
<p>Upload an IEEE1599 xml document</p>
<form action="./upload_xml_audio.php" method="post" enctype="multipart/form-data">
	<input type="file" id="myXMLFile" name="xmlFileName" accept=".xml"></input>
<p>Upload the audio track to be synchronized with the score</p>
	<input type="file" id="myAudioFile" name="audioFileName" accept=".mp3,.wav"></input>
	<input type="submit">
</form>
<p id="uploaded_files">No files uploaded</p>
<input id="quarter_vtu" type="number" placeholder="Quarter note duration in VTU"></input>
<input id="transpose" type="number" placeholder="Score transposition in semitones"></input>
<br>
<div>
<p>Mode</p>
<input type="radio" onclick="modeOverwrite();" id="overwritesync" name="sync" value="overwritesync"></input>
<label for="overwtitesync">Synchronize existing track</label><br>
<br>
<input type="radio" onclick="modeNew();" id="newsync" name="sync" value="newsync" checked></input>
<label for="newsync">Synchronize new track</label><br>
<p>Existing track to be synchronized</p>
<select id="tracks" name="tracks" disabled></select>
<p>Audio files folder name</p>
<input id="audio_folder" type="text" name="audio_folder" value="audio_files"></input>
</div>
<br>
<button id="gobutton" onclick="startBeatTracking();" disabled>Start</button>
<button id="download_button" onclick="saveXML();" disabled>Download new xml file</button>
<p id="messages"></p>
<canvas id="audioCanvas"></canvas> 
<canvas id="scoreCanvas"></canvas> 
<canvas id="pathCanvas"></canvas> 
<script type="text/javascript" src="jquery-1.8.0.min.js"></script>
<script type="text/javascript" src="dynamic-time-warping.js"></script>
<script type="text/javascript" src="distance_function.js"></script>
<script type="text/javascript" src="main_code.js"></script>
<?php
if(isset($_SESSION["result"])){
	switch($_SESSION["result"]){
		case "noXml":
			echo "<script type=\"text/javascript\">alert(\"Upload an IEEE1599 xml file to continue.\");</script>";
		break;
		case "noAudio":
			echo "<script type=\"text/javascript\">alert(\"Upload an MP3 or WAV audio file to continue.\");</script>";
		break;
		case "errXml":
			echo "<script type=\"text/javascript\">alert(\"A problem occurred while uploading xml file.\");</script>";
		break;
		case "errAudio":
			echo "<script type=\"text/javascript\">alert(\"A problem occurred while uploading audio file.\");</script>";
		break;
		case "ok":
			echo "<script type=\"text/javascript\">alert(\"Files have been uploaded correctly.\");</script>";
			echo "<script type=\"text/javascript\">uploadsOk = true;readXMLfile();</script>";
			echo "<script type=\"text/javascript\">showFileNames(\"".$_SESSION["xmlFileName"]."\",\"".$_SESSION["audioFileName"]."\");</script>";
		break;
	}
	unset($_SESSION["result"]);
}
?>
</body>
</html>