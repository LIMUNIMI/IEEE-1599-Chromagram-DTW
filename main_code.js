	//variabili globali
	var quarter_vtu = 0; // a quanti vtu corrisponde il battito da un quarto
	var transpose = 0; //trasposizione in semitoni del cromagramma calcolato dalla partitura. Da usare solo se le tonalità non sono uguali
	var trackIndex = 0; //la traccia dove sovrascrivere tutti i track indexings
	var showFeatures = true;
	var uploadsOk = false;
	var xmlFileName = "";
	var audioFileName = "";
	var overwrite = false; //dice se l'utente vuole sincronizzare una traccia esistente
	var dtw; //oggetto di tipo DTW per estrarre wPath
	var messages = document.getElementById("messages"); //riferimento alla label dei messaggi
	var wPath; // le celle della matrice attraversate dalla warping path
	var vtu_per_vector; //quanti vtu copre un chroma vector
	var wpi = 0; //indice dove leggere sull'array wPath
	var bounds = [38,4000]; // banda in Hz entro cui calcolare il cromagramma (era 76, adesso 38 perchè e raddoppiata la frequenza di campionamento, da 8192 a 4096)
	var windowSize = 4096; //era 8192
	var url = "./audio/audiofile"; //url del file audio
	var xmlUrl = "./xml/input.xml"; // url del file xml
	var f;     // Vettore contenente le frequenze in Hz
	var scale = 10; //quanto devono essere grandi i disegni dei cromagrammi
	var pc;    // Vettore di Pitch class corrispondenti ad ogni frequenza
	var fft32; // Vettore contenente il risultato della FFT
	var chvecs = []; // tutti i chroma vectors dall'audio
	var xmlDoc; //tutto il documento xml IEEE1599 ottenuto dal'XML parser
	var chvecs_score = []; // vettore contenente tutti i chroma vectors della partitura
	var sampleRate = 0;
	var num_vectors = 0; //numero di chroma vectors per i due cromagrammi
	var eps = 0.0001; // Epsilon per evitare divisioni per zero
	var isPlaying = true; //è true se l'audio è ancora in rendering, false altrimenti
	//oggetti web audio api
	var context;
	var audioBuffer; //è dentro il sourceNode
    var sourceNode;
    var analyser;
    var javascriptNode;
	//fine variabili globali
	//questo IF devo capire cosa fa esattamente, chiedere a Presti
    if (! window.AudioContext) {
        if (! window.webkitAudioContext) {
            alert('no audiocontext found');
        }
        window.AudioContext = window.webkitAudioContext;
    }
	document.getElementById("gobutton").disabled = false;
	//da qui in poi, solo funzioni
	//funzione chiamata quando si clicca sul pulsante vai. Fa partire tutto
	function startBeatTracking(){
		if(!uploadsOk){
			alert("Upload files correctly before you can continue. You need an IEEE1599 xml file and an audio MP3 or WAV file.");
		}else if(parseInt(document.getElementById("quarter_vtu").value) < 1 || document.getElementById("quarter_vtu").value == ""){
			alert("Insert a positive whole number in the field \"Quarter note duration in VTU\"");
		}else if(document.getElementById("transpose").value == ""){
			alert("You haven't specified the score transposition. If the key of the score and the audio is the same, then insert 0.");
		}else{
			overwrite = document.getElementById("overwritesync").checked;
			calcContextParams();
		}
	}
	//
	function modeNew(){
		document.getElementById("audio_folder").disabled = false;
		document.getElementById("tracks").disabled = true;
	}
	//
	function modeOverwrite(){
		document.getElementById("audio_folder").disabled = true;
		document.getElementById("tracks").disabled = false;
	}
	function showFileNames(xml_file,audio_file){
		xmlFileName = xml_file;
		audioFileName = audio_file;
		document.getElementById("uploaded_files").innerHTML = "IEEE1599 xml file: " + xml_file + " Audio file: " + audio_file;
		//alert("File xml: " + xml + " File audio: " + audio);
	}
	//scrivi un messaggio sulla label
	function message(str){
		messages.innerHTML = str;
	}
	//carica l'audio su un AudioContext (non offline) per avere i parametri giusti per inizializzare l'OfflineAudioContext
	function calcContextParams(){
		var livecontext = new AudioContext();
		var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        // When loaded decode the data
        request.onload = function() {
            // decode the data
            livecontext.decodeAudioData(request.response, function(buffer) {
                initOfflineContext(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
				sampleRate = buffer.sampleRate;
            }, onError);
        }
        request.send();
	}
	//inizializza l'OfflineAudioContext, usato per calcolare il cromagramma dall'audio
    function initOfflineContext(channels,length,sampleRate){
		context = new OfflineAudioContext(channels,length,sampleRate);
		// load the sound
		setupAudioNodes();
		loadAndPlaySound();
	}
	//setup di tutti gli oggetti delle web audio api
	function setupAudioNodes() {
        javascriptNode = context.createScriptProcessor(windowSize, 1, 1);
        javascriptNode.connect(context.destination);
        analyser = context.createAnalyser();
		analyser.smoothingTimeConstant = 0.0;
        analyser.fftSize = windowSize;
        sourceNode = context.createBufferSource();
        sourceNode.connect(analyser);
        analyser.connect(javascriptNode);
		javascriptNode.onaudioprocess = function() {
			//finchè l'audio è in rendering, calcola i chroma vector
			if(isPlaying){
				audioChromaVector();
			}
		}
        sourceNode.connect(context.destination);
		sourceNode.addEventListener("ended", () => {
			isPlaying = false;
			if(showFeatures){
				drawAudioCanvas(scale);
			}
			continueCalcs();
		});
		var sr = context.sampleRate;
		fft32 =  new Float32Array(analyser.frequencyBinCount);
		f  = new Float32Array(analyser.frequencyBinCount);
		pc = new Int16Array(analyser.frequencyBinCount);
		for (var i = 0; i<analyser.frequencyBinCount; i++) {
			f[i]  = i * sr/(2*analyser.frequencyBinCount); // Frequency in Hz
			pc[i] = Math.round(12 * Math.log2(f[i]/440) + 69) % 12; // Pitch class
		}
    }
	//carica l'audio nell'OfflineAudioContext e fa partire il rendering per calcolare il cromagramma
    function loadAndPlaySound() {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // When loaded decode the data
        request.onload = function() {

            // decode the data
            context.decodeAudioData(request.response, function(buffer) {
                // when the audio is decoded play the sound
				sourceNode.buffer = buffer;
				sourceNode.start();
				context.startRendering();
				message("Sound uploaded from the audio file. Starting chromagram calculation");
            }, onError);
        }
        request.send();
    }
	//in caso di errore con il file audio...
    function onError(e) {
        alert("This problem occurred while reading the audio file: " + e);
    }
	
	//calcola un singolo chroma vector dall'audio
	function audioChromaVector() {
		//chiedi ad analyser la fft
		analyser.getFloatFrequencyData(fft32);
		//converti i valori da db ad ampiezza
		for (var i = 0; i<analyser.frequencyBinCount; i++) {
			fft32[i] = Math.pow(10,fft32[i]/20);
		}
		//calcola il vettore chroma
		var chvec = new Float32Array(12); // singolo chroma vector dall'audio
		chvec.fill(0);
		for (var i = 1; i<analyser.frequencyBinCount-1; i++) {
			var inRange = f[i] > bounds[0] && f[i] < bounds[1];
			var peak = fft32[i] > fft32[i+1] && fft32[i] > fft32[i-1];
			if (inRange && peak) {
				chvec[pc[i]] = chvec[pc[i]] + fft32[i]; 
			}
		}
		//normalizzalo
		var max = 0;
		for (var i = 0; i<12; i++) {
			max = Math.max(chvec[i],max);
		}
		for (var i = 0; i<12; i++) {
			chvec[i] = chvec[i]/(max+eps);
		}
		//inseriscilo nel cromagramma
		var chvecnow = new Float32Array(12);
		for(var i = 0;i < 12;i++){
			chvecnow[i] = chvec[i];
		}
		chvecs[num_vectors] = chvecnow;
		num_vectors++
	}
	
    
	
	//carica il file xml e controlla che sia IEEE1599 e che sia valido
	function readXMLfile(){
		var xhr = new XMLHttpRequest();
		xhr.open('GET', xmlUrl, true);
		xhr.timeout = 10000; // time in milliseconds
		xhr.onload = function () {
			// Request finished. Do processing here.
			xmlDoc = this.responseXML; // <- Here's your XML file
			checkIEEE1599();
		};
		xhr.ontimeout = function (e) {
			alert("This problem occurred while reading the xml file: " + e)
			
		};
		xhr.send(null);
	}
	//controlla che il file xml sia IEEE1599. Se non lo è, uploadsOk diventa false!
	function checkIEEE1599(){
		if(xmlDoc.getElementsByTagName("ieee1599").length != 1){
			alert("The uploaded xml file is not an IEEE1599 document!");
			uploadsOk = false;
		}else{
			putTracksInSelect();
		}
	}
	//inserisce le tracce nella select
	function putTracksInSelect(){
		document.getElementById("tracks").innerHTML = "";
		for(var i = 0;i < xmlDoc.getElementsByTagName("track").length;i++){
			var file_name = xmlDoc.getElementsByTagName("track")[i].getAttribute("file_name");
			document.getElementById("tracks").innerHTML += "<option value="+i+">"+getNameFromFileName(file_name)+"</option>";
		}
	}
	//dal file_name completo con estensione e percorso, restituisce solo il nome
	function getNameFromFileName(file_name){
		var end_index = -1;
		var start_index = 0;
		for(var i = file_name.length-1;i >= 0;i--){
			if(end_index == -1 && file_name.charAt(i) == '.'){
				end_index = i;
			}
			if(end_index != -1 && (file_name.charAt(i) == '/' || file_name.charAt(i) == '\\')){
				start_index = i+1;
			}
		}
		return file_name.substring(start_index,end_index);
	}
	//calcola il cromagramma dalla partitura
	function chromaFromScore(){
		quarter_vtu = parseInt(document.getElementById("quarter_vtu").value);
		//prepara la matrice per contenere il cromagramma
		for(var i = 0;i < num_vectors;i++){
			var chvec_score = new Float32Array(12);
			chvec_score.fill(0);
			chvecs_score[i] = chvec_score;
		}
		// calcola i timing di tutti gli eventi
		var timings = {}; //contiene i timing in vtu di ogni evento
		var spine = xmlDoc.getElementsByTagName("spine")[0];
		var sum_timing = 0;
		var event;
		for(var i = 0;i < spine.getElementsByTagName("event").length;i++){
			event = spine.getElementsByTagName("event")[i];
			var timing = parseInt(event.getAttribute("timing"));
			sum_timing = sum_timing + timing;
			var id = event.getAttribute("id");
			timings[id] = sum_timing;
		}
		//trova la durata in vtu di tutto il brano
		var el_dur = getElementDuration(findEvent(event.getAttribute("id")));
		var vtu_last = (quarter_vtu * el_dur * 4);
		sum_timing += vtu_last;
		//prepara la struttura dati per contenere i vtu di inizio e di fine dei vari chroma
		var chromas_vtus = [];
		for(var i = 0;i < 12;i++){
			chromas_vtus[i] = [];
			chromas_vtus[i][0] = [0,false]; //false perchè è vtu di fine
			chromas_vtus[i][1] = [sum_timing+1,true]; //true perchè è vtu di inizio
		}
		//da qui in poi prendi il codice perchè è la parte più significativa
		vtu_per_vector = (sum_timing+0.0)/(num_vectors+0.0); //dice quanti vtu ci sono in un chroma vector
		var chords = xmlDoc.getElementsByTagName("chord");
		transpose = parseInt(document.getElementById("transpose").value);
		for(var i = 0;i < chords.length;i++){ //ripeti per ogni accordo
			var chord = chords[i];
			var timing_start = timings[chord.getAttribute("event_ref")];
			var dur = getElementDuration(chord);
			var timing_end = timing_start + (quarter_vtu * dur * 4);
			var pitches = chord.getElementsByTagName("pitch");
			for(var j = 0; j < pitches.length;j++){ //ripeti per ogni nota trovata nell'accordo
				var pitch_obj = pitches[j];
				var chroma = 0;
				var chroma = getChromaFromPitch(pitch_obj,transpose);
				if(chroma == -1){
					continue;
				}
				var cv_inizio = insertIntoChromasVtus(chromas_vtus[chroma],timing_start,true);
				var cv_fine = insertIntoChromasVtus(chromas_vtus[chroma],timing_end,false);
				var dist = deleteBetween(chromas_vtus[chroma],cv_inizio,cv_fine);
				cv_fine = cv_fine - dist;
				if(chromas_vtus[chroma][cv_inizio-1][1] == true){
					deleteFrom(chromas_vtus[chroma],cv_inizio);
					cv_fine--;
				}
				if(cv_fine+1 < chromas_vtus[chroma].length && chromas_vtus[chroma][cv_fine+1][1] == false){
					deleteFrom(chromas_vtus[chroma],cv_fine);
				}
			}
		}
		for(var chroma = 0;chroma < 12;chroma++){
			var j = 1;
			while(j < chromas_vtus[chroma].length-1){
				var flag1 = chromas_vtus[chroma][j];
				j++;
				var flag2 = chromas_vtus[chroma][j];
				insertIntoChvecsScore(flag1[0],flag2[0],chroma);
				j++;
			}
		}
	}
	function insertIntoChvecsScore(timing_start,timing_end,chroma){
		var timing_start_vector = (timing_start+0.0) / (vtu_per_vector+0.0); //chroma vector in cui inizia l'accordo
		var timing_end_vector = (timing_end+0.0) / (vtu_per_vector+0.0); //chroma vector in cui finisce l'accordo
		var timing_start_vector_int = parseInt(timing_start_vector);
		var timing_end_vector_int = parseInt(timing_end_vector);
		var reduce_start = timing_start_vector - timing_start_vector_int;
		var reduce_end = timing_end_vector_int + 1 - timing_end_vector;
		for(var k = timing_start_vector_int;k <= timing_end_vector_int && k < num_vectors;k++){
			chvecs_score[k][chroma] = chvecs_score[k][chroma] + 1;
		}
		if(timing_start_vector_int < num_vectors){
			chvecs_score[timing_start_vector_int][chroma] -= reduce_start;
		}
		if(timing_end_vector_int < num_vectors){
			chvecs_score[timing_end_vector_int][chroma] -= reduce_end;
		}
	}
	
	function deleteFrom(array,index){
		for(var i = index;i < array.length-1;i++){
			array[i] = array[i+1];
		}
		array.length--;
	}
	function deleteBetween(array,index1,index2){
		var dist = (index2 - index1 - 1); // quanti flag ci sono tra quello di inizio e quello di fine appena inseriti
		if(dist > 0){
			for(var cv = index1+1;cv < array.length - dist;cv++){
				array[cv] = array[cv + dist];
			}
			array.length = array.length - dist;
		}
		return dist;
	}
	function insertIntoChromasVtus(array,vtu,isStart){
		var index = 0;
		for(;index < array.length;index++){
			if(array[index][0] > vtu){
				break;
			}
		}
		for(var cv = array.length;cv > index;cv--){
			array[cv] = array[cv-1];
		}
		array[index] = [vtu,isStart];
		return index;
	}
	function getChromaFromPitch(pitch_obj,transpose){
		var chroma = 0;
		switch(pitch_obj.getAttribute("step")){ //nome
				case "none":
					return -1;
				case "C":
					chroma = 0;
				break;
				case "D":
					chroma = 2;
				break;
				case "E":
					chroma = 4;
				break;
				case "F":
					chroma = 5;
				break;
				case "G":
					chroma = 7;
				break;
				case "A":
					chroma = 9;
				break;
				case "B":
					chroma = 11;
				break;
			}
			switch(pitch_obj.getAttribute("actual_accidental")){ // alterazione
				case "sharp":
					chroma++;
				break;
				case "double_sharp":
					chroma+=2;
				break;
				case "flat":
					chroma--;
				break;
				case "double_flat":
					chroma-=2;
				break;
				case "natural":
				break;
			}
			//gestisci la trasposizione
			chroma += transpose;
			while(chroma >= 12){
				chroma -= 12;
			}
			while(chroma < 0){
				chroma += 12;
			}
		return chroma;
	}
	function findEvent(id){
		//cerca tra tutti i chord e i rest quello che fa riferimento a questo id e restituiscilo
		for(var i = 0;i < xmlDoc.getElementsByTagName("chord").length;i++){
			if(xmlDoc.getElementsByTagName("chord")[i].getAttribute("event_ref") == id){
				return xmlDoc.getElementsByTagName("chord")[i];
			}
		}
		for(var i = 0;i < xmlDoc.getElementsByTagName("rest").length;i++){
			if(xmlDoc.getElementsByTagName("rest")[i].getAttribute("event_ref") == id){
				return xmlDoc.getElementsByTagName("rest")[i];
			}	
		}
	}
	function getElementDuration(element){
		var duration = element.getElementsByTagName("duration")[0];
			var num = parseInt(duration.getAttribute("num")); // num e den per la durata
			var den = parseInt(duration.getAttribute("den"));
			var dots = 0;
			//controlla se ci sono i punti per l'aumento della durata
			if(element.getElementsByTagName("augmentation_dots").length == 1){
				dots = parseInt(element.getElementsByTagName("augmentation_dots")[0].getAttribute("number"));
			}
			var dur = getDecDuration(num,den,dots);
			//considera ora i tuplet ratio
			for(var j = 0;j < duration.getElementsByTagName("tuplet_ratio").length;j++){
				var tr = duration.getElementsByTagName("tuplet_ratio")[j];
				var in_num = parseInt(tr.getAttribute("in_num"));
				var in_den = parseInt(tr.getAttribute("in_den"));
				var in_dots = parseInt(tr.getAttribute("in_dots"));
				var enter_num = parseInt(tr.getAttribute("enter_num"));
				var enter_den = parseInt(tr.getAttribute("enter_den"));
				var enter_dots = parseInt(tr.getAttribute("enter_dots"));
				dur = dur * (getDecDuration(in_num, in_den, in_dots) / getDecDuration(enter_num, enter_den,enter_dots));
			}
		return dur;
	}
	//restituisce la durata di una nota come numero decimale, tenendo conto degli eventuali punti (augmentation dots)
	function getDecDuration(num,den,dots){
		var dur = (num+0.0)/(den+0.0);
		if(!isNaN(dots) && dots >= 1){
			dur = dur*2.0;
			dur = dur - (dur*(1.0/Math.pow(2,dots+1.0)));
		}
		return dur;
	}
	//disegna il cromagramma estratto dall'audio
	function drawAudioCanvas(scale){
		var canvas = document.getElementById("audioCanvas");
		var ctx = canvas.getContext("2d");
		ctx.canvas.width = num_vectors * scale;
		ctx.canvas.height = 12 * scale;
		
		for(var y = 0;y < 12;y++){
			for(var x = 0;x < num_vectors;x++){
				ctx.fillStyle = "rgba("+Math.floor(255*chvecs[x][y])+", "+ Math.floor(255*chvecs[x][y])+", "+ Math.floor(255*chvecs[x][y])+", 1)";
				ctx.fillRect(x*scale, y*scale, scale, scale);
			}
		}
	}
	//disegna il cromagramma estratto dalla partitura
	function drawScoreCanvas(scale){
		var canvas = document.getElementById("scoreCanvas");
		var ctx = canvas.getContext("2d");
		ctx.canvas.width = num_vectors * scale;
		ctx.canvas.height = 12 * scale;
		for(var y = 0;y < 12;y++){
			for(var x = 0;x < num_vectors;x++){
				if(chvecs_score[x][y] > 1){
					console.log("Un chvec è andato fuori: " + chvecs_score[x][y]);
				}
				ctx.fillStyle = "rgba("+Math.floor(255*chvecs_score[x][y])+", "+ Math.floor(255*chvecs_score[x][y])+", "+ Math.floor(255*chvecs_score[x][y])+", 1)";
				
				ctx.fillRect(x*scale, y*scale, scale, scale);
			}
		}
		
	}
	//disegna la warping path
	function drawPathCanvas(){
		var canvas = document.getElementById("pathCanvas");
		var ctx = canvas.getContext("2d");
		var wcm = dtw.getwrong_costs_matrix();
		ctx.canvas.width = num_vectors;
		ctx.canvas.height = num_vectors;
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,num_vectors,num_vectors);
		ctx.fillStyle = "#ffffff";
			for(var i = 0;i < wPath.length;i++){
				ctx.fillRect(wPath[i][0], wPath[i][1], 1, 1);
			}
		ctx.fillStyle = "#ff0000";
		for(var i = 0;i < num_vectors;i++){
			for(var j = 0;j < num_vectors;j++){
				if(wcm[i][j] == true){
					ctx.fillRect(i, j, 1, 1);
				}
			}
		}
	}
	// funzione chiamata dal bottone DTW
	function continueCalcs(){
		chromaFromScore();
		if(showFeatures){
			drawScoreCanvas(scale);
		}
		message("Calculating DTW");
		calcDTW();
		if(showFeatures){
			drawPathCanvas();
		}
		message("Calculating track indexing");
		calcTrackIndexing();
		message("Saving xml file");
		document.getElementById("download_button").disabled = false;
		message("Your IEEE1599 xml file is ready. Click the button to download it.");
	}	
	//crea un oggetto DTW e calcola il DTW
	function calcDTW(){
		dtw = new DynamicTimeWarping( chvecs, chvecs_score, distance_function);
		wPath = dtw.getPath();
	}
	function calcTrackIndexing(){
		//calcola il track indexing su tutti gli eventi e scrivi il risultato dentro xmlDoc
		//seleziona la track giusta
		var track;
		if(overwrite){
			//sovrascrivi sincronizzazione (togli quella vecchia, metti quella nuova)
			trackIndex = document.getElementById("tracks").selectedIndex;
			for(var i = 0;i < xmlDoc.getElementsByTagName("track").length;i++){
				if(i == trackIndex){
					track = xmlDoc.getElementsByTagName("track")[i];
					break;
				}
			}
			//cancella i tap
			track.removeChild(track.getElementsByTagName("track_indexing")[0]);
		}else{
			//crea nuova traccia e inserisci sincronizzazione
			track = xmlDoc.createElement("track");
			var audio;
			if(xmlDoc.getElementsByTagName("audio").length == 1){
				audio = xmlDoc.getElementsByTagName("audio")[0];
			}else{
				var ieee1599 = xmlDoc.getElementsByTagName("ieee1599")[0];
				audio = xmlDoc.createElement("audio");
				ieee1599.appendChild(audio);
			}
			audio.appendChild(track);
			track.setAttribute("file_name",document.getElementById("audio_folder").value+"/"+audioFileName);
			var extension = audioFileName.substring(audioFileName.length - 4,audioFileName.length);
			extension = extension.toLowerCase();
			if(extension == ".mp3"){
				track.setAttribute("file_format","audio_mp3");
				track.setAttribute("encoding_format","audio_mp3");
			}else if(extension == ".wav"){
				track.setAttribute("file_format","audio_wav");
				track.setAttribute("encoding_format","audio_wav");
			}
			
		}
		//calcola il nuovo track indexing e scrivilo in xmlDoc
		var track_indexing = xmlDoc.createElement("track_indexing");
		track.appendChild(track_indexing);
		track_indexing.setAttribute("timing_type","seconds");
		var spine = xmlDoc.getElementsByTagName("spine")[0];
		var curTiming = 0;
		for(var i = 0;i < spine.getElementsByTagName("event").length;i++){
			//ripeti per ogni evento
			var event = spine.getElementsByTagName("event")[i];
			curTiming = curTiming + parseInt(event.getAttribute("timing"));
			var seconds = vtuToSeconds(curTiming);
			var track_event = xmlDoc.createElement("track_event");
			track_event.setAttribute("event_ref",event.getAttribute("id"));
			track_event.setAttribute("start_time",seconds);
			track_indexing.appendChild(track_event);
		}
	}
	//salva xmlDoc in un file xml, che nella pagina definitiva dovrà essere scaricato
	function saveXML(){
		var ser = new XMLSerializer();
		var toSave = ser.serializeToString(xmlDoc);
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if(xhr.readyState==4 && xhr.status==200){
				console.log( xhr.responseText );
				window.location.href = "output.xml";
			}
		};
		xhr.open("POST", "./downloadXML.php", false);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.send("xmldata="+toSave);
	}
	// converte i vtu in secondi leggendo la warping path
	function vtuToSeconds(vtuTiming){
		var vector = (vtuTiming+0.0)/vtu_per_vector; // dice a quale chroma vector corrisponde quel timing
		while(wPath[wpi][1] <= vector && wpi < wPath.length-1){
			wpi++;
		}
		var vector_dec = vector - wPath[wpi-1][1];
		var sampleIndex = windowSize * (wPath[wpi-1][0] + ((wPath[wpi][0] - wPath[wpi-1][0]) * vector_dec));
		var seconds = sampleIndex / sampleRate;
		return seconds;
	}