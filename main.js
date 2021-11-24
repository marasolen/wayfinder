// Constants
const ubcCenter = { lat: 49.26216764154615, lng: -123.2473569860864 };
const ubcBbox = { latLngBounds: { north: 49.30, south: 49.22, west: -123.27, east: -123.22 },
    strictBounds: false };
const startZoom = 14.5;

// Objects
let map;
let places;
let autocomplete;
let pref;

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
            if (tabButtonElements[i].id.includes(tabName) || tabButtonElements[i].id.includes(state.selectedTab)) {
                tabButtonElements[i].classList.toggle('tab-button-selected');
            }
        }

        state.selectedTab = tabName;
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
                const resultDiv = document.createElement('button');
                resultDiv.classList.add('search-result');
                if (i < detailResults.length - 1) {
                    resultDiv.classList.add('search-result-underline');
                }
                resultDiv.innerHTML = item.description;
                console.log(resultDiv.innerHTML);
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
        rotateControl: true
    });

    places = new google.maps.places.PlacesService(map);

    autocomplete = new google.maps.places.AutocompleteService();
    document.getElementById('pac-input').oninput = requestAutocomplete;
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
}

function selectSearchInput() {
    document.getElementById('pac-input').focus();
}

function clearSearchText() {
    document.getElementById('pac-input').value = '';
    requestAutocomplete();
}
