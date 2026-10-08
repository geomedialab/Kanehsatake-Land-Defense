
var zoom = 9
var center = [45.631550, -73.509463];


// Variables for timeline
const interval = 1000;
const earliestDate = 1770;
const range = 10;
// Used to cancel timeline animation if Reset Map is pressed, eventually gets populated with multiple timeout IDs
var timeouts = [];

const dataBaseUrl = 'https://geomedialab.github.io/Kanehsatake-Land-Defense'

function viewFullMap() {
    scrollToTop();
    var introBox = document.querySelector("#intro-box");
    var queryBox = document.querySelector("#query-box");
    var geocoding = document.getElementById("geocoding-decoration");


    document.getElementById("kanehsatake-legend-item").style.opacity = 1;

    var state = document.querySelector("#state");
    var state2 = document.querySelector("#state2");
    if (document.getElementById("phase-legend")) {
        document.getElementById("phase-legend").style.display = "none";
    }
    var language = checkLanguage();
    function setUpQueryMap() {
        document.getElementById("no-address").style.display = "none";
        document.getElementById("not-in-polygon").style.display = "none";
        resetTimeline();
        resetLayersTimeline();
        timelineMap.flyToBounds(cadasterLayer, { paddingBottomRight: [500, 0] });
        addCadaster(timelineMap);
        addKanehsatakeToTimeline();

        introBox.style.opacity = 0;
        queryBox.style.opacity = 100;
        geocoding.style.display = "block"

        introBox.style.display = 'none';
        queryBox.style.display = 'block';
        zoomControl.addTo(timelineMap)
        turnOnMapInteraction(timelineMap, "timeline-map")
    }

    if (language == "french") {
        // Show query map
        if (state2.innerHTML == "LA CARTE") {
            setUpQueryMap();
            state2.innerHTML = "LA CHRONOLOGIE";

            // Show Timeline
        } else {
            startTimeDisplay();
            timelineMap.removeControl(zoomControl)

            introBox.style.opacity = 100;
            queryBox.style.opacity = 0;
            introBox.style.display = "block";
            queryBox.style.display = "none";
            geocoding.style.display = "none";

            timelineMap.flyToBounds(cadasterLayer, { paddingBottomRight: [550, 0] })
            state2.innerHTML = "LA CARTE";
            turnOffMapInteraction(timelineMap, "timeline-map")
        }
    } else {
        // Show Query Map
        if (state.innerHTML == "VIEW FULL MAP") {
            setUpQueryMap();
            state.innerHTML = "VIEW TIMELINE"

            // Show Timeline
        } else {
            startTimeDisplay();
            timelineMap.removeControl(zoomControl)

            introBox.style.opacity = 100;
            queryBox.style.opacity = 0;
            introBox.style.display = "block";
            queryBox.style.display = "none";
            geocoding.style.display = "none";

            timelineMap.flyToBounds(cadasterLayer, { paddingBottomRight: [550, 0] })
            state.innerHTML = "VIEW FULL MAP"
            turnOffMapInteraction(timelineMap, "timeline-map")
        }
        resetTimeline();
        resetLayersTimeline();

    }
}

var timelineMap = L.map('timeline-map',
    {
        center: center,
        zoom: zoom,
        zoomControl: false,
        fullScreenControl: false,
        attributionControl: false,
        zoomSnap: 0.25,
    });
timelineMap.scrollWheelZoom.disable();
const zoomControl = L.control.zoom({
    position: 'topleft'
})

// Layer control must reference different layers see #3 : https://store.extension.iastate.edu/product/15632.pdf
// Layer control is actually created and added in the addIndigLands function

const Esri_WorldImagery1 = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
);


var darkBasemap1 = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_4ect_1_e2fe39e91999d73ffc1d23a2',
    {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        zIndex: 10,
    }
).addTo(timelineMap);


