// Constants
const ubcCenter = { lat: 49.26216764154615, lng: -123.2473569860864 };
const ubcBbox = { latLngBounds: { north: 49.30, south: 49.22, west: -123.27, east: -123.22 },
    strictBounds: false };
const startZoom = 14.5;
// Locations
const icics = { lat: 49.261294, lng: -123.24897 };
const ikb = { lat: 49.26779158761914, lng: -123.2524405937126 };
const ams = { lat: 49.26638091855852, lng: -123.24968238815106 };
const obstructions = [
    { lat: 49.26322419204356, lng: -123.24936131961685 },
    { lat: 49.266425700849965, lng: -123.24711426032077 },
    { lat: 49.26454864720791, lng: -123.2554512122981 },
    { lat: 49.27214915250998, lng: -123.234117813479 },
    { lat: 49.252371958011054, lng: -123.24577727156205}
]
const shuttleLocs = [
	{ lat: 49.260692761322176 , lng: -123.2492972199509 },
	{ lat: 49.262837055212714 , lng: -123.24656294816496 },
	{ lat: 49.26173264907086 , lng: -123.25536132126678 },
	{ lat: 49.261055733107504 , lng: -123.24796574592602 },
	{ lat: 49.2653664084989 , lng: -123.25776459898265 },
	{ lat: 49.266179301183676 , lng: -123.25804692083025 },
	{ lat: 49.268986695492494 , lng: -123.2560191620369 },
	{ lat: 49.266789402368985 , lng: -123.25524441159357 },
	{ lat: 49.26771353119853 , lng: -123.25454701679017 },
	{ lat: 49.26719161219116 , lng: -123.25323952658488 },
	{ lat: 49.26830797149617 , lng: -123.25041207205435 },
	{ lat: 49.26612940493019 , lng: -123.2498931081166 },
	{ lat: 49.26500924067265 , lng: -123.25335852951727 },
	{ lat: 49.26419709125739 , lng: -123.25268261500258 }
]
const bluephoneLocs = [
	{ lat: 49.26917774851459 , lng: -123.25548593572059 },
	{ lat: 49.25606177726062 , lng: -123.2412585380836 },
	{ lat: 49.25812775113913 , lng: -123.2556955862402 },
	{ lat: 49.25781033694401 , lng: -123.24805430313965 },
	{ lat: 49.25932875203801 , lng: -123.24354122112665 },
	{ lat: 49.26486953089567 , lng: -123.24822649444089 },
	{ lat: 49.25457529625915 , lng: -123.23916688365581 },
	{ lat: 49.263005959549766 , lng: -123.23998534577048 },
	{ lat: 49.25972418455894 , lng: -123.25446435058486 },
	{ lat: 49.269247320700785 , lng: -123.2471297984455 },
	{ lat: 49.25725604006446 , lng: -123.24496456781249 },
	{ lat: 49.26178035570595 , lng: -123.24664181876564 },
	{ lat: 49.264118206191526 , lng: -123.25034055833041 },
	{ lat: 49.26935423472392 , lng: -123.24480328365168 },
	{ lat: 49.260725521838014 , lng: -123.25231116418 },
	{ lat: 49.25997291239839 , lng: -123.25190557529942 },
	{ lat: 49.26143285259173 , lng: -123.24220205428924 },
	{ lat: 49.26268028963878 , lng: -123.25347020467144 },
	{ lat: 49.26275803696719 , lng: -123.2429632346989 },
	{ lat: 49.26199742855285 , lng: -123.24416899822852 }
]

// Objects
let map;
let places;
let autocomplete;
let directions;
let directionsRenderer;
let pref;
let gpsMarker;
let cards = [];
let bluephones = [];
let shuttles = [];

let frLoc;
let toLoc;
let curRoute;
let watchlist = [];

// State
let state;

