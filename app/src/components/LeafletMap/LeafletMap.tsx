import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import colors from 'styles/colors';
import { leafletHtml } from './leafletHtml';

export type LeafletMarker = {
  id: string;
  latitude: number;
  longitude: number;
};

export type LeafletBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type LeafletMapHandle = {
  setMarkers: (markers: LeafletMarker[]) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
};

type Props = {
  style?: StyleProp<ViewStyle>;
  onMarkerPress?: (id: string) => void;
  onRegionChange?: (bounds: LeafletBounds, zoom: number) => void;
  /** A tap on the basemap, not on a pin. */
  onMapPress?: () => void;
  onReady?: () => void;
};

/**
 * Leaflet map in a WebView — the same map the web app ships.
 *
 * Replaces react-native-maps, which crashed on this app's New Architecture
 * build ("this.getNativeComponent is not a function" inside AIRMap) and took
 * the Connect screen with it. This has no native module to break, needs no
 * Google or Apple key, and looks identical on iOS and Android because it IS
 * the web implementation.
 *
 * Imperative rather than declarative on purpose: pushing markers through
 * postMessage avoids re-rendering the whole page — and reloading a WebView
 * would throw away the user's pan and zoom every time a marker moved.
 */
const LeafletMap = forwardRef<LeafletMapHandle, Props>(function LeafletMap(
  { style, onMarkerPress, onRegionChange, onMapPress, onReady },
  ref,
) {
  const webRef = useRef<WebView>(null);

  const post = useCallback((payload: object) => {
    webRef.current?.postMessage(JSON.stringify(payload));
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setMarkers: markers => post({ type: 'markers', markers }),
      flyTo: (lat, lng, zoom) => post({ type: 'flyTo', lat, lng, zoom }),
    }),
    [post],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (msg.type === 'markerPress') onMarkerPress?.(msg.id);
      if (msg.type === 'regionChange') onRegionChange?.(msg.bounds, msg.zoom);
      if (msg.type === 'mapPress') onMapPress?.();
      if (msg.type === 'ready') onReady?.();
    },
    [onMarkerPress, onRegionChange, onMapPress, onReady],
  );

  return (
    <WebView
      ref={webRef}
      // The page paints its own dark ground; the style keeps the WebView
      // itself from flashing white before Leaflet loads.
      style={[{ backgroundColor: colors.ground }, style]}
      source={{ html: leafletHtml }}
      originWhitelist={['*']}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      // The map handles its own gestures; the surrounding screen must not
      // fight it for the pan.
      scrollEnabled={false}
      bounces={false}
      setSupportMultipleWindows={false}
    />
  );
});

export default LeafletMap;