// This is a convoluted function that adds IndigLandsLayer to the basemaps but is also in charge of creating the basemap control features
// It's not great coding but it works
function addIndigLands() {
    fetch(dataBaseUrl + '/data/geojson/Indig_lands_clipped.geojson')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Indigenous lands data request failed: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
                throw new Error('Indigenous lands data is not a valid GeoJSON FeatureCollection');
            }

            indigLandsData = {
                ...data,
                features: data.features.filter((feature) => feature.properties?.Slug === 'mohawk')
            };

            if (indigLandsData.features.length === 0) {
                throw new Error('No Mohawk feature found in Indigenous lands data');
            }

            var indigLandsLayer = L.geoJSON(
                indigLandsData,
                {
                    onEachFeature: onEachFeatureIndigLands,
                    attribution: "Native Land Digital"
                }
            );
            // The order within these determines which is initialized on top.
            // The lower one gets rendered as on top of the other ones so is the first layer the user will see.
            const overlays1 = {
                "<p class='english'>Mohawk Indigenous Lands<br>Source: <a style='display: contents' href='https://native-land.ca/' target='_blank'>Native-Land.ca</a></p>\
                <p class='french'>Terres autochtones Mohawks<br>Source: <a style='display: contents' href='https://native-land.ca/' target='_blank'>Native-Land.ca</a></p>": indigLandsLayer
            }
            const basemaps1 = {
                "<p class='english'>Satellite Basemap</p><p class='french'>Carte de base satellite</p>": Esri_WorldImagery1,
                "<p class='english'>Dark Basemap</p><p class='french'>Carte de base noir</p>": darkBasemap1,
            }

            L.control.layers(basemaps1, overlays1, { position: 'topleft' }).addTo(timelineMap);
        })
        .catch((error) => {
            console.warn('Mohawk Indigenous lands layer unavailable:', error);
        });
}


// Styling parameters
var cadasterColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--cadaster-color');
var purpleColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--purple-color');
var orangeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--orange-color');
var queryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary-color');
var blackColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--black-color');

const fullCadasterStyle = {
    "color": cadasterColor,
    "weight": 0.5,
    "opacity": 0.5,
};

const queryStyle = {
    "color": queryColor,
    "fillColor": queryColor,
    "weight": 0.6,
    "opacity": 1,
}

var timelineStyle = {
    "color": getComputedStyle(document.documentElement)
        .getPropertyValue('--white-color'),
    "weight": 1,
    "opacity": 0,
    "fillOpacity": 0
}

const kanehsatakeStyle = {
    "color": purpleColor,
    "weight": 1,
    "opacity": 1,
}

const invisibleCadasterStyle = {
    "weight": 0,
    "opacity": 0,
}


function addCadaster(map) {
    fetch(dataBaseUrl + '/data/geojson/Full_Cadaster.geojson')
        .then((response) => response.json())
        .then((data) => cadasterData = data)
        .then(() => {
            // Create the popups
            cadasterLayer = L.geoJSON(
                cadasterData,
                setOptions = {
                    style: fullCadasterStyle,
                    onEachFeature: onEachFeatureCadaster,
                }
            ).addTo(map);
        });
}

// Only used to flyToBounds of cadaster layer on initial load so center and zoom of map are screen size appropriate
function addInvisibleCadaster(map) {
    fetch(dataBaseUrl + '/data/geojson/Full_Cadaster.geojson')
        .then((response) => response.json())
        .then((data) => cadasterData = data)
        .then(() => {
            // Dynamically build selection options for queries
            // This lets the data be "alive" by accepting any new geoJSON after being run through Exploration.ipynb
            createSoldToIndex("buyerQuery")
            createConceededByIndex("conceededByQuery")
            createorigAIndex("originalAQuery")
            createNumEnregiIndex("numEnregiQuery");


            // Create the popups
            cadasterLayer = L.geoJSON(
                cadasterData,
                setOptions = {
                    style: invisibleCadasterStyle,
                    onEachFeature: onEachFeatureCadaster,
                }
            ).addTo(map);

            timelineMap.flyToBounds(cadasterLayer, { paddingBottomRight: [500, 0] })
            timelineMap.removeLayer(cadasterLayer);
        });
}

