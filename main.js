// Constants
const ubcCenter = { lat: 49.26216764154615, lng: -123.2473569860864 };
const ubcBbox = { latLngBounds: { north: 49.30, south: 49.22, west: -123.27, east: -123.22 },
    strictBounds: false };
const startZoom = 14.5;

// Objects
let map;

// State
let state;

// Draggable list
var pref = document.getElementById('slippylist');
new Slip(pref);
pref.addEventListener('slip:reorder', function(e){
        e.target.parentNode.insertBefore(e.target, e.detail.insertBefore);
        console.log(pref);
        return false;
}, false);

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
    }
}

function initAutocomplete() {

    // Create the search box and link it to the UI element.
    const input = document.getElementById("pac-input");
    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.setOptions({
        strictBounds: true,
    });
    autocomplete.setBounds(ubcBbox.latLngBounds);

    const marker = new google.maps.Marker({
        map,
        anchorPoint: new google.maps.Point(0, -29),
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    autocomplete.addListener("place_changed", () => {
        marker.setVisible(false);

        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setZoom(17);
            map.panTo(place.geometry.location);
        }

        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
    });
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: ubcCenter,
        zoom: startZoom,
        restriction: ubcBbox,
        disableDefaultUI: true,
        rotateControl: true
    });

    state = {
        selectedTab: '',
    };

    initAutocomplete();
}

function initPage() {
    initMap();

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