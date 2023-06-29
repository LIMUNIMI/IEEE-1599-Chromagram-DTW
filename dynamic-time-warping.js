// ho scaricato questo e l'ho modificato: https://www.npmjs.com/package/dynamic-time-warping
( function() {
    "use strict";
    function DynamicTimeWarping ( ts1, ts2, distanceFunction ) {
        var ser1 = ts1;
        var ser2 = ts2;
        var distFunc = distanceFunction;
        var distance;
        var matrix; //matrice dei costi
		var path_matrix; //matrice dove ogni cella dice dove spostarsi per il percorso più breve. 0 = orizzontale, 1 = verticale, 2 = diagonale
		var wrong_costs_matrix;
		var wh = 1.0;
		var wv = 1.0;
		var wd = Math.sqrt(2);
        var path; // dice quali celle attraversa la warping path
		//restituisce il costo totale della warping path migliore
        var getDistance = function() {
            if ( distance !== undefined ) {
                return distance;
            }
            matrix = [];
			path_matrix = [];
			wrong_costs_matrix = [];
            for ( var i = 0; i < ser1.length; i++ ) {
                matrix[ i ] = [];
				path_matrix[i] = [];
				wrong_costs_matrix[i] = [];
                for ( var j = 0; j < ser2.length; j++ ) {
					var c = distFunc(ser1[i], ser2[j]);
					wrong_costs_matrix[i][j] = (c < 0.99 || c > 2.01);
					if(i == 0 && j == 0){
						matrix[i][j] = c;
						path_matrix[i][j] = -1;
					}else if(i > 0 && j == 0){
						matrix[i][j] = matrix[i-1][j] + wh*c;
						path_matrix[i][j] = 0;
					}else if(j > 0 && i == 0){
						matrix[i][j] = matrix[i][j-1] + wv*c;
						path_matrix[i][j] = 1;
					}else{
						var h = matrix[i-1][j] + wh*c;
						var v = matrix[i][j-1] + wv*c;
						var d = matrix[i-1][j-1] + wd*c;
						var min = Math.min(v,d,h);
						if(min == d){
							matrix[i][j] = d;
							path_matrix[i][j] = 2;
						}else if(min == h){
							matrix[i][j] = h;
							path_matrix[i][j] = 0;
						}else if(min == v){
							matrix[i][j] = v;
							path_matrix[i][j] = 1;
						}
					}
                }
            }
            return matrix[ ser1.length - 1 ][ ser2.length - 1 ];
        };

        this.getDistance = getDistance;
		//leggendo path_matrix, restituisce tutte le celle attraversate dalla warping path migliore
        var getPath = function() {
            if ( path !== undefined ) {
                return path;
            }
            if ( matrix === undefined ) {
                getDistance();
            }
            var i = ser1.length - 1;
            var j = ser2.length - 1;
            path = [];			
			while(i > 0 || j > 0){
				path.push([i,j]);
				if(path_matrix[i][j] == 2){
					i--;
					j--;
				}else if(path_matrix[i][j] == 1){
					j--;
				}else if(path_matrix[i][j] == 0){
					i--;
				}else if(path_matrix[i][j] == -1){
					//finito!
				}
			}
			path.push([0,0]);
            path = path.reverse();

            return path;
        };

        this.getPath = getPath;
		var getwrong_costs_matrix = function(){
			return wrong_costs_matrix;
		};
		this.getwrong_costs_matrix = getwrong_costs_matrix;
    }

    var root = typeof self === "object" && self.self === self && self ||
        typeof global === "object" && global.global === global && global ||
        this;

    if ( typeof exports !== "undefined" && !exports.nodeType ) {
        if ( typeof module !== "undefined" && !module.nodeType && module.exports ) {
            exports = module.exports = DynamicTimeWarping;
        }
        exports.DynamicTimeWarping = DynamicTimeWarping;
    } else {
        root.DynamicTimeWarping = DynamicTimeWarping;
    }

    if ( typeof define === "function" && define.amd ) {
        define( "dynamic-time-warping", [], function() {
            return DynamicTimeWarping;
        } );
    }
}() );