// Used to fade in the Kanehsatake layer in timeline
function addKanehsatakeToTimeline() {
    fetch(dataBaseUrl + '/data/geojson/kanehsatake.geojson')
        .then((response) => response.json())
        .then((r) => kanehsatakeData = r)
        .then(() => {
            kanehsatakeLayer = L.geoJSON(
                kanehsatakeData,
                setStyle = {
                    "fillColor": purpleColor,
                    "color": blackColor,
                    "weight": 1,
                    "opacity": 0,
                    "fillOpacity": 0,
                }
            ).addTo(timelineMap);

            fadeInLayerLeaflet(kanehsatakeLayer, 0, 0.5, 0.01, interval / 100);
        });
}

// Georeferencing check for where to place marker if it's within the polygon
function pointInPoly(marker) {
    const latLng = marker.getLatLng();
    var numberOfLots = 0
    cadasterLayer.eachLayer(function (indivLot) {
        if (indivLot.contains(latLng)) {

            displayQueryResults([indivLot.feature], timelineMap)
            numberOfLots += 1
            marker.addTo(timelineMap);
            scrollToTop();
        }
    })
    if (numberOfLots == 0) {
        document.getElementById("not-in-polygon").style.display = "block";
    } else {
        document.getElementById("not-in-polygon").style.display = "none";
    }
}

// Bottom left legend details
const cadasterLegend = L.control({ position: 'bottomleft' });
cadasterLegend.onAdd = function () {
    var div = L.DomUtil.create('div', 'info legend');
    div.id = "timeline-legend"
    div.style.backgroundColor = "transparent";
    div.style.color = cadasterColor;
    div.style.whitespace = "nowrap";
    labels = [],
        categories = [
            '<i class="gradient-line" style="background-image: linear-gradient(to right, #1c1c1c, #FFFFFF);"></i>' + '<div class="english machina">Mohawk Land granted to settlers</div><div class="french machina">La terre des Mohawks accordée aux colons</div>',
            '<div id="kanehsatake-legend-item" style="opacity: 0;"><i style="background:' + purpleColor + '"></i>' + '<div class="english machina">Kanehsatà:ke today</div><div class="french machina">Kanehsatà:ke aujourd\'hui</div></div>',
        ];

    for (var i = 0; i < categories.length; i++) {
        div.innerHTML +=
            labels.push(categories[i])
    }
    div.innerHTML = labels.join("");
    return div;
}

//Function to create gradient color array given start colow, end color, and # of steps
function gradient(startColor, endColor, steps) {
    var start = {
        'Hex': startColor,
        'R': parseInt(startColor.slice(1, 3), 16),
        'G': parseInt(startColor.slice(3, 5), 16),
        'B': parseInt(startColor.slice(5, 7), 16)
    }
    var end = {
        'Hex': endColor,
        'R': parseInt(endColor.slice(1, 3), 16),
        'G': parseInt(endColor.slice(3, 5), 16),
        'B': parseInt(endColor.slice(5, 7), 16)
    }
    diffR = end['R'] - start['R'];
    diffG = end['G'] - start['G'];
    diffB = end['B'] - start['B'];

    stepsHex = new Array();
    stepsR = new Array();
    stepsG = new Array();
    stepsB = new Array();

    for (var i = 0; i <= steps; i++) {
        stepsR[i] = start['R'] + ((diffR / steps) * i);
        stepsG[i] = start['G'] + ((diffG / steps) * i);
        stepsB[i] = start['B'] + ((diffB / steps) * i);
        stepsHex[i] = '#' + Math.round(stepsR[i]).toString(16) + '' + Math.round(stepsG[i]).toString(16) + '' + Math.round(stepsB[i]).toString(16);
    }
    return stepsHex;

}

const linearStartStop = ['#1c1c1c', '#FFFFFF']

var timelineGradient = gradient(linearStartStop[0], linearStartStop[1], 19)


