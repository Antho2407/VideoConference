var displayCoords, myAddress;

var socket = io.connect();

var nbLocations;

socket.on('getPseudo', function (){
	bootbox.prompt({
      title: "Quel est votre pseudo",
      value: "Antonio",
      callback: function(result) {
        if (result === null) {
          	socket.emit('registerPseudo', 'Inconnu'); 
        } else {
        	socket.emit('registerPseudo', result); 
        }
      }
    });
});

socket.on('getLocation', function (room){

  console.log('getLocation socket on');
  getLocation();
});

socket.on('newPositions', function (positions){
	displayCoords.innerHTML = "Positions des clients <br />" ;
	positions.forEach(displayCoordinates);
});

function getLocation() {
	console.log("GET LOCATION");
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition);
	} else {
		displayCoords.innerHTML = "Geolocation API not supported by your browser.";
	}
}

function displayCoordinates(element, index, array) {
	console.log("NBLOC"+nbLocations);
	nbLocations ++;
	displayCoords.innerHTML += "Client " + index + "<br /> Latitude: " + element.latitude
			+ "<br />Longitude: " + element.longitude + "<br />";
	showOnGoogleMap(new google.maps.LatLng(element.latitude,
			element.longitude));
}

// Called when position is available
function showPosition(position) {
	socket.emit('sendPosition', position.coords);
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
							draggable: true
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