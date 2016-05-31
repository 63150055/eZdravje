var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Kreiraj nov EHR zapis za pacienta in dodaj osnovne demografske podatke.
 * V primeru uspešne akcije izpiši sporočilo s pridobljenim EHR ID, sicer
 * izpiši napako.
 */
function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();
	var spol = $("#kreirajSpol").val();
	var prehrana=$("#kreirajPrehranskeNavade").val();
	console.log("prehrana ena "+prehrana);
	
	if (!spol || !ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0 || spol.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        console.log("prehrana dve "+prehrana);
		        var partyData = {
		        	gender:spol,
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId},{key: "prehrana", value: prehrana}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}


/**
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 
function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>Bolnik '" + party.firstNames + " " +
          party.lastNames + "', ki se je rodil '" + party.dateOfBirth +party.gander+
          "'.</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
	}
}
*/

/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		};

		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>" +
              res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}


/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura, filtriranje telesne temperature in telesna teža).
 * Filtriranje telesne temperature je izvedena z AQL poizvedbo, ki se uporablja
 * za napredno iskanje po zdravstvenih podatkih.
 */
function preberiMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				var spol = party.gender;
				var rojstvo = party.dateOfBirth;
				//var visine=[];
                //var datumi=[];
                //var teze = [];
                //var dolzine;
                //var itm;
                var prehrana= party.partyAdditionalInfo[1].value;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
          "podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><br/><br/>");
//////////////////////////za izracun statistike
				//console.log("prej:"+visine+teze);
					$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "height",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	var visine=[];
                			var datumi=[];
                			var teze = [];
                			var dolzine;
                			var graf_visina=false;
                			var graf_teza=false;
                			var zenska = false;
					    	if (res.length > 0) {
						        for (var i in res) {
                          			visine.push(res[i].height);
                          			datumi.push(res[i].time);
                          			dolzine=res.length;
						        	}
					    		}
					    	$.ajax({
	  					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
						    type: 'GET',
						    headers: {"Ehr-Session": sessionId},
						    success: function (res) {
						    	if (res.length > 0) {
							        for (var i in res) {
							        	teze.push(res[i].weight);
	                          			console.log("teze: "+res[i].weight);
							        }
						    	}
						    	if(tip=="telesna visina")graf_visina=true;
						    	else graf_teza=true;
						    	if(spol=="FEMALE")zenska=true;
						    	var itm = izracunStatistike(rojstvo,visine,teze,datumi,prehrana,dolzine);
						    	narisiGrafe(visine,teze,datumi,res.length,zenska,graf_visina,graf_teza,itm);
						    }
						    
							});} 
							
						});
///////////////////////////////////////////////          		
				if (tip == "telesna visina") {
					$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "height",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna visina</th></tr>";
                    			//var zenska=false;
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].height +
                          " " + res[i].unit + "</td>";
                          			//visine.push(res[i].height);
									//datumi.push(res[i].time);
									if(spol=="FEMALE")zenska=true;
						        }
						        //console.log("tu bom dal"+itm)
						        //narisiGrafe(visine,false,datumi,res.length,zenska);
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna teža</th></tr>";
                    			//var zenska=false;
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].weight + " " 	+
                          res[i].unit + "</td>";
                          			//teze.push(res[i].weight);
									//datumi.push(res[i].time);
									//console.log()
									//if(spol=="FEMALE")zenska=true;
						        }
                    			//narisiGrafe(false,teze,datumi,res.length,zenska);
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
	    	}
	    	
		});
		
	}
}


$(document).ready(function() {

  /**
   * Napolni testne vrednosti (ime, priimek in datum rojstva) pri kreiranju
   * EHR zapisa za novega bolnika, ko uporabnik izbere vrednost iz
   * padajočega menuja (npr. Pujsa Pepa).
   */
  $('#preberiPredlogoBolnika').change(function() {
    $("#kreirajSporocilo").html("");
    var podatki = $(this).val().split(",");
    $("#kreirajSpol").val(podatki[1]);
    $("#kreirajPrehranskeNavade").val(podatki[0]);
    $("#kreirajIme").val(podatki[2]);
    $("#kreirajPriimek").val(podatki[3]);
    $("#kreirajDatumRojstva").val(podatki[4]);
  });

  /**
   * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   * ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
   */
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

  /**
   * Napolni testne vrednosti (EHR ID, datum in ura, telesna višina,
   * telesna teža, telesna temperatura, sistolični in diastolični krvni tlak,
   * nasičenost krvi s kisikom in merilec) pri vnosu meritve vitalnih znakov
   * bolnika, ko uporabnik izbere vrednosti iz padajočega menuja (npr. Ata Smrk)
   */
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);

	});

  /**
   * Napolni testni EHR ID pri pregledu meritev vitalnih znakov obstoječega
   * bolnika, ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Ata Smrk, Pujsa Pepa)
   */
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});

});

