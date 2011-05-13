/*

Copyright (c) 2011 Prabhat Gupta(prabhatgupta.webs.com | golygon.com)

This script may be used for non-commercial purposes only. For any
commercial purposes, please contact the author at prabhat@golygon.com

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

var mapShow;
var marker;
var geocoder;
var poly, polyShow;
var locBounds;
var markerType;
var infowindow = new google.maps.InfoWindow();
var geocoder = new google.maps.Geocoder();

//Util functions start
function createMarkerLocation(lat, lng) {
  return "["+lat+","+lng+"]";
}


function showMap(lat, lng, zoom, div) {
  var location = new google.maps.LatLng(lat,lng);
  zoom=parseInt(zoom);
  var mapOptions = {
    zoom: zoom,
    center: location,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    scrollwheel: true
  };
  mapShow =  new google.maps.Map(document.getElementById(div), mapOptions);
  locBounds = new google.maps.LatLngBounds();
}

function showMapForDay(locations, zoom, div, descs, titles) {
  showMap(28.58098, 77.33015, zoom, div);
  addPoly();
  var j = 0; // counter to track description, description is not shown for routes
  for(var i in  locations){
      if(isArray(locations[i][0])){
        addMarkerToPoly(locations[i][0][0], locations[i][0][1]);
        addMarkerToPoly(locations[i][1][0], locations[i][1][1]);
      }else{
      	if(descs != null){
        	createMarker(locations[i][0], locations[i][1], descs[j], titles[j]);
        	j++;
        }else{
        	createMarker(locations[i][0], locations[i][1]);
        }
      }
  } 
}

function showMapForActivity(locations, zoom, div, desc) {
  // This is in case if virtual tour is playing and once clicks on an activity	
  if(tourRunning == true)
  	callbackFunc();
  if(mapShow == null || mapShow.getDiv().id != div){
    showMap(28.58098, 77.33015, zoom, div);
  }
  locBounds = new google.maps.LatLngBounds();
  addPoly();
  if(isArray(locations[0])){
  	if(infowindow.getPosition() != null){
		infowindow.close();
  	}
    addMarkerToPoly(locations[0][0], locations[0][1]);
    addMarkerToPoly(locations[1][0], locations[1][1]);    
  }else{
  	var local_marker = createMarker(locations[0], locations[1], desc);
  	google.maps.event.trigger(local_marker, "click");
  }
}

function isArray(obj) {
   if (obj.constructor.toString().indexOf("Array") == -1)
      return false;
   else
      return true;
}

function createMarker(lat, lng, html, title) {	
	var location = new google.maps.LatLng(lat,lng);
	if(title == null)
		title = "Click to see details";
  	var local_marker = new google.maps.Marker({
	                position: location,
	                animation: google.maps.Animation.DROP,
	                title: title,
	                map: mapShow
               	 });
	google.maps.event.addListener(local_marker, 'click', function() {
	    zoomToLocation(this.getPosition());
	    if(html!=null){
	    	if(infowindow.getPosition() != null){
				infowindow.close();
  			}
	    	infowindow.setContent(html);
	    	//using location instead of marker since moving same infowindow over different marker causes close button to stop working
	    	infowindow.setPosition(this.getPosition());
  			infowindow.open(mapShow);
		}
	  });
	  
    if(locBounds == null || locBounds.isEmpty()){
	  	locBounds = new google.maps.LatLngBounds(); 
	  	locBounds.extend(location);
		//   zoomToLocation(location);
	}else{
		fitMap(location);
	}
	  
	return local_marker; 
}

function addPoly() {
    //set polyline look and feel
  var polyOptions = {
    strokeColor: '#0000FF',
    strokeOpacity: 1.0,
    strokeWeight: 3
  }
  polyShow = new google.maps.Polyline(polyOptions);
  polyShow.setMap(mapShow);
}

function addMarkerToPoly(lat,lng) {
  var location = new google.maps.LatLng(lat,lng);
  //create this marker only if it is not created
  if(!locBounds.contains(location)){
  	createMarker(lat, lng);
  }
  var polyPath = polyShow.getPath();
  polyPath.push(location);
  //fitMap(location)
}

function fitMap(location){
  if(!locBounds.contains(location)){
    locBounds.extend(location);
    mapShow.setCenter(locBounds.getCenter());
    mapShow.fitBounds(locBounds);
  }
}

function zoomToLocation(location){
  mapShow.setCenter(location);
  mapShow.setZoom(12);
}

function getLocBoundCenter(locations){
	var bound = new google.maps.LatLngBounds();
	for(i in locations){
		bound.extend(new google.maps.LatLng(locations[i][0], locations[i][1]));	
	}
	if(bound.isEmpty())
		return null;
	return bound.getCenter();
}

var step = 100; // 5; // metres  
var tick = 10; // milliseconds  
var eol;  
var k=0;  
var stepnum=0;  
var speed = "";  
var lastVertex = 1;
var directionsService;
var directionsDisplay;
var steps = [];
var timerHandle = null;
var startLocation;
var endLocation;
var tourRunning = false;
var locationArr;
var descArr;
var distance;
var callbackFunc;

function initialize(div){
	showMap(28.58098, 77.33015, 8, div);
	// Instantiate a directions service.  
 	directionsService = new google.maps.DirectionsService();
 	 // Create a renderer for directions and bind it to the map.  
	 var rendererOptions = {  
	 	map: mapShow  
	 }
	 directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);  
	 polyShow = new google.maps.Polyline({  
		 path: [],  
		 strokeColor: '#0000FF',  
		 strokeWeight: 3  
	 });  
	 marker = new google.maps.Marker({
        position: new google.maps.LatLng(28.58098, 77.33015),
        animation: google.maps.Animation.DROP,
        title: "Click to zoom here",
        map: mapShow,
        icon: "images/arrow-down.png"
   	 }); 
	 if (timerHandle) { clearTimeout(timerHandle); }  
	 //if (marker) { marker.setMap(null);}  
	 polyShow.setMap(null); 
	 directionsDisplay.setMap(null);
	 index = 0; 
	 distance = 0;
	 //stop = false;	
}

function initArr(locations, descs, callback){
	callbackFunc = callback;
	locationArr = locations;
	descArr = descs;
}

function changeSpeed(number){
	step = number * 100;
}
//=============== animation functions ======================

function animate(d) {
	var p, currLoc;
	if (d>eol) { //|| stop == true
		callbackFunc(); 
		tourRunning = false;
		return;  
	}
	
	//tourRunning = true;
	
	if(index < locationArr.length && marker.getPosition() != null){
		currLoc = new google.maps.LatLng(locationArr[index][0], locationArr[index][1]);
		//threshold value to have every place visible = 5
		if(marker.getPosition().distanceFrom(currLoc) <= step*5 || currLoc.distanceFrom(marker.getPosition()) <= step*5){
			local_marker = createMarker(locationArr[index][0], locationArr[index][1], descArr[index]);
			google.maps.event.trigger(local_marker, "click");
			mapShow.panTo(local_marker.getPosition());
			//sleep(4);
			index = index + 1;
		}
	}
	
	p = polyShow.GetPointAtDistance(d);
	if(p == null)
		p = endLocation.latlng; 
	marker.setPosition(p);
	mapShow.panTo(marker.getPosition());
	//mapShow.panTo(p);
	stepnum = d;
	timerHandle = setTimeout("animate("+(d+step)+")", tick);
}



function pauseAnimation(){
	clearTimeout(timerHandle);
	//tourRunning = false;
}

function resumeAnimation(){
	timerHandle = setTimeout("animate("+stepnum+")", tick);
}


function startAnimation(div, locations, descs, callback) {
	if(locations == null || locations.length == 0){
		return;
	}else if(locations.length == 1){
		showMapForActivity(locations[0], 8, div, descs[0]);
		return;
	}
	initialize(div);
	initArr(locations, descs, callback);
	var travelMode = google.maps.DirectionsTravelMode.DRIVING;
 	
 	var wayPoints = new Array();
 	 
 	for (var i = 1; i < locations.length-1; i++){ 
         wayPoints[i-1] = {
         	location: new google.maps.LatLng(locations[i][0], locations[i][1])
         }; 
    }
    
    var request = {
			origin: new google.maps.LatLng(locations[0][0], locations[0][1]),
			destination: new google.maps.LatLng(locations[locations.length - 1][0], locations[locations.length - 1][1]),
			travelMode: travelMode,
			waypoints: wayPoints
	};		
	// Route the directions and pass the response to a function to create markers for each step.
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK){
			directionsDisplay.setDirections(response); 
			var route = response.routes[0];
			// For each route, display summary information.
			var bounds = response.routes[0].bounds;
			var legs = response.routes[0].legs;
			startLocation = new Object();  
 			endLocation = new Object(); 
			for (i=0;i<legs.length;i++) {
				if (i == 0) {  
					startLocation.latlng = legs[i].start_location;  
					startLocation.desc = descs[i]; 
				}  
				endLocation.latlng = legs[i].end_location;
				var steps = legs[i].steps;
				for (j=0;j<steps.length;j++) {
					var nextSegment = steps[j].path;
					for (k=0;k<nextSegment.length;k++) {
						polyShow.getPath().push(nextSegment[k]);
						bounds.extend(nextSegment[k]);
					}
				}
			}
			polyShow.setMap(mapShow);
			mapShow.fitBounds(bounds);
			eol=polyShow.Distance();
			tourRunning = true;
			var local_marker = createMarker(locationArr[0][0], locationArr[0][1], descArr[0]);
			google.maps.event.trigger(local_marker, "click");
		    setTimeout(function(){
		    	animate(50);},2000); // Allow time for the initial map display
		}
	});
}

function animateTrip(div, locations, descs, callback){
	if(tourRunning == false)
		startAnimation(div, locations, descs, callback);
	else
		resumeAnimation();
}

function sleep(secs){
	var msecs = secs * 1000;
    var sleeping = true;
    var now = new Date();
    var alarm;
    var startingMSeconds = now.getTime();
    while(sleeping){
        alarm = new Date();
        alarmMSeconds = alarm.getTime();
        if(alarmMSeconds - startingMSeconds > msecs){ sleeping = false; }
    }        
}
