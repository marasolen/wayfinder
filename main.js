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

// Objects
let map;
let places;
let autocomplete;
let directions;
let directionsRenderer;
let pref;
let gpsMarker;
let cards = [];

let frLoc;
let toLoc;

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

         // if opening map, check whether to turn on self-marker
        if (tabName == 'map' && gpsMarker) {
            if (document.getElementById('gps').checked == false)
                gpsMarker.setVisible(false);
            else
                gpsMarker.setVisible(true);
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
            const polyline = new google.maps.Polyline({
                path: route.overview_path
            });
            if (isOnObstruction(polyline)) {
                resolve(null);
            }
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
	
	document.getElementById("add-route").style.visibility = 'visible';
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

    initObstructions();

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
	
	// one dummy watchlist entry
	// TODO: add whatever info needed to watchlist[] and pass that to addToWatchlist
	addToWatchlist("ICICS Building to AMS Student Nest", "E Mall S and Main Mall", "path obstructed");
}

function initObstructions() {
    for (var i = 0; i < obstructions.length; i++) {
        new google.maps.Marker({
            position: obstructions[i],
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillOpacity: 1,
                strokeWeight: 2,
                fillColor: '#fc0303',
                strokeColor: '#ffffff',
            },
        });
    }
}

function initPage() {
    initMap();
    pref = document.getElementById('slippylist');
    new Slip(pref);
    pref.addEventListener('slip:reorder', function(e) {
           e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);
           console.log(pref);
           return false;
    }, false);

    state = {
        selectedTab: 'none',
        previousSearches: {'': []}
    };

    openTab(null, 'map');

    setInterval(function() {
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
    }, 60 * 1000);
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
	document.getElementById("add-route").style.visibility = 'hidden';
}

function addThisRoute(){
    // get two endpoints, route and route's summary
	let destinations = frLoc.name.split(",")[0] + " to " + toLoc.name.split(",")[0];
	let route = "TBD";
	
    // check if route has obstructions
	let status = "clear"; // default to clear for now
	/* if(isOnObstruction(polyline) == true)
		let status = "path obstructed";
	else
		let status = "clear";*/
	
    // call addToWatchlist
	addToWatchlist(destinations, route, status);
	
	// save whatever info needed to show alternative routes in watchlist[]
}

function addToWatchlist(destinations, route, status){
    var id = cards.length;
    var parent = document.getElementById("watchlist-container")
	var card = document.createElement("div");
    card.setAttribute("class", "card");
    card.setAttribute("id", id);
    if (status != "clear")
        card.setAttribute("style", "background-color: #f7e6e4;");

    // text on the left half
    let inner = document.createElement("div");
    inner.setAttribute("style", "width:78%; display:inline-block;");
    inner.innerHTML = "<p class='tight'>" + destinations + "</p> \
        <p class='tight' style='font-size:220%'>" + route + "</p> \
        <p class='tight' style='font-size:220%'>Status: <b>" + status + "</b></p>";

    // buttons on the right half
    let mapBtn = document.createElement("button");
    mapBtn.setAttribute("class", "btn");
    mapBtn.setAttribute("onclick", "openTab(event, 'map')"); // TODO: actually show the route
    mapBtn.innerHTML = "<i class='fa fa-map-marker'></i>";
    
    let delBtn = document.createElement("button");
    delBtn.setAttribute("class", "btn");
    delBtn.setAttribute("onclick", "document.getElementById("+ id +").style.display = 'none'");
    delBtn.innerHTML = "<i class='fa fa-trash'></i>";

    card.appendChild(inner);
    card.appendChild(mapBtn);
    card.appendChild(delBtn);
    parent.appendChild(card);
    cards.push(card);
}