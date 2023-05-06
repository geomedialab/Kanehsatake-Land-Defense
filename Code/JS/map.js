var map = L.map('map',
    {
        minZoom: 10,
        maxBounds:[[45.943618, -74.272889],[45.422965, -73.860249]],
        center: [45.569934, -74.082510],
        zoom: 10,
        timeDimension: true,
        timeDimensionOptions: {
            timeInterval: "2014/1960",
        },
        timeDimensionControl: true,
    });

var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});

Stadia_AlidadeSmoothDark.addTo(map);

var cadasterStyle = {
    "color": "#ff7800",
    "weight": 0.5,
    "opacity": 1,
};

fetch('../Data/GeoJSON/Full_Cadaster.geojson')
    .then((response) => response.json())
    .then((data) => cadasterData = data)
    .then(() => {
        // Create the popups
        L.geoJSON(
            cadasterData,
            setOptions = {
                style: cadasterStyle,
                onEachFeature: function (feature, layer) {
                    // Capitalize the first word of original deed sale variable
                    const word = feature.properties.ORIGINAL_A
        
                    const capitalized =
                      word.charAt(0)
                      + word.slice(1).toLowerCase()
        
        
                    layer.bindTooltip(
                    `<center><h2>Lot number ${feature.properties.LOT_NUMBER}</h2><h3>Sold ${feature.properties.DATE_MM_DD}</center></h3>
                    Sold by: ${feature.properties.SOLD_BY}<br>
                    Sold to: ${feature.properties.CONCEDED_T}<br>
                    Notes: ${feature.properties.NOTES}<br><br>
                    Found original sale: ${capitalized}`,
                    {
                        sticky: true,
                        opacity: 0.8,
                    });
                }
            }).addTo(map);
        
      });


// timeline
// var L.timeline();
