var displayCoords, myAddress;

//var socket = io.connect();

var nbLocations;
var currentRoomMap;

var socketMap;

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition);
	} else {
		displayCoords.innerHTML = "Geolocation API not supported by your browser.";
	}
}

function displayCoordinates(element, index, array) {
	nbLocations ++;
	displayCoords.innerHTML += "Client " + index + "<br /> Latitude: " + element.latitude
			+ "<br />Longitude: " + element.longitude + "<br />";
	showOnGoogleMap(new google.maps.LatLng(element.latitude,
			element.longitude));
}

function newCoordinates(position) {
	nbLocations ++;
	displayCoords.innerHTML += "Client " + nbLocations + "<br /> Latitude: " + position.latitude
			+ "<br />Longitude: " + position.longitude + "<br />";
	showOnGoogleMap(new google.maps.LatLng(position.latitude,
			position.longitude));
}

// Called when position is available
function showPosition(position) {
	socketMap.emit('sendPosition', position.coords, currentRoomMap);
	//displayCoords.innerHTML = "Latitude: " + position.coords.latitude
	//		+ "<br />Longitude: " + position.coords.longitude;
}

var geocoder;
var map;
var infowindow = new google.maps.InfoWindow();
var marker;

function initialize() {
	displayCoords = document.getElementById("msg");
	myAddress = document.getElementById("address");

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

function showOnGoogleMap(latlng) {

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
						infowindow.setContent(results[1].formatted_address);
						infowindow.open(map, marker);

						// Display address as text in the page
						myAddress.innerHTML = "Adress: "
								+ results[1].formatted_address;
					} else {
						alert('No results found');
					}
				} else {
					alert('Geocoder failed due to: ' + status);
				}
			});
}