// Meat and potatoes of the timeline function
function timeDisplay(data, previousYear, liveYear, index) {

    // Remove bottom left year range if it exists
    var elements = document.getElementsByClassName('year-legend');
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
    // Create and add Years to top right
    var yearLegend = L.control({ position: 'bottomleft' });
    yearLegend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend year-legend');
        div.id = "year-legend"

        div.innerHTML = '' + previousYear + ' - ' + liveYear
        return div
    }
    yearLegend.addTo(timelineMap);
 

    // Check conditions, add to array
    const correctArray = [];
    for (var i = 0; i < data.features.length; i++) {
        const featureTime = data.features[i].properties.year;

        // Correct time check
        if ((featureTime > previousYear) && (featureTime <= (previousYear + range))) {
            // Don't include only part of the sale lot (inclusion by Lea May 15th)
            // These lots more or less line up with Kanehsatake today
            if (data.features[i].properties.ORIGINAL_A != "Only part of the lot") {
                correctArray.push(data.features[i])
            }
        }
    }

    var timelineStyle = {

        "fillColor": timelineGradient[index],
        "fillOpacity": 0,

        "color": "#000",
        "weight": 1,
        "opacity": 0,

        "interactive": false,
    }

    // Define layer with correct array as data
    timelineLayer = L.geoJSON(
        correctArray,
        timelineStyle
    ).addTo(timelineMap);
    // Fade that layer onto map over time
    fadeInLayerLeaflet(timelineLayer, timelineStyle.opacity, 0.8, 0.01, interval / 100)
    // Recursive call 
    if (liveYear <= 1960) {
        timeouts.push(setTimeout(() => { timeDisplay(data, liveYear, (liveYear + range), (index + 1)); }, interval + 500));
    } else {
        // Remove bottom left year range
        document.getElementById('year-legend').style.display = "none";
        addKanehsatakeToTimeline();
        document.getElementById("kanehsatake-legend-item").style.opacity = 1;
        timeouts.push(setTimeout(startTimeDisplay, 10000));
    }
}


// Shout out this guy: https://codepen.io/maptastik/pen/MZprRJ
function fadeInLayerLeaflet(lyr, startOpacity, finalOpacity, opacityStep, delay) {
    let opacity = startOpacity;
    setTimeout(function changeOpacity() {
        if (opacity < finalOpacity) {
            lyr.setStyle({
                fillOpacity: opacity,
                opacity: opacity
            });
            opacity = opacity + opacityStep
        }

        setTimeout(changeOpacity, delay);
    }, delay);
}

function resetLayersTimeline() {
    timelineMap.eachLayer(function (layer) {
        if (layer != darkBasemap1) {
            if (layer != Esri_WorldImagery1) {
                timelineMap.removeLayer(layer);
            }
        }
    });
}

function startTimeDisplay() {
    fetch(dataBaseUrl + '/data/geojson/Full_Cadaster.geojson')
        .then((response) => response.json())
        .then((data) => cadasterData = data)
        .then(() => {
            resetLayersTimeline();
            cadasterLegend.addTo(timelineMap);
            var language = checkLanguage();

            if (language == "french") {
                changeToFrench();
            }
            if (document.getElementById("query-legend")) {
                document.getElementById("query-legend").style.display = "none";
            }

            // Start the timeline animation
            timeDisplay(cadasterData, earliestDate, (earliestDate + range), 0);

            // If Reset Map is clicked during animation, end timeout
            document.getElementById("reset-map").addEventListener("click", function () {
                resetTimeline();
            });
        }
        );
}

function resetTimeline() {
    for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
    }
    var elements = document.getElementById("year-legend")
    elements.style.display = "none"
}


function resetMap() {
    // Remove stuff
    resetLayersTimeline();
    resetInputs();
    turnOnMapInteraction(timelineMap, "timeline-map");
    if (document.getElementById("phase-legend")) {
        document.getElementById("phase-legend").style.display = "none";
    }

    // Re-add stuff
    timelineMap.addLayer(kanehsatakeLayer);
    timelineMap.addLayer(cadasterLayer);

    document.getElementById("no-data").style.display = "none";
    document.getElementById("no-data-french").style.display = "none";
    document.getElementById("geocoding-search").value = "";

    document.getElementById("no-address").style.display = "none";
    document.getElementById("not-in-polygon").style.display = "none";

    document.getElementById("omit-year-query").checked = true;
    document.getElementById("greyed-out").style.zIndex = 9999;

    document.getElementById("timeline-legend").style.display = "block";
    if (document.getElementById("query-legend")) {
        document.getElementById("query-legend").style.display = "none";
    }

    var language = checkLanguage();
    if (language == "french") {
        changeToFrench();
    }

    scrollToTop();
    timelineMap.fitBounds(cadasterLayer.getBounds(), { paddingBottomRight: [400, 0] })
}

function displayQueryResults(queryResults, map) {
    // Styling variables
    queryLayer = L.geoJSON(
        queryResults,
        setOptions = {
            style: queryStyle,
            onEachFeature: onEachFeatureQuery
        });

    ghostLayer = L.geoJSON(
        cadasterData,
        setOptions = {
            style: {
                fillColor: '#1f1f1e',
                weight: 0.1,
                color: '#575654',
                fillOpacity: 0.3
            }
        }
    )
    var language = checkLanguage();


    map.addLayer(ghostLayer);
    map.addLayer(queryLayer);
    // Prevent duplicate legends on consecutive queries
    if (document.getElementById("query-legend")) {
        document.getElementById("query-legend").style.display = "none";
    }

    resetLayersTimeline();
    resetTimeline();

    document.getElementById("no-data").style.display = "none";
    document.getElementById("timeline-legend").style.display = "none";

    // Build legend for bottom left
    const queryLegend = L.control({ position: 'bottomleft' });
    queryLegend.onAdd = function () {
        var div = L.DomUtil.create('div', 'info legend');
        div.id = "query-legend"
        div.style.backgroundColor = "transparent";
        div.style.color = cadasterColor;
        div.style.whitespace = "nowrap";

        if (queryResults.length === 1) {
            var queryString = queryResults.length + " lot"
        } else {
            var queryString = queryResults.length + " lots"
        }
        div.innerHTML = '<div class="machina" id="query-legend-item"><i style="background:' + queryColor + '"></i>' + `<div class="english">Query results - ${queryString}</div><div class="french">Résultats de la requête - ${queryString}</div></div>`;
        return div;
    }

    queryLegend.addTo(timelineMap);
    if (language == "french") {
        changeToFrench();
    }
    // Center slightly to the right of cadaster to account for intro/query box
    map.flyToBounds(queryLayer.getBounds(), { duration: 1.5, paddingBottomRight: [500, 0] });


    map.addLayer(ghostLayer);
    map.addLayer(queryLayer);

    map.flyToBounds(queryLayer.getBounds(), { duration: 1.5 });
}

timelineMap.on('popupopen', function (e) {
    var language = checkLanguage();

    if (language == "english" || language == null) {
        changeToEnglish();
    }
    else if (language == "french") {
        changeToFrench();
    }
});

L.control.scale({position: "bottomright"}).addTo(timelineMap);

// Build popup and tooltips specific to Cadaster layer
var onEachFeatureCadaster = function (feature, layer) {
    buildPopup(feature, layer)
    layer.on('mouseover', function () {
        this.setStyle({
            'fillColor': queryColor,
            'color': queryColor,
        });
    });
    layer.on('mouseout', function () {
        this.setStyle({
            'fillColor': cadasterColor,
            'color': cadasterColor,
        });
    });
}


// Build popup and tooltips specific to QUERY layer
var onEachFeatureQuery = function (feature, layer) {
    buildPopup(feature, layer)
    layer.on('mouseover', function () {
        this.setStyle({
            'fillColor': "#923633",
        });
    });
    layer.on('mouseout', function () {
        this.setStyle({
            'fillColor': queryColor,
            'color': queryColor,
        });
    });
}

timelineMap.on('popupopen', function () {
    var language = checkLanguage();

    if (language == "english") {
        changeToEnglish();
    }
    else {
        changeToFrench();
    }
});


function buildPopup(feature, layer) {
    // Capitalize the first word of original deed sale variable
    const word = feature.properties.ORIGINAL_A
    const capitalized = word.charAt(0) + word.slice(1).toLowerCase()

    if (feature.properties.CONCEDED_T != null) {
        var wayOfSale = '<p class="english">Conceded on: </p><p class="french">Concédé: </p>'

        var soldOrConceeded = `<div class="english">By: ${feature.properties.CONCEDED_B}
                                     <br>To: ${feature.properties.CONCEDED_T}</div>\
                                     <div class="french">Par: ${feature.properties.CONCEDED_B}
                                     <br>À: ${feature.properties.CONCEDED_T}</div>`
    } else {
        var wayOfSale = '<div class="english">First sold on: </div>\
                             <div class="french">Vendu: </div>'

        var soldOrConceeded = `<div class="english">By: ${feature.properties.SOLD_BY}
                                    <br>To: ${feature.properties.SOLD_TO}</div>\
                                    <div class="french">Par: ${feature.properties.SOLD_BY}
                                    <br>À: ${feature.properties.SOLD_TO}</div>`
    }
    if (feature.properties.NOTES != null && feature.properties.NOTES.includes('part')) {
        var partOfLotString = '<div class="english">Part of lot number</div>\
                               <div class="french">Partie de lot numero</div>'
    }
    else {
        var partOfLotString = 'Lot'
    }
    layer.bindPopup(

        `<center>\
            <h2>${partOfLotString} ${feature.properties.LOT_NUMBER}</h2>\
        </center>` +

        // Correct order
        `<br>${wayOfSale} <span>${feature.properties.DATE_MM_DD}${soldOrConceeded}</span>\
        <br><div class="english">Lot size: </div><div class="french">Taille du lot: </div>${(feature.properties.Area_new_1 / 40.469).toFixed(2)} acres<br></b><br>` +

        '<i class="english">Information from the Land Registry of Quebec.</i>\
        <i class="french">Informations provenant du Registre foncier du Québec.</i><br>' +

        `<div class="english">Lot registration number: </div><div class="french">Numéro d'enregistrement du lot: </div>${feature.properties.NUM_ENREGI}<br>
            <div class="english">Found original sale: </div><div class="french">Vente originale trouvée: </div>${capitalized}
            <br>Notes: ${feature.properties.NOTES}`,
        // Styling tooltip Options
        {
            sticky: false,
            opacity: 0.8,
            closeButton: true
        }
    );
    layer.bindTooltip(`
     <center>
     <h2>${partOfLotString} ${feature.properties.LOT_NUMBER}</h2>
     </center>`);
}


var onEachFeatureIndigLands = function (feature, layer) {
    layer.setStyle({
        "color": purpleColor,
        "fillOpacity": 0.02,
        "weight": 2,
        "fillColor": purpleColor,
        "opacity": 1,
        'dashArray': '5',
    })

    layer.bindTooltip(`
    <center>
    <h2>${feature.properties.Name}</h2>
    </center>`,
        {
            sticky: true,
            opacity: 0.8,
            closeButton: true
        });


}

function turnOffMapInteraction(map, mapid) {
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();
    document.getElementById(mapid).style.cursor = 'default';
}
function turnOnMapInteraction(map, mapid) {
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    // map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();
    document.getElementById(mapid).style.cursor = 'grab';
}
function scrollToTop() {
    main = document.querySelector("html")
    main.scrollTo(0, 0);
}

function scrollToBottom() {
    main = document.querySelector("html")
    main.scrollTo(0, 100000);
}

function addPhaseLayer(phaseLayerName) {
    resetTimeline();
    if (document.getElementById("query-legend")) {
        document.getElementById("query-legend").style.display = "none";
    }

    document.getElementById("intro-box").style.display = "none";
    document.getElementById("query-box").style.display = "none";
    document.getElementById("timeline-legend").style.display = "none";
    document.getElementById("geocoding-decoration").style.display = "none";
    

    resetLayersTimeline();

    phaseNumber = phaseLayerName.split("_")[0]

    var minSliderTextValue = document.getElementById("minRangeValue");
    var maxSliderTextValue = document.getElementById("maxRangeValue");
    var minSliderValue = document.getElementById("min-slider");
    var maxSliderValue = document.getElementById("max-slider");

    var elements = document.getElementById("phase-legend");
    if (elements) {
        elements.style.display = "none"
    }

    fetch(dataBaseUrl + `/data/geojson/${phaseLayerName}`)
        .then((response) => response.json())
        .then((r) => phaseLayerData = r)
        .then(() => {
            L.geoJSON(
                phaseLayerData,
                setOptions = {
                    style: queryStyle,
                    onEachFeature: onEachFeatureQuery
                }
            ).addTo(timelineMap);

            // Build legend now

            var yearLegend = L.control({ position: 'bottomleft' });
            yearLegend.onAdd = function () {
                const div = L.DomUtil.create('div', 'info legend year-legend');
                div.id = "phase-legend"
                div.style = "margin-bottom: 25px; left: 0; line-height: 1.3;"
                if (phaseNumber == "First") {
                    startDate = 1780
                    endDate = 1809
                    // Having the french english divs gets complicated, maybe just show the years the user knows which phase they clicked
                    div.innerHTML = `<div class="english" style="font-size:2.5rem;">First Phase</div>\
                                     <div class="french" style="font-size:2.5rem;">Première Phase</div>\
                                     <div style="font-size:2rem;">${startDate} - ${endDate}</div>\
                                     <div style="font-size:1.2rem">${phaseLayerData.features.length} Lots</div>`
                } else if (phaseNumber == "Second") {
                    startDate = 1820
                    endDate = 1829
                    div.innerHTML = `<div class="english" style="font-size:2.5rem;">Second Phase</div>\
                                    <div class="french" style="font-size:2.5rem;">Seconde Phase</div>\
                                    <div style="font-size:2rem;">${startDate} - ${endDate}</div>\
                                    <div style="font-size:1.2rem">${phaseLayerData.features.length} Lots</div>`
                } else if (phaseNumber == "Third") {
                    startDate = 1860
                    endDate = 1889
                    div.innerHTML = `<div class="english" style="font-size:2.5rem;">Third Phase</div>\
                                     <div class="french" style="font-size:2.5rem;">Troisième Phase</div>\
                                     <div style="font-size:2rem;">${startDate} - ${endDate}</div>\
                                     <div style="font-size:1.2rem">${phaseLayerData.features.length} Lots</div>`
                }

                document.getElementById("greyed-out").style["z-index"] = -9999;
                document.getElementById("omit-year-query").checked = false;
                minSliderTextValue.innerHTML = startDate
                maxSliderTextValue.innerHTML = endDate
                minSliderValue.value = startDate
                maxSliderValue.value = endDate
                return div
            }
            yearLegend.addTo(timelineMap);
        });
    ghostLayer = L.geoJSON(
        cadasterData,
        setOptions = {
            style: {
                fillColor: '#1f1f1e',
                weight: 0.1,
                color: '#575654',
                fillOpacity: 0.3
            }
        }
    ).addTo(timelineMap);

    timelineMap.flyToBounds(cadasterLayer);
    scrollToTop();

    var language = checkLanguage();
    if (language == "french") {
        changeToFrench();
    }
}

addIndigLands();
turnOffMapInteraction(timelineMap, "timeline-map")
addInvisibleCadaster(timelineMap)

$(document).ready(function () { setTimeout(() => { startTimeDisplay() }, "1500"); })
