var mwivn = (function () {
	// Set up Server Constants
	var config = {
		//server : "https://sites.google.com/site/lieberherrduongvupromotion/database/",
		server : "https://sites.google.com/site/mwivnsources/images/",
		lat : 9.825285989816358,
		lng : 105.64227233886722
	}

	// Map Module
	var mwimap = (function () {
		var map = null,
		layers = {},
		state = {},
		turnedOffLayers = false,
		parser = null;

		function refineContent() {
			var newHeight = $(window).height() - 3;
			$("#map-canvas").height(newHeight);
		}

		function registerLayer(layer_name) {
			if (!layers[layer_name]) {
				var kmlOption = {
					suppressInfoWindows : true,
					map : map,
					preserveViewport : true
				};
				layers[layer_name] = {
					kmllayer: new google.maps.KmlLayer(kmlOption),
					state: false
				}
			}
		}

		function unregisterLayer(layer_name) {
			if (layers[layer_name]) {
				delete layers[layer_name];
			} else {
				alert('Error. The layer name ' + layer_name + " not exist.");
			}
		}

		function activeLayer(layer_name, mode) {
			if (layers[layer_name]) {
				var kmlLayer = layers[layer_name].kmllayer;
				if (mode === true) {
					kmlLayer.setMap(map);
				} else if (mode === false) {
					kmlLayer.setMap(null);
				}
				layers[layer_name].state = mode;
			} else {
				alert('Error. The layer name ' + layer_name + " not exist.");
			}
		}

		function onoffLayers() {
			if (turnedOffLayers === false) {
				for (var layer in layers) {
					layers[layer].kmllayer.setMap(null);
				}
				turnedOffLayers = true;
			} else if (turnedOffLayers === true) {
				for (var layer in layers) {
					if (layers[layer].state === true) {
						layers[layer].kmllayer.setMap(map);
					} else if (layers[layer].state === false) {
						layers[layer].kmllayer.setMap(null);
					}
				}
				turnedOffLayers = false;
			}
		}

		function updateLayer(layer_name, url) {
			if (layers[layer_name]) {
				var kmlLayer = layers[layer_name];
				kmlLayer.kmllayer.setUrl(url);
				kmlLayer.kmllayer.setMap(map);
				//console.log('access: ' + url);
			} else {
				alert('Error. The layer name ' + layer_name + " not exist.");
			}
		}

		function ErrorHandler() {
			alert('parsing error');
		}

		function parseStationsLayer(url) {
			if (parser) {
				parser.removeDocument();
				$("#MasterView").empty();
			}
			
			parser = new geoXML3.parser({
					map : map,
					failedParse : ErrorHandler,
					masterTableID: 'MasterView'
				});
			parser.parse(url);
		}

		function removeStationsLayer() {
			if (parser) {
				parser.removeDocument();
				$("#MasterView").empty();
				parser = null;
			}
		}

		function init() {
			var iLatLng = new google.maps.LatLng(config.lat, config.lng);
			var mapOptions = {
				center : iLatLng,
				zoom : 8,
				mapTypeId : google.maps.MapTypeId.TERRAIN,
				panControl : false,
				zoomControl : false,
				streetViewControl : false,
				scaleControl : true,
				overviewMapControl : true,
				overviewMapControlOptions : {
					opened : true,
					position : google.maps.ControlPosition.LEFT_BOTTOM
				},
				mapTypeControl : true,
				mapTypeControlOptions : {
					style : google.maps.MapTypeControlStyle.DROPDOWN_MENU,
					position : google.maps.ControlPosition.BOTTOM_LEFT
				}
			};

			map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

			// Zoom change
			google.maps.event.addListener(map, 'zoom_changed', function () {
				var zoom = map.getZoom();
				if (zoom > 100) {
					for (var layer in layers) {
						layers[layer].setMap(null);
					}
				} else {
					if (!turnedOffLayers) {
						for (var layer in layers) {
							if (state[layer] === true) {
								layers[layer].setMap(map);
							} else if (state[layer] === false) {
								layers[layer].setMap(null);
							}
						}
					}
				}
			});

			// Init content
			refineContent();
		}

		return {
			init : init,
			refineContent : refineContent,
			registerLayer : registerLayer,
			activeLayer : activeLayer,
			updateLayer : updateLayer,
			onoffLayers : onoffLayers,
			parseStationsLayer : parseStationsLayer,
			removeStationsLayer : removeStationsLayer
		};
	})();

	// Option Module
	var option = (function () {
		function BaseOption(layer_name, module_name, server) {
			this.server = server;
			this.layer_name = layer_name;
			this.module_name = module_name;
			this.extension = ".kmz";
			mwimap.registerLayer(layer_name);
			$(this).on('update-layer', function (evt, data) {
				// Notify map change kmlLayer's url
				mwimap.updateLayer(data.layer_name, data.url);
			});

			$(this).on('active-layer', function (evt, data) {
				// Notify map change mode kmlLayer
				mwimap.activeLayer(data.layer_name, data.mode);
			});
		}

		BaseOption.prototype.setFilename = function (arrayOptions) {
			var optionsStr = arrayOptions.join('_');
			this.url = this.server + this.module_name + optionsStr + this.extension;
			$(this).triggerHandler('update-layer',
				[{
						layer_name : this.layer_name,
						url : this.url
					}
				]);
		};

		BaseOption.prototype.active = function (layer_name, mode) {
			$(this).triggerHandler('active-layer',
				[{
						layer_name : layer_name,
						mode : mode
					}
				]);
		};

		function GISOption(arrayLayer, server) {
			this.server = server;
			this.extension = ".kmz";
			for (var i = 0; i < arrayLayer.length; i++) {
				mwimap.registerLayer(arrayLayer[i]);
				var url = server + arrayLayer[i] + this.extension;
				mwimap.updateLayer(arrayLayer[i], url);
			}

			$(this).on('update-layer', function (evt, data) {
				// Notify map change kmlLayer's url
				mwimap.updateLayer(data);
			});

			$(this).on('active-layer', function (evt, data) {
				// Notify map change mode kmlLayer
				mwimap.activeLayer(data.layer_name, data.mode);
			});
		}

		GISOption.prototype.active = function (layer_name, mode) {
			$(this).triggerHandler('active-layer',
				[{
						layer_name : layer_name,
						mode : mode
					}
				]);
		};

		var GISArrayLayer = [
			"DigitalElevationMap"],
		options = {
			EnvisatASAR : new BaseOption("ModisSatellite", "Envisat", config.server),
			flood : new BaseOption("ModisSatellite", "Flood", config.server),
			landuse : new BaseOption("ModisSatellite", "Landuse", config.server),
			gis : new GISOption(GISArrayLayer, config.server),
			HydraulicFlood : new BaseOption("ModisSatellite", "HydraulicFlood", config.server),
			HydraulicLanduse : new BaseOption("ModisSatellite", "HydraulicLanduse", config.server),
			SeaLevelRise : new BaseOption("ModisSatellite", "SLR", config.server),
			SalinityInstrusion : new BaseOption("ModisSatellite", "SalinityInstrusion", config.server)
		};

		function registerHandlers() {
			// Accordion panels
			$(".accordional").accordion({
				header : "> h1:not(.item)",
				heightStyle : "content",
				collapsible : true,
				autoheight : false,
				active: 0
			});

			$(".sidebarheader").click(function () {
				var title = $(this).attr("id");
				switch (title) {
				case 'RemoteSensingHeader':
					$("#Legendbar").show();
					$("#MasterView").hide();
					var index = $("#ModisSatellite").accordion("option", "active");
					var id = $("#ModisSatellite h1").eq(index).attr("id");
					$("#Legendbar div[name!='" + id + "']").hide();
					$("#Legendbar div[name='" + id + "']").show(1000);
					$("#" + id + "Year").click();
					break;
				case 'RemoteSensingFlood':
					$("#RemoteSensingFloodDOY").click();
					$("#Legendbar div[name!='RemoteSensingFlood']").hide();
					$("#Legendbar div[name='RemoteSensingFlood']").show(1000);
					break;
				case 'EnvisatASAR':
					$("#EnvisatASARDOY").click();
					$("#Legendbar div").hide();
					break;
				case 'RemoteSensingLanduse':
					$("#RemoteSensingLanduseYear").click();
					$("#Legendbar div[name!='RemoteSensingLanduse']").hide();
					$("#Legendbar div[name='RemoteSensingLanduse']").show(1000);
					break;
				case 'GIS':
					$("#Legendbar").hide();
					$("#MasterView").show();
					break;
				case 'HydraulicSimulation':
					$("#Legendbar").show();
					$("#MasterView").hide();
					$("#HydraulicFloodYear").click();
					var index = $("#HydraulicSimulationSwapper").accordion("option", "active");
					var id = $("#HydraulicSimulationSwapper h1").eq(index).attr("id");
					$("#Legendbar div[name!='" + id + "']").hide();
					$("#Legendbar div[name='" + id + "']").show(1000);
					break;
				case 'HydraulicFlood':
					$("#HydraulicFloodYear").click();
					$("#Legendbar div[name!='HydraulicFlood']").hide();
					$("#Legendbar div[name='HydraulicFlood']").show(1000);
					break;
				case 'HydraulicLanduse':
					$("#HydraulicLanduseScenarios").click();
					$("#Legendbar div[name!='HydraulicFlood']").hide();
					$("#Legendbar div[name='HydraulicFlood']").show(1000);
					break;
				case 'SeaLevelRise':
					$("#SeaLevelRiseScenarios").click();
					$("#Legendbar div[name!='HydraulicFlood']").hide();
					$("#Legendbar div[name='HydraulicFlood']").show(1000);
					break;
				case 'SalinityInstrusion':
					$("#SalinityInstrusionScenarios").click();
					$("#Legendbar div[name!='SalinityInstrusion']").hide();
					$("#Legendbar div[name='SalinityInstrusion']").show(1000);
					break;
				case 'Statistical':
					$("#StatisticalData").click();
					break;
				}
			});

			// Legendbar
			var floodLegend = document.createElement('img');
			floodLegend.src = 'images/Legend_Flood.png';
			$("#FloodLegend").append(floodLegend);

			var landuseLegend = document.createElement('img');
			landuseLegend.src = 'images/Legend_Landuse.png';
			$("#LanduseLegend").append(landuseLegend);

			var demLegend = document.createElement('img');
			demLegend.src = 'images/Legend_DEM.png';
			$("#DEMLegend").append(demLegend);

			var hydraulicFloodLegend = document.createElement('img');
			hydraulicFloodLegend.src = 'images/Legend_HydraulicFlood.png';
			$("#HydraulicFloodLegend").append(hydraulicFloodLegend);

			var salinityInstrusionLegend = document.createElement('img');
			salinityInstrusionLegend.src = 'images/Legend_SalinityInstrusion.png';
			$("#SalinityInstrusionLegend").append(salinityInstrusionLegend);

			var dykeLegend = document.createElement('img');
			dykeLegend.src = 'images/Legend_Dyke.png';
			$("#DykeLegend").append(dykeLegend);

			// Buttons
			$(".CloseBtn").button({
				icons : {
					primary : "ui-icon-close"
				},
				text : false
			});
			$("#CloseBtnplayerswapper").click(function () {
				$("#playerswapper").hide();
				var video = document.getElementById("videoplayer");
				video.pause();
			});
			$("#CloseBtndataviewer").click(function () {
				$("#dataviewer").hide();
			});

			$(".PreviousBtn").button({
				icons : {
					primary : "ui-icon-arrow-1-w"
				},
				text : false
			});
			$(".PreviousBtn").click(function () {
				var id = "#" + $(this).attr("name");
				var prevVal = $(id).find("option:selected").prev().val();
				if (prevVal === undefined) {
					if ($(id).find("option:selected").is(":first-child")) {
						prevVal = $(id).find("option:last-child").val();
						if (id === "#RemoteSensingFloodDOY") {
							$(".PreviousBtn[name='RemoteSensingFloodYear']").click();
						}
					}
				}
				// In case Envisat DOY
				if ($(id).find("option[value='" + prevVal + "']").is(":hidden")) {
					$(".PreviousBtn[name='EnvisatASARYear']").click();
				}

				$(id).find("option[value='" + prevVal + "']").attr("selected", "selected");
				$(id).click();
			});

			$(".NextBtn").button({
				icons : {
					primary : "ui-icon-arrow-1-e"
				},
				text : false
			});
			$(".NextBtn").click(function () {
				var id = "#" + $(this).attr("name");
				var nextVal = $(id).find("option:selected").next().val();

				if (nextVal === undefined) {
					if ($(id).find("option:selected").is(":last-child")) {
						nextVal = $(id).find("option:first-child").val();
						if (id === "#RemoteSensingFloodDOY") {
							$(".NextBtn[name='RemoteSensingFloodYear']").click();
						}
					}
				}

				// In case Envisat DOY
				if ($(id).find("option[value='" + nextVal + "']").is(":hidden")) {
					$(".NextBtn[name='EnvisatASARYear']").click();
				}

				$(id).find("option[value='" + nextVal + "']").attr("selected", "selected");
				$(id).click(); ;
			});

			// Navigation bar
			$("#icon-module").button({
				icons : {
					primary : "show-module"
				},
				text : false
			});
			$("#icon-module").click(function () {
				$("#sidebar").toggle();
			});

			$("#icon-legend").button();
			$("#icon-legend").click(function () {
				$("#Legendbar").toggle();
			});

			$("#icon-overlay").button();
			$("#icon-overlay").click(function () {
				mwimap.onoffLayers();
			});

			// RemoteSensing Options
			$("#RemoteSensingFloodDOY").click(function () {
				options.flood.setFilename([$("#RemoteSensingFloodYear").val(),
						$("#RemoteSensingFloodDOY").val()]);
			});
			$("#RemoteSensingFloodYear").click(function () {
				options.flood.setFilename([$("#RemoteSensingFloodYear").val(),
						$("#RemoteSensingFloodDOY").val()]);
				var src = config.server + "Flood" + $("#RemoteSensingFloodYear").val() + ".mp4";
				$("#videoplayer").attr("src", src);
			});

			$("#AnimateFlood").button();
			$("#AnimateFlood").click(function () {
				var src = config.server + "Flood" + $("#RemoteSensingFloodYear").val() + ".mp4";
				$("#videoplayer").attr("src", src);
				$("#playerswapper").show();
				var video = document.getElementById("videoplayer");
				video.play();
			});
			$("#RemoteSensingLanduseYear").click(function () {
				options.landuse.setFilename([$(this).val()]);
			});

			// HydraulicSimulation Options
			$("#HydraulicFloodYear").click(function () {
				options.HydraulicFlood.setFilename([$(this).val()]);
			});
			$("#HydraulicLanduseScenarios").click(function () {
				options.HydraulicLanduse.setFilename([$(this).val()]);
			});
			$("#SeaLevelRiseScenarios").click(function () {
				options.SeaLevelRise.setFilename([$(this).val()]);
			});
			$("#SalinityInstrusionScenarios").click(function () {
				options.SalinityInstrusion.setFilename([$(this).val()]);
			});

			// GIS Options
			$("form input:radio").change(function () {
				if ($(this).is(":checked")) {
				$("#Legendbar div").hide();
					var value = $(this).val();
					switch (value) {
					case 'HydrologicalStations':
						mwimap.parseStationsLayer('data/Hydro.kmz');
						break;
					case 'MeteorologicalStations':
						mwimap.parseStationsLayer('data/Meteoro.kmz');
						break;
					case 'ControlStructures':
						//console.log('parse ControlStructures');
						mwimap.parseStationsLayer('data/ControlStructures.kmz');
						break;
					case 'RiverNetwork':
						//console.log('parse river network');
						mwimap.parseStationsLayer('data/RiverNetwork.kmz');
						break;
					case 'DEM':
						//console.log('parse DEM');
						mwimap.parseStationsLayer('data/DigitalElevationMap.kmz');
						break;
					case 'Dyke':
						//console.log('parse Dyke');
						$("#Legendbar div[name='Dyke']").show(1000);
						mwimap.parseStationsLayer('data/Dyke.kmz');
						break;
					case 'ProvincialBoundary':
						//console.log('parse ProvincialBoundary');
						mwimap.parseStationsLayer('data/ProvincialBoundary.kmz');
						break;
					case 'Hydropower-Dam':
						//console.log('parse ProvincialBoundary');
						mwimap.parseStationsLayer('data/Hydropower-Dam.kmz');
						break;
					case 'FloodPlain':
						//console.log('parse ProvincialBoundary');
						mwimap.parseStationsLayer('data/FloodPlain.kmz');
						break;
					case 'None':
						mwimap.removeStationsLayer();
						break;
					}
					//$("#Legendbar div").hide();
					//$("#MasterView").show(1000);
				}
			});

			$("form input:checkbox").change(function () {
				if ($(this).is(":checked")) {
					$("#Legendbar div").hide();
					var value = $(this).val();
					switch (value) {
					case 'DigitalElevationMap':
						options.gis.active(value, true);
						$("#Legendbar div[name='" + $(this).val() + "']").show(1000);
						break;
					case 'ProvincialBoundary':
						options.gis.active(value, true);
						break;
					case 'RiverNetwork':
						options.gis.active(value, true);
						break;
					case 'Dyke':
						options.gis.active(value, true);
						$("#Legendbar div").hide();
						$("#Legendbar div[name='" + $(this).val() + "']").show(1000);
						break;
					}
				} else {
					var value = $(this).val();
					switch (value) {
					case 'DigitalElevationMap':
						options.gis.active(value, false);
						$("#Legendbar div[name='" + $(this).val() + "']").hide();
						break;
					case 'ProvincialBoundary':
						options.gis.active(value, false);
						break;
					case 'RiverNetwork':
						options.gis.active(value, false);
						break;
					case 'Dyke':
						options.gis.active(value, false);
						$("#Legendbar div[name='" + $(this).val() + "']").hide();
						break;
					}
				}
			});

			// Navisat Options
			$("#EnvisatASARYear").click(function () {
				var year = $(this).val();
				$("#EnvisatASARDOY").find("option").hide();
				$("#EnvisatASARDOY").find("option:contains('" + year + "')").show();
				var val = $("#EnvisatASARDOY").find("option:contains('" + year + "')").eq(0).val();
				$("#EnvisatASARDOY").find("option[value='" + val + "']").attr("selected", "selected");
				options.EnvisatASAR.setFilename([$("#EnvisatASARDOY").val()]);
			});
			$("#EnvisatASARDOY").click(function () {
				options.EnvisatASAR.setFilename([$(this).val()]);
			});
			
			// Statistical Data
			$("#StatisticalData").click(function () {
				var src = "data/" + $(this).val() + ".png";
				$("#dataviewer > img").attr('src', src);
				$("#dataviewer").show();
			});
		}

		function init() { // Init Options
			// Register Handlers
			registerHandlers();
			// Select first option
			$("select").find('option:first-child').prop('selected', true);
			options.flood.active("ModisSatellite", true);
			// Hide Legends
			$("#Legendbar div").hide();
		}

		return {
			init : init
		};
	}
		());

	// Init module when DOM ready
	$(document).ready(mwimap.init);
	$(document).ready(option.init);
	// Refine map when resize window
	$(window).resize(mwimap.refineContent);
}
	());
