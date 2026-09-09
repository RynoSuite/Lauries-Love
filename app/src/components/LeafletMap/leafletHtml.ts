import colors from 'styles/colors';

/**
 * The map, as a self-contained web page rendered in a WebView.
 *
 * WHY NOT A NATIVE MAP: react-native-maps 1.20.1 is not Fabric-ready and threw
 * "this.getNativeComponent is not a function" from inside AIRMap, taking the
 * whole Connect screen down and preventing any marker from mounting. Upgrading
 * to 1.29 traded that for a different break (it targets a newer React Native
 * than 0.79). Native maps also cost an API key per platform — Android's
 * manifest still holds a placeholder — and give two different-looking maps,
 * neither matching the approved design, because Apple Maps cannot be styled.
 *
 * Leaflet in a WebView is the same map the web app ships: identical tiles,
 * identical green filter, identical magenta clusters, on both platforms, with
 * no keys and no native module to crash.
 *
 * The page talks to React Native over postMessage:
 *   in  — { type: 'markers', markers } | { type: 'flyTo', lat, lng, zoom }
 *   out — { type: 'markerPress', id } | { type: 'regionChange', bounds, zoom }
 *         | { type: 'ready' }
 */
export const leafletHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: ${colors.ground}; }

  /* Scoped to the basemap pane only, so markers and clusters keep their real
     colours. invert + hue-rotate(180deg) is the standard pair: inverting alone
     turns the map's blues orange, and rotating the hue back puts land and water
     near their original relationship while everything is now dark. The
     saturate and brightness trims stop it glowing against the Ink ground.
     Identical values to web/src/index.css, so the two maps match. */
  .leaflet-tile-pane {
    filter: invert(1) hue-rotate(180deg) brightness(0.86) contrast(0.92)
      saturate(0.55) sepia(0.12);
  }

  .leaflet-container { background: ${colors.ground}; }
  .leaflet-control-attribution {
    background: ${colors.surface}cc;
    color: ${colors.faint};
    font-size: 9px;
  }
  .leaflet-control-attribution a { color: ${colors.muted}; }
  .leaflet-control-zoom { display: none; }

  .marker-cluster { background: ${colors.magenta}59; }
  .marker-cluster div {
    background: ${colors.magenta};
    color: #fff;
    font-weight: 600;
    font-family: system-ui, sans-serif;
    box-shadow: 0 0 0 1px ${colors.magentaText}8c;
  }

  .ll-pin {
    width: 18px; height: 18px; border-radius: 50%;
    background: ${colors.magenta};
    border: 2px solid ${colors.magentaText};
    box-shadow: 0 0 0 4px ${colors.magenta}40;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var send = function (payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  };

  var map = L.map('map', { zoomControl: false, attributionControl: true })
    .setView([39.5, -98.35], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 18,
  }).addTo(map);

  var cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 45,
  });
  map.addLayer(cluster);

  function setMarkers(list) {
    cluster.clearLayers();
    (list || []).forEach(function (m) {
      if (m.latitude == null || m.longitude == null) return;
      var icon = L.divIcon({
        className: '',
        html: '<div class="ll-pin"></div>',
        iconSize: [18, 18],
      });
      var marker = L.marker([m.latitude, m.longitude], { icon: icon });
      marker.on('click', function () {
        send({ type: 'markerPress', id: m.id });
      });
      cluster.addLayer(marker);
    });
  }

  function reportRegion() {
    var b = map.getBounds();
    send({
      type: 'regionChange',
      zoom: map.getZoom(),
      bounds: {
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      },
    });
  }
  map.on('moveend', reportRegion);

  // Messages from React Native. Both listeners: iOS delivers on window,
  // Android on document.
  function onMessage(event) {
    var msg;
    try { msg = JSON.parse(event.data); } catch (e) { return; }
    if (msg.type === 'markers') setMarkers(msg.markers);
    if (msg.type === 'flyTo') {
      map.flyTo([msg.lat, msg.lng], msg.zoom || 11, { duration: 0.8 });
    }
  }
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage);

  send({ type: 'ready' });
  reportRegion();
</script>
</body>
</html>`;

export default leafletHtml;
