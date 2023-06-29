<?php
	session_start();
	if($_FILES["xmlFileName"]["tmp_name"] == ""){
		$_SESSION["result"] = "noXml";
		header("Location: ./index.php");
		exit;
	}
	if($_FILES["audioFileName"]["tmp_name"] == ""){
		$_SESSION["result"] = "noAudio";
		header("Location: ./index.php");
		exit;
	}
	$extension = strtolower(substr($_FILES["audioFileName"]["name"],strlen($_FILES["audioFileName"]["name"])-4,strlen($_FILES["audioFileName"]["name"])));
	if($extension != ".mp3" && $extension != ".wav"){
		$_SESSION["result"] = "noAudio";
		header("Location: ./index.php");
		exit;
	}
	if (!(move_uploaded_file($_FILES["xmlFileName"]["tmp_name"], "./xml/input.xml"))) {
		$_SESSION["result"] = "errXml";
		header("Location: ./index.php");
		exit;
	}
	if (!(move_uploaded_file($_FILES["audioFileName"]["tmp_name"], "./audio/audiofile"))) {
		$_SESSION["result"] = "errAudio";
		header("Location: ./index.php");
		exit;
	}
	$_SESSION["result"] = "ok";
	$_SESSION["xmlFileName"] = $_FILES["xmlFileName"]["name"];
	$_SESSION["audioFileName"] = $_FILES["audioFileName"]["name"];
	header("Location: ./index.php");
?>