// --- GRAF ---
var narisiGrafe = function (visine,teze,datumi,dolzina_podatkov,zenska,graf_visina,graf_teza,itm) {
		var graf_1=[];
		var naslov="";
		var opis="";
		if(graf_visina==false){
			naslov="Telesna teza";
			opis="Teza v kilogramih";
			for(var i = 0; i < dolzina_podatkov;i++){
			var y=datumi[i].substring(0,4);
			var d=datumi[i].substring(5,7);
			var m=datumi[i].substring(8,10);
			graf_1.push({x: new Date(y, d, m), y: teze[i]});	
			}
		}
		else{
			naslov="Telesna visina";
			opis="Visina v metrih";
			for(var i = 0; i < dolzina_podatkov;i++){
			var y=datumi[i].substring(0,4);
			var d=datumi[i].substring(5,7);
			var m=datumi[i].substring(8,10);
			graf_1.push({x: new Date(y, d, m), y: visine[i]});	
			}	
		}
		
		
		var chart = new CanvasJS.Chart("grafTelesneTeze",
		{
			title:{
				text: naslov,
				fontSize: 30
			},
                        animationEnabled: true,
			axisX:{

				gridColor: "Silver",
				tickColor: "silver",
				valueFormatString: "DD/MMM/YY"

			},                        
                        toolTip:{
                          shared:true
                        },
			theme: "theme3",
			axisY: {
				gridColor: "Silver",
				tickColor: "silver"
			},
			legend:{
				verticalAlign: "center",
				horizontalAlign: "right"
			},
			data: [
			{        
				type: "line",
				showInLegend: false,
				name: opis,
				lineThickness: 2,
				markerType: "square",
				color: "#F08080",
				dataPoints: graf_1
			}

			
			],
		});
		chart.render();

		var podhr="";
		var normalno="";
		var srednje="";
		var debeli="";
		if(itm<=18.49){podhr="X";}
		else if(itm<=24.99){normalno="X";}
		else if(itm<=29.99)srednje="X";
		else if(itm>=30)debeli="X";
		console.log(itm);
		if(zenska==true){
			var naslov="Povprecni ITM v Sloveniji (zenske)"
			var graf_2=[
				{ y: 4, label: "Podhranjeni", color: "#6A5ACD",indexLabel: podhr },
		        { y: 53,  label: "Normalno prehranjeni" ,color: "#006400",indexLabel: normalno },
		        { y: 30,  label: "Prekomerno telesno tezki" ,color: "#e6c300",indexLabel: srednje },
		        { y: 15.4,  label: "Debeli" ,color: "#800000",indexLabel: debeli },
				];
			
			
		}
		else{

			var naslov="Povprecni ITM v Sloveniji (moski)"
			var graf_2=[
				{ y: 1.5, label: "Podhranjeni", color: "#6A5ACD",indexLabel: podhr },
		        { y: 35,  label: "Normalno prehranjeni" ,color: "#006400",indexLabel: normalno },
		        { y: 48,  label: "Prekomerno tezki" ,color: "#e6c300",indexLabel: srednje },
		        { y: 17,  label: "Debeli" ,color: "#800000",indexLabel: debeli },
				];
		}
		var chart = new CanvasJS.Chart("grafITM",
		{

			title:{
				text: naslov,
				fontSize: 30
			},
                        animationEnabled: true,
			axisX:{

				gridColor: "Silver",
				tickColor: "silver",

			},                        
                        toolTip:{
                          shared:true
                        },
			theme: "theme1",
			axisY: {
				gridColor: "Silver",
				tickColor: "silver"
			},
			legend:{
				verticalAlign: "center",
				horizontalAlign: "right"
			},
			dataPointWidth: 120,
			data: [
			{        
				showInLegend: false,
				name: "% prebivalcev nad 15. let",
				dataPoints: graf_2
			}

			
			],
		});

chart.render();
}