function openTab(_, tabName) {
    clearSearchText();
    if (state.selectedTab === tabName) {
        if (tabName === 'map') {
            map.panTo(ubcCenter);
            map.setZoom(startZoom);
        }
    } else {
        const tabElements = document.getElementsByClassName('tab-content');

        for (let i = 0; i < tabElements.length; i++) {
            if (tabElements[i].id.includes(tabName)) {
                tabElements[i].style.visibility = 'visible';
            } else {
                tabElements[i].style.visibility = 'hidden';
            }
        }

        const tabButtonElements = document.getElementsByClassName('tab-button');

        for (let i = 0; i < tabButtonElements.length; i++) {
            if (tabButtonElements[i].id.includes(tabName) || tabButtonElements[i].id.includes(state.selectedTab)) {
                tabButtonElements[i].classList.toggle('tab-button-selected');
            }
        }

        state.selectedTab = tabName;

         // if opening map, check whether to turn on markers
        if (tabName == 'map' && gpsMarker) {
            if (document.getElementById('gps').checked == false)
                gpsMarker.setVisible(false);
            else
                gpsMarker.setVisible(true);
        }
		
		if (tabName == 'map') {
            if (document.getElementById('bluephone').checked == false)
                bluephones.forEach(bp => bp.setVisible(false));
            else
                bluephones.forEach(bp => bp.setVisible(true));
			
			if (document.getElementById('shuttle').checked == false)
                shuttles.forEach(st => st.setVisible(false));
            else
                shuttles.forEach(st => st.setVisible(true));
        }
		
		// if opening watchlist, check if there's any route
		if (tabName == 'watchlist'){
			for (let i = 0; i < cards.length; i++) {
				console.log(cards[i].style.display);
				if (cards[i].style.display != "none")
					document.getElementById("noroutes").style.display = "none"
			}
		}
    }
}

function isOnObstruction(polyline) {
    for (let i = 0; i < obstructions.length; i++) {
        if (google.maps.geometry.poly.isLocationOnEdge(obstructions[i], polyline, 5 * 10e-5)) {
            return true;
        }
    }
    return false;
}

function checkRoutes(result) {
    let promises = [];
    console.log(result.routes);
    result.routes.forEach(route => {
        promises.push(new Promise((resolve => {
            /*const polyline = new google.maps.Polyline({
                path: route.overview_path
            });
            if (isOnObstruction(polyline)) {;
                resolve(nul);
            }*/
            resolve(route);
        })));
    });

    return new Promise((resolve, _) => {
        Promise.all(promises).then(routes => {
            console.log(routes);
            result.routes = routes.filter(r => r !== null);
            resolve(result);
        });
    });
}

function showDirections() {
    const resultContainer = document.getElementById('search-results-container');
    resultContainer.style.visibility = 'hidden';
    document.getElementById('pac-input').onfocus = () => {
        resultContainer.style.visibility = 'visible';
        document.getElementById('pac-input').onfocus = () => null;
    };
    
    directions.route({
        destination: toLoc.marker.getPosition(),
        origin: frLoc.marker.getPosition(),
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true
    }).then(result => {
        if (result.status === google.maps.DirectionsStatus.OK) {
            checkRoutes(result).then(validRoutes => {
                    directionsRenderer.setDirections(validRoutes);
                    directionsRenderer.setMap(map);
                    document.getElementById('directions').style.visibility = 'visible';
            });
        }
    });
	
	document.getElementById('add-route').style.visibility = 'visible';
}

function setToLoc(name, latLng) {
    clearLoc(toLoc);
    toLoc.marker.setPosition(latLng);
    toLoc.marker.setMap(map);
    toLoc.name = name;
    toLoc.active = true;
    
    if (frLoc.active) {
        if (frLoc.name === toLoc.name) {
            clearLoc(frLoc);
        } else {
            showDirections();
        }
    }

}

function setFrLoc(name, latLng) {
    clearLoc(frLoc);
    frLoc.marker.setPosition(latLng);
    frLoc.marker.setMap(map);
    frLoc.name = name;
    frLoc.active = true;
    
    if (toLoc.active) {
        if (frLoc.name === toLoc.name) {
            clearLoc(toLoc);
        } else {
            showDirections();
        }
    }

}

