// Constants
const ubcCenter = [ -123.2473569860864, 49.26216764154615 ];
const ubcBbox = [ -123.26891308491284, 49.23774036527002, -123.22728520385245, 49.29269032166297 ];
const startZoom = 14.5;

// Objects
let map;

// State
let state;

function openTab(_, tabName) {
    const tabElements = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabElements.length; i++) {
        if (tabElements[i].id.includes(tabName)) {
            tabElements[i].style.visibility = 'visible';
        } else {
            tabElements[i].style.visibility = 'hidden';
        }
    }

    if (state.selectedTab === tabName && tabName === 'map') {
        map.easeTo({center: ubcCenter, zoom: startZoom, bearing: 0, pitch: 0});
    }

    state.selectedTab = tabName;
}

window.onload = () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFyYXNvbGVuIiwiYSI6ImNrd2JjeThwMjRid2cyd3BhbTA5M3ZxeGkifQ.3CoiVRdIn5mjproeHoDuwQ';

    map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: ubcCenter,
        zoom: startZoom,
        pitchWithRotate: false,
        maxBounds: ubcBbox
    });

    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            bbox: ubcBbox,
            fuzzyMatch: true,
            routing: true
        })
    );

    state = {
        selectedTab: 'map',
    };
}