var izracunStatistike = function(rojstvo,visine,teze,datumi,prehrana,dolzina_podatkov){
	var ITM_od_zadnje_spremembe;
	var min_itm;
	var max_itm;
	var kg_od_prve_meritve;
	var ocena;
	var starost;
	var itm_stopnja;
	
	console.log(teze[dolzina_podatkov-1]+" "+visine[dolzina_podatkov-1]);
	//izracun itmja (zadnji vnos)
	ITM_od_zadnje_spremembe = teze[0]/(((visine[0])/100)*((visine[0])/100));
	console.log("itm: "+ITM_od_zadnje_spremembe);
	//stopnja itmja!
	if(ITM_od_zadnje_spremembe<16,0){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-danger'>Vas ITM je ogrozujoce nizek. <b class='text-right'>Kategorija: Huda nedohranjenost</b></li></ul>";itm_stopnja=0;}
	else if(ITM_od_zadnje_spremembe<17.0){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-danger'>Vas ITM je prenizek. <b class='text-right'>Kategorija: Zmerna nedohranjenost</b></li></ul>";itm_stopnja=1;}
	else if(ITM_od_zadnje_spremembe<18.5){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-warning'>Vas ITM je nizek. <b class='text-right'>Kategorija: Blaga nedohranjenost</b></li></ul>";itm_stopnja=2;}
	else if(ITM_od_zadnje_spremembe<25.0){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-success'>Vas ITM je normalen. <b class='text-right'>Kategorija: Normalna telesna masa</b></li></ul>";itm_stopnja=3;}
	else if(ITM_od_zadnje_spremembe<30.0){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-warning'>Vas ITM je povisan. <b class='text-right'>Kategorija: Zvečana telesna masa</b></li></ul>";itm_stopnja=4;}
	else if(ITM_od_zadnje_spremembe<35.0){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-warning'>Vas ITM je visok. <b class='text-right'>Kategorija: Debelost stopnje I</b></li></ul>";itm_stopnja=5;}
	else if(ITM_od_zadnje_spremembe<40.0){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-danger'>Vas ITM je previsok. <b class='text-right'>Kategorija: Debelost stopnje II</b></li></ul>";itm_stopnja=6;}
	else if(ITM_od_zadnje_spremembe>=40.0){ocena = "<ul class='list-group'><li class='list-group-item list-group-item-danger'>Vas ITM je ogrozujoce visok. <b class='text-right'>Kategorija: Debelost stopnje III</b></li></ul>";itm_stopnja=7;}

	//IZRACUN STAROSTI
	itm_seje=ITM_od_zadnje_spremembe;
	
	//KLIC TWITERJA
	twitterPrikaz(prehrana,itm_stopnja);
	
	//min itm
	var min=teze[0]/((visine[0]/100)*(visine[0]/100));
	for(var i = 0; i < dolzina_podatkov; i++){
		var itm = teze[i]/((visine[i]/100)*(visine[i]/100));
		if(itm<min)min=itm;
	}
	min_itm=min;
	
	//max itm
	var max=teze[0]/((visine[0]/100)*(visine[0]/100));
	for(var i = 0; i < dolzina_podatkov; i++){
		var itm = teze[i]/((visine[i]/100)*(visine[i]/100));
		if(itm>max)max=itm;
	}
	max_itm=max;
	
	//rezlika v kilogramih od prve meritve
	kg_od_prve_meritve= (teze[0])-teze[dolzina_podatkov-1];
	if(kg_od_prve_meritve<0){
		//pridobljeni kilogrami - oceni z rdece
	}
	
	//sprozi prikaz statistike
	$("#rezultatStatistike").html("");
	
	
	
	$("#rezultatStatistike").append(ocena); 
	var results = "<table class='table table-striped\
					table-hover'>\
                    <tr><td>ITM od zadnje spremembe</td><td class='text-right'>"+Math.round(ITM_od_zadnje_spremembe* 100) / 100+"</td>\
                    <tr><td>Najnizji ITM</td><td class='text-right'>"+Math.round(min_itm* 100) / 100+"</td>\
                    <tr><td>Najvisji ITM</td><td class='text-right'>"+Math.round(max_itm* 100) / 100+"</td>\
                    <tr><td>Razlika od zacetne teze</td><td class='text-right'>"+Math.round(kg_od_prve_meritve* 100) / 100+" kg</td>\
                    </table>";
                    
                    
	$("#rezultatStatistike").append(results);                
    return ITM_od_zadnje_spremembe;                
}

var twitterPrikaz = function(prehrana,itm){
	console.log("klic twiterja");
	//ce je itm uredu- nekaj za ohranjanje...
	var parametri="#vegan";



	var twiter = "<a class='twitter-timeline' data-dnt='true' href='https://twitter.com/search?q=%23vegan%20%23food%20%23healthy' data-widget-id='737662572871200768'>Tweets about #vegan#food#healthy</a>\
									<script>\
										!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';\
											if(!d.getElementById(id))\
												{\
													js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);\
												}\
										}\
										(document,'script','twitter-wjs');\
										</script>";
	$("#twitter").html("");
	
	
	
	$("#twitter").append(twiter); 
	
}

var generirajPodatke=function(zahteva){
	console.log("TUKAJ BOM GENERIRAL");
	
	var ehr_id="";
	var ime="";
	var priimek="";
	var rojstvo="";
	var prehrana="";
	var teze[];
	var visine[];
	var datumi[];
	
	
	if(zahteva==1){
		ime="Bojan";
		priimek="Novak";
		rojstvo="1981-10-30T14:58";
		prehrana="vegi";
		teze=[101,101.5,101.2.100,99,98,99];
		visine=[185,185,185.1,185.1,185.2,185,2,185.2];
		datumi=["1981-10-30T14:58,"1981-10-30T14:58,"1981-10-30T14:58,"2014-11-03T14:58","2015-02-03T14:58","2015-01-01T14:58"];
		
	}
	else if(zahteva==2){
		
	}
	else if(zahteva==3){
		
	}
	
	//var ehr_prvi=$("#preberiEHRid").val();
	
	var teze_bojan=["1","2","3","4","5"];
	var datumi_bojan=["1938-11-30T14:58","1938-10-20T14:58","1918-10-30T14:58","1138-10-30T14:58","2938-10-30T14:58"];
	var visine_bojan=["10","11","12","13","14"];
	//var ehr_prvi=ustvariBolnika("Bojan","Novak","MALE","vegi","1981-2-10",datumi_bojan,visine_bojan,teze_bojan,12);
	//console.log("bojan: "+ehr_prvi);
	//dodajMeritve("d93ab36d-1ef1-4635-851b-16ff9708c9ff",datumi_bojan,visine_bojan,teze_bojan);
	
	for(var i = 0; i < 5; i++){
		dodajMeritve("d018bafb-9df4-4d9d-852b-390ccac6d41f",datumi_bojan[i],visine_bojan[i],teze_bojan[i]);
	}

	//console.log("bojan: "+ehr_prvi);
	//ustvariBolnika(ime,priimek,spol,prehrana,datum);
	//ustvariBolnika(ime,priimek,spol,prehrana,datum);
	
}

var ustvariBolnika=function(ime,priimek,spol,prehrana,datum,datumInUra,telesnaVisina,telesnaTeza,dolzina_podatkov){
	var vrni_ehr;
	sessionId = getSessionId();
	$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var response=$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        vrni_ehr=ehrId;
		        console.log("moj EHR: "+ehrId);
		        var partyData = {
		        	gender:spol,
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datum,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId},{key: "prehrana", value: prehrana}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                	 $("#preberiEHRid").val(ehrId);
		                	 $("#mojEhrID").val(ehrId);
		                	 console.log(ehrId);

		                }
		            },
		        });
		        
		        console.log("prej: "+datumInUra[i]+telesnaVisina[i]+telesnaTeza[i]);
		        for(var i=0; i < dolzina_podatkov;i++){
		        	console.log("sem v zanki: "+datumInUra[i]+telesnaVisina[i]+telesnaTeza[i]);
					var podatki = {
					// Struktura predloge je na voljo na naslednjem spletnem naslovu:
				    // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
					    "ctx/language": "en",
					    "ctx/territory": "SI",
					    "ctx/time": datumInUra[i],
					    "vital_signs/height_length/any_event/body_height_length": telesnaVisina[i],
					    "vital_signs/body_weight/any_event/body_weight": telesnaTeza[i],
					};
					var parametriZahteve = {
					    ehrId: ehrId,
					    templateId: 'Vital Signs',
					    format: 'FLAT',
					};
			
					$.ajax({
					    url: baseUrl + "/composition?" + $.param(parametriZahteve),
					    type: 'POST',
					    contentType: 'application/json',
					    data: JSON.stringify(podatki),
					    success: function (res) {},
					    error: function(err) {}
					});
		        }
		        
		    }
		    
		});
		console.log("ehr na koncu: "+response.ehrId );
		return response.ehrId;
	//console.log("ehr na koncu: "+vrni_ehr );
	//return response.responseJSON.sessionId;
}


var dodajMeritve = function(ehrId,datumInUra,telesnaVisina,telesnaTeza){
	//console.log("sem tu notri: "+datumInUra+telesnaVisina+telesnaTeza);
	
	sessionId = getSessionId();
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
	    	console.log("sem v zanki: ");
			var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
		    // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
			    "ctx/language": "en",
			    "ctx/territory": "SI",
			    "ctx/time": datumInUra,
			    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
			    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
			};
			var parametriZahteve = {
			    ehrId: ehrId,
			    templateId: 'Vital Signs',
			    format: 'FLAT',
			};
	
			$.ajax({
			    url: baseUrl + "/composition?" + $.param(parametriZahteve),
			    type: 'POST',
			    contentType: 'application/json',
			    data: JSON.stringify(podatki),
			    success: function (res) {},
			    error: function(err) {}
			});
}