function requestAutocomplete() {
    const request = {
        input: document.getElementById('pac-input').value,
        bounds: ubcBbox.latLngBounds,
    };

    const resultContainer = document.getElementById('search-results-container');

    if (request.input === '') {
        resultContainer.innerHTML = '';
        resultContainer.style.visibility = 'hidden';
        return;
    }

    const addResults = detailResults => {
        resultContainer.innerHTML = '';
        if (detailResults.length > 0) {
            resultContainer.style.visibility = 'visible';

            detailResults.forEach((item, i) => {
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('search-result');
                if (i < detailResults.length - 1) {
                    resultDiv.classList.add('search-result-underline');
                }

                const textDiv = document.createElement('div');
                textDiv.innerHTML = item.description;
                textDiv.style.width = '50%';
                resultDiv.appendChild(textDiv);

				const frDiv = document.createElement('button');
                frDiv.innerHTML = 'leave from';
                frDiv.classList.add('go-button');
                frDiv.onclick = () => {
                    map.panToBounds(item.geometry.viewport);
                    
                    clearLoc(frLoc);
                    setFrLoc(item.description, item.geometry.location);
                };
                resultDiv.appendChild(frDiv);
				
                const toDiv = document.createElement('button');
                toDiv.innerHTML = 'go to';
                toDiv.classList.add('go-button');
                toDiv.onclick = () => {
                    map.panToBounds(item.geometry.viewport);
                    
                    clearLoc(toLoc);
                    setToLoc(item.description, item.geometry.location);
                };
                resultDiv.appendChild(toDiv);

                resultContainer.appendChild(resultDiv);
            });
        } else {
            resultContainer.style.visibility = 'hidden';
        }
    }

    if (request.input in state.previousSearches) {
        addResults(state.previousSearches[request.input]);
        return;
    }

    autocomplete.getPlacePredictions(request, results => {
        if (results === null) {
            resultContainer.innerHTML = '';
            resultContainer.style.visibility = 'hidden';
            return;
        }
        let promises = [...Array(results.length).keys()].map(i => new Promise((resolve, reject) => {
            places.getDetails({ placeId: results[i].place_id }, (itemDetails, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    itemDetails.description = results[i].description;
                    resolve(itemDetails);
                } else {
                    resolve(null)
                }
            });
        }));

        Promise.all(promises).then(detailResults => {
            detailResults = detailResults.filter(itemDetails => {
                if (itemDetails === null) {
                    return false;
                }
                const lat = itemDetails.geometry.location.lat();
                const lng = itemDetails.geometry.location.lng();
                const north = ubcBbox.latLngBounds.north;
                const south = ubcBbox.latLngBounds.south;
                const east = ubcBbox.latLngBounds.east;
                const west = ubcBbox.latLngBounds.west;
                return north >= lat && lat >= south && east >= lng && lng >= west;
            });

            state.previousSearches[request.input] = detailResults;
            addResults(detailResults);
        });
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: ubcCenter,
        zoom: startZoom,
        restriction: ubcBbox,
        disableDefaultUI: true,
        rotateControl: true,
        heading: 90,
    });

    places = new google.maps.places.PlacesService(map);

    autocomplete = new google.maps.places.AutocompleteService();
    document.getElementById('pac-input').oninput = requestAutocomplete;

    directions = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions'),
        suppressMarkers: true,
        preserveViewport: true
    });
	google.maps.event.addListener(directionsRenderer, 'routeindex_changed', function(){
		curRoute = this.getDirections().routes[this.getRouteIndex()];   
	});

    initObstructions();
	initBluePhones();
	initShuttles();

    frLoc = {
        marker: new google.maps.Marker({
                    icon: {
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 12,
                        fillOpacity: 1,
                        strokeWeight: 5,
                        fillColor: '#17ba0f',
                        strokeColor: '#ffffff',
                    },
                }),
        name: null,
        active: false
    };
    toLoc = {
        marker: new google.maps.Marker({
                    icon: {
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale: 12,
                        fillOpacity: 1,
                        strokeWeight: 5,
                        fillColor: '#f51bf1',
                        strokeColor: '#ffffff',
                    },
                }),
        name: null,
        active: false
    };
}

function initObstructions() {
    for (var i = 0; i < obstructions.length; i++) {
        new google.maps.Marker({
            position: obstructions[i],
            map: map,
            icon: {
                url: "http://maps.google.com/mapfiles/kml/shapes/caution.png",
				scaledSize: new google.maps.Size(40, 40)
            },
        });
    }
}

function initBluePhones() {
    for (var i = 0; i < bluephoneLocs.length; i++) {
        bluephones.push(new google.maps.Marker({
            position: bluephoneLocs[i],
            map: map,
            icon: {
				url: "https://svg-clipart.com/svg/icon/Bv6TUGR-emergency-telephone-blue-vector.svg",
				scaledSize: new google.maps.Size(40, 50)
			}
        }));
    }
}

function initShuttles() {
    for (var i = 0; i < shuttleLocs.length; i++) {
        shuttles.push(new google.maps.Marker({
            position: shuttleLocs[i],
            map: map,
            icon: {
				url: "http://maps.google.com/mapfiles/kml/shapes/bus.png",
				scaledSize: new google.maps.Size(45, 45)
			}
        }));
    }
}

