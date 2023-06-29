function distance_function(cv1,cv2){
	//funzione costo per il DTW
	var alpha = 1.0;
	var simil = 0.0; //<x,y>
	var dotprod = 0.0;
	var epsilon = 0.00001;
	//calcola dot product tra i due chroma vector
	for(var i = 0;i < 12;i++){
		dotprod = dotprod + (cv1[i]*cv2[i]);
	}
	//dotprod += 0.00001; //EXTRA. serve per evitare divisioni per zero
	//calcolo magnitude del primo chroma vector
	var magnitude1 = 0.0;
	for(var i = 0;i < 12;i++){
		magnitude1 = magnitude1 + (cv1[i]*cv1[i]);
	}
	magnitude1 = Math.sqrt(magnitude1);
	//magnitude1 += 0.001; //EXTRA. serve per evitare divisioni per zero
	//calcolo magnitude del secondo chroma vector
	var magnitude2 = 0.0;
	for(var i = 0;i < 12;i++){
		magnitude2 = magnitude2 + (cv2[i]*cv2[i]);
	}
	magnitude2 = Math.sqrt(magnitude2);
	//magnitude2 += 0.001; //EXTRA. serve per evitare divisioni per zero
	//calcolo finale
	var prod = magnitude1*magnitude2;
	if(prod < epsilon){
		prod = epsilon;
	}
	simil = dotprod/prod;
	
	//simil dovrebbe essere sempre tra 0 e 1, se non lo è dimmelo
	if(simil <= 0 || simil >= 1){
		//console.log("<x,y> è andato fuori");
	}
	
	return 1.0 - simil + alpha;
}