// Constants
const ubcCenter = { lat: 49.26216764154615, lng: -123.2473569860864 };
const ubcBbox = { latLngBounds: { north: 49.28269032166297, south: 49.24774036527002, west: -123.25891308491284, east: -123.23728520385245 },
    strictBounds: false };
const startZoom = 14.5;

// Objects
let map;

// State
let state;

function openTab(_, tabName) {
    if (state.selectedTab === tabName) {
        if (tabName === 'map') {
            map.panTo(ubcCenter);
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
                tabButtonElements[i].style.backgroundColor = '#d0d4d6';
            } else {
                tabButtonElements[i].style.backgroundColor = '#f8f9fa';
            }
        }

        state.selectedTab = tabName;
    }
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: ubcCenter,
        zoom: startZoom,
        restriction: ubcBbox,
        disableDefaultUI: true
    });

    state = {
        selectedTab: '',
    };

    openTab(null, 'map');
}