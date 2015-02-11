var displayCoords, myAddress;

//var socket = io.connect();

var nbLocations;
var currentRoomMap;

var socketMap;

var user;
var markers = {};

function getLocation(newUser) {
	if (navigator.geolocation) {
		user = newUser;
		navigator.geolocation.getCurrentPosition(showPosition);
	} else {
		//displayCoords.innerHTML = "Geolocation API not supported by your browser.";
		bootbox.alert("Erreur MAP", function() {
		  bootbox.show("API de geolocalisation non supportée par votre navigateur");
		});
	}
}

function removePosition(id){
	var markerToBeRemoved = markers[id][0];
	var infoToBeRemoved = markers[id][1];
	markerToBeRemoved.setMap(null);
	infoToBeRemoved.setMap(null);
}

function displayCoordinates(element, index, array) {
	nbLocations ++;
	showOnGoogleMap(new google.maps.LatLng(element.latitude,
			element.longitude), element.idClient, element.nameClient);
}

function newCoordinates(position) {
	nbLocations ++;
	showOnGoogleMap(new google.maps.LatLng(position.latitude,
			position.longitude), position.idClient, position.nameClient);
}

// Called when position is available
function showPosition(position) {
	socketMap.emit('sendPosition', position.coords, currentRoomMap, user);
}

var geocoder;
var map;
var infowindow = new google.maps.InfoWindow();
var marker;

function initialize() {
	nbLocations = 0;

	geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(34.0144, -6.83);
	var mapOptions = {
		zoom : 8,
		center : latlng,
		mapTypeId : 'roadmap'
	}
	map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
}

function showOnGoogleMap(latlng, id, name) {

	geocoder.geocode({
		'latLng' : latlng
	},
			function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (results[1]) {
						map.setZoom(11);
						marker = new google.maps.Marker({
							position : latlng,
							map : map,
							draggable: true,
						});

						markers[id] = new Array();
    					markers[id].push(marker);
						console.log("DISPLAY MARKER " + name);

						var boxText = document.createElement("div");
				        boxText.style.cssText = "border: 1px solid black; margin-top: 8px; background: grey; padding: 5px;";
				        boxText.innerHTML = "Position de " + name + "<br> Adresse :" + results[1].formatted_address;

				        var myOptions = {
							 content: boxText
							,disableAutoPan: false
							,maxWidth: 0
							,pixelOffset: new google.maps.Size(-140, 0)
							,zIndex: null
							,boxStyle: { 
							  //background-color: "grey"
							  opacity: 0.75
							  ,width: "280px"
							  ,height: "280px"
							 }
							,closeBoxMargin: "10px 2px 2px 2px"
							,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
							,infoBoxClearance: new google.maps.Size(1, 1)
							,isHidden: false
							,pane: "floatPane"
							,enableEventPropagation: false
						};

						var info_box = new InfoBubble(myOptions);
						info_box.open(map, marker);

						markers[id].push(info_box);

						//info_box.setContent("Position de " + name + " et sa petite adresse : \n" + results[1].formatted_address);
						//infowindow.open(map, marker);

						google.maps.event.addListener(marker, 'click', function() {
						    //infowindow.open(map,marker);
						    info_box.open(map, marker);
						  });

					} else {
						alert('No results found');
					}
				} else {
					alert('Geocoder failed due to: ' + status);
				}
			});
}