function updateGPS() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (gpsMarker) {
                gpsMarker.setMap(null);
            }

            gpsMarker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: 10,
                    fillOpacity: 1,
                    strokeWeight: 5,
                    fillColor: '#0390fc',
                    strokeColor: '#ffffff',
                },
            });
  
          },
          () => {
              console.log('Failed to get GPS coordinates.')
          }
        );
      }
}

function initPage() {
    initMap();
    pref = document.getElementById('slippylist');
    new Slip(pref);
    pref.addEventListener('slip:reorder', function(e) {
           e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);
		   
		   // re-color
		   let separatorY = document.getElementById('separator').offsetTop;
		   if(e.target.offsetTop < separatorY)
			   e.target.style.color = 'black';
		   else
			   e.target.style.color = 'gray';
           return false;
    }, false);

    state = {
        selectedTab: 'none',
        previousSearches: {'': []}
    };

    openTab(null, 'map');

    updateGPS();
    setInterval(updateGPS, 60 * 1000);
}

function selectSearchInput() {
    document.getElementById('pac-input').focus();
}

function clearSearchText() {
    document.getElementById('pac-input').value = '';
    requestAutocomplete();
    clearLoc(toLoc);
    clearLoc(frLoc);
    directionsRenderer.setMap(null);
    document.getElementById('directions').style.visibility = 'hidden';
    document.getElementById('pac-input').onfocus = () => null;
}

function clearLoc(loc) {
    loc.marker.setMap(null);
    loc.name = null;
    loc.active = false;
	document.getElementById('add-route').style.visibility = 'hidden';
}

function copyLatLng(loc){
	var LatLng = loc.marker.position.toString().replace("(", "").replace(")", "").split(", ")
	var Lat = parseFloat(LatLng[0]);
	var Lng = parseFloat(LatLng[1]);
	return new google.maps.LatLng(Lat, Lng)
}

function addThisRoute(){
    // get two endpoints, route and route's summary
	let destinations = frLoc.name.split(',')[0] + ' to ' + toLoc.name.split(',')[0];
	let route = "Through "+curRoute.summary;
	
    // check if route has obstructions
	let status;
	const polyline = new google.maps.Polyline({
                path: curRoute.overview_path
            });
	if(isOnObstruction(polyline) == true)
		status = 'path obstructed';
	else
		status = 'clear';
	
    // call addToWatchlist
	addToWatchlist(destinations, route, status);
	
	// save whatever info needed to show alternative routes in watchlist[]
	watchlist.push({from:frLoc.name, fromPos: copyLatLng(frLoc), to:toLoc.name, toPos: copyLatLng(toLoc), route:curRoute});
}

function reopenMap(id){
	openTab(null, "map");
	entry = watchlist[id]
	setFrLoc(entry.from, entry.fromPos);
	setToLoc(entry.to, entry.toPos);
}

function addToWatchlist(destinations, route, status){
    var id = watchlist.length;
    var parent = document.getElementById('watchlist-container')
	var card = document.createElement('div');
    card.setAttribute('class', 'card');
    card.setAttribute('id', id);
    if (status != 'clear')
        card.setAttribute('style', 'background-color: #f7e6e4;');

    // text on the left half
    let inner = document.createElement('div');
    inner.setAttribute('style', 'width:78%; display:inline-block;');
    inner.innerHTML = '<p class="tight">' + destinations + '</p> \
        <p class="tight" style="font-size:220%">' + route + '</p> \
        <p class="tight" style="font-size:220%">Status: <b>' + status + '</b></p>';

    // buttons on the right half
    let mapBtn = document.createElement('button');
    mapBtn.setAttribute('class', 'btn');
    mapBtn.setAttribute('onclick', 'reopenMap(+'+id+')');
    mapBtn.innerHTML = '<i class="fa fa-map-marker"></i>';
    
    let delBtn = document.createElement('button');
    delBtn.setAttribute('class', 'btn');
    delBtn.setAttribute('onclick', 'document.getElementById('+ id +').style.display = "none"');
    delBtn.innerHTML = '<i class="fa fa-trash"></i>';

    card.appendChild(inner);
    card.appendChild(mapBtn);
    card.appendChild(delBtn);
    parent.appendChild(card);
    cards.push(card);
}

function toggleTabs(button) {
    button.classList.toggle('change');
    const tabs = document.getElementById('tab-buttons');
    if (tabs.style.visibility === 'hidden') {
        tabs.style.visibility = 'visible';
    } else {
        tabs.style.visibility = 'hidden';
    }
}