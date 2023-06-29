<?php
	session_start();
	move_uploaded_file($_FILES["XML1"]["tmp_name"], "./xml/input1.xml");
	move_uploaded_file($_FILES["XML2"]["tmp_name"], "./xml/input2.xml");
	header("Location: ./index.php");
	exit;
?>