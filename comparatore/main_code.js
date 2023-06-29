var xmlDoc1;
var xmlDoc2;
var xmlUrl1 = "./xml/input1.xml";
var xmlUrl2 = "./xml/input2.xml";
function readXMLs(){
	var xhr1 = new XMLHttpRequest();
	var loaded1 = false;
	var loaded2 = false;
	xhr1.open('GET', xmlUrl1, true);
	xhr1.timeout = 10000; // time in milliseconds
	xhr1.onload = function () {
		// Request finished. Do processing here.
		xmlDoc1 = this.responseXML; // <- Here's your XML file
		loaded1 = true;
		if(loaded1 && loaded2){
			putTracksInSelect();
		}
	};
	xhr1.ontimeout = function (e) {
		alert("This problem occurred while reading the xml file: " + e);	
	};
	xhr1.send(null);
	var xhr2 = new XMLHttpRequest();
	xhr2.open('GET', xmlUrl2, true);
	xhr2.timeout = 10000; // time in milliseconds
	xhr2.onload = function () {
		// Request finished. Do processing here.
		xmlDoc2 = this.responseXML; // <- Here's your XML file
		loaded2 = true;
		if(loaded1 && loaded2){
			putTracksInSelect();
		}
	};
	xhr2.ontimeout = function (e) {
		alert("This problem occurred while reading the xml file: " + e);	
	};
	xhr2.send(null);
	
}
function putTracksInSelect(){
	var tracks1 = xmlDoc1.getElementsByTagName("track");
	var tracks2 = xmlDoc2.getElementsByTagName("track");
	document.getElementById("tracks1").innerHTML = "";
	for(var i = 0;i < tracks1.length;i++){
		var file_name = tracks1[i].getAttribute("file_name");
		document.getElementById("tracks1").innerHTML += "<option value="+i+">"+file_name+"</option>";
	}
	document.getElementById("tracks2").innerHTML = "";
	for(var i = 0;i < tracks2.length;i++){
		var file_name = tracks2[i].getAttribute("file_name");
		document.getElementById("tracks2").innerHTML += "<option value="+i+">"+file_name+"</option>";
	}
}
function go(){
	var sel1 = document.getElementById("tracks1").selectedIndex;
	var sel2 = document.getElementById("tracks2").selectedIndex;
	var track1 = xmlDoc1.getElementsByTagName("track")[sel1];
	var track2 = xmlDoc2.getElementsByTagName("track")[sel2];
	var indexing1 = track1.getElementsByTagName("track_indexing")[0];
	var indexing2 = track2.getElementsByTagName("track_indexing")[0];
	var timings1 = {};
	var timing_init = -1;
	var timing_end = -1;
	var timings_diffs = [];
	var timings_diffs_index = 0;
	timing_end = parseFloat(indexing1.getElementsByTagName("track_event")[indexing1.getElementsByTagName("track_event").length-1].getAttribute("start_time"));
	timing_init = parseFloat(indexing1.getElementsByTagName("track_event")[0].getAttribute("start_time"));
	for(var i = 0;i < indexing1.getElementsByTagName("track_event").length;i++){
		var event_ref = indexing1.getElementsByTagName("track_event")[i].getAttribute("event_ref");
		var t = parseFloat(indexing1.getElementsByTagName("track_event")[i].getAttribute("start_time"));
		if(t != timing_init && t != timing_end){
			timings1[event_ref] = t;
		}
	}
	for(var i = 0;i < indexing2.getElementsByTagName("track_event").length;i++){
		var event_ref = indexing2.getElementsByTagName("track_event")[i].getAttribute("event_ref");
		if(timings1[event_ref] != undefined){
			// se l'evento c'è anche nel timing del primo file xml
			var timing2 = parseFloat(indexing2.getElementsByTagName("track_event")[i].getAttribute("start_time"));
			timings_diffs[timings_diffs_index] = timings1[event_ref] - timing2;
			timings_diffs_index++;
		}
	}
	document.getElementById("dati").innerHTML = "";
	/*
	for(var i = 0;i < timings_diffs.length;i++){
		document.getElementById("dati").innerHTML += timings_diffs[i]+ "<br>";
	}
	*/
	//calcolo media delle differenze
	var avg = 0.0;
	var sum = 0.0;
	for(var i = 0;i < timings_diffs.length;i++){
		sum += timings_diffs[i];
	}
	var avg = sum / (timings_diffs.length + 0.0);
	document.getElementById("dati").innerHTML += "Differenza media in secondi: " + avg;
	//calcolo media dei valori assoluti delle differenze
	var avg2 = 0.0;
	var sum2 = 0.0;
	for(var i = 0;i < timings_diffs.length;i++){
		sum2 += Math.abs(timings_diffs[i]);
	}
	var avg2 = sum2 / (timings_diffs.length + 0.0);
	document.getElementById("dati").innerHTML += "<br>Media dei valori assoluti delle differenze in secondi: " + avg2;
	//calcolo deviazione standard
	std = 0.0;
	sum = 0.0;
	for(var i = 0;i < timings_diffs.length;i++){
		sum += Math.pow(timings_diffs[i] -avg,2);
	}
	std = sum / (timings_diffs.length + 0.0);
	std = Math.sqrt(std);
	document.getElementById("dati").innerHTML += "<br>Deviazione standard delle differenze: " + std;
}