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
let pref;
let marker;

// State
let state;

function openTab(_, tabName) {
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
            if (tabButtonElements[i].id.includes(tabName)) {
                tabButtonElements[i].style.backgroundColor = '#cae1ed';
            } else {
                tabButtonElements[i].style.backgroundColor = '#f8f9fa';
            }
        }

        state.selectedTab = tabName;

         // if opening map, check whether to turn on self-marker
        if (tabName == 'map'){
            if (document.getElementById('gps').checked == false)
                marker.setVisible(false);
            else
                marker.setVisible(true);
        }
    }
}

function requestAutocomplete() {
    const request = {
        input: document.getElementById('pac-input').value,
        bounds: ubcBbox.latLngBounds,
    };

    autocomplete.getPlacePredictions(request, results => {
        results = results.forEach((item, i) => {
            places.getDetails({ placeId: item.place_id }, (itemDetails, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    console.log(itemDetails);
                    const lat = itemDetails.geometry.location.lat();
                    const lng = itemDetails.geometry.location.lng();
                    const north = ubcBbox.latLngBounds.north;
                    const south = ubcBbox.latLngBounds.south;
                    const east = ubcBbox.latLngBounds.east;
                    const west = ubcBbox.latLngBounds.west;
                    if (north >= lat && lat >= south && east >= lng && lng >= west) {

                    }
                }
            });
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
    });

    places = new google.maps.places.PlacesService(map);

    autocomplete = new google.maps.places.AutocompleteService();
    document.getElementById('pac-input').onchange = requestAutocomplete;

    marker = new google.maps.Marker({
        position: icics,
        map: map,
        icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 15,
            fillOpacity: 1,
            strokeWeight: 5,
            fillColor: '#0390fc',
            strokeColor: '#ffffff',
        },
    });

    initObstructions();
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
        selectedTab: '',
    };

    openTab(null, 'map');
}

function selectSearchInput() {
    document.getElementById('pac-input').focus();
}

function clearSearchText() {
    document.getElementById('pac-input').value = '';
}
