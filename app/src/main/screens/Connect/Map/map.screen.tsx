import * as Location from 'expo-location';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LeafletMap, {
  type LeafletMapHandle,
} from 'components/LeafletMap/LeafletMap';

// The viewport shape this screen has always used, kept identical so nothing
// downstream changes. Declared here so the file no longer imports
// react-native-maps at all.
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
import {
  RouteProp,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
} from 'react-native';

import useMap from './useMap';
import styles from './map.styles';
import colors from 'styles/colors';
import Searchbar from 'components/Searchbar/Searchbar';
import BrandedLoader from 'components/BrandedLoader/BrandedLoader';
import UserCard from '../components/UserCard/UserCard';
import InfoModal from '../components/InfoModal/InfoModal';
import FiltersModal from '../components/FiltersModal/FiltersModal';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useGetUsersInRegionReq } from 'presentation/services/react-query/user.query';
import { useCountry } from 'presentation/hooks';
import {
  IconBars3,
  IconChevronDown,
  IconInformationCircle,
  IconPaperAirplane,
} from 'assets/icons-auto/components';
export interface User {
  id: string;
  email: string;
  cognitoId: string;
  profilePicture: string;
  firstName: string;
  age: string;
  country: string;
  city: string;
  gender: string;
  role: { description: string };
  diagnosisTypes: { description: string }[];
  diagnosisSubTypes: { description: string }[];
  diagnosisYear: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

const MIN_ZOOM_METERS = 3000;
const MIN_LONGITUDE_DELTA = MIN_ZOOM_METERS / 111000;

export interface Filters {
  city: string;
  country: { id: string; label: string }[];
  age: { id: string; label: string }[];
  designation: { id: string; label: string }[];
  diagnosisType: { id: string; label: string }[];
  gender: { id: string; label: string }[];
  diagnosisYear: { id: string; label: string }[];
}

// Perf: pure helper hoisted to module scope so it isn't re-created every render.
function offsetOverlappingMarkers(users: User[]) {
  const locationGroups: { [key: string]: User[] } = {};

  users.forEach(user => {
    const key = `${user.geoLocation?.latitude.toFixed(
      6,
    )},${user.geoLocation?.longitude.toFixed(6)}`;
    if (!locationGroups[key]) {
      locationGroups[key] = [];
    }
    locationGroups[key].push(user);
  });

  return Object.values(locationGroups)
    .map(group => {
      if (group.length === 1) {
        return group;
      }

      const offsetDistance = 0.008;
      const angleStep = (2 * Math.PI) / group.length;

      return group.map((user, index) => {
        const angle = angleStep * index;
        const offsetLat = Math.sin(angle) * offsetDistance;
        const offsetLng = Math.cos(angle) * offsetDistance;

        return {
          ...user,
          location: {
            latitude: user.geoLocation!.latitude + offsetLat,
            longitude: user.geoLocation!.longitude + offsetLng,
          },
        };
      });
    })
    .flat();
}

// Manual grid clustering (state -> city -> individual falls out of the cell
// size shrinking as you zoom in). Chosen over supercluster so no new native/JS
// dependency has to be installed for the bundle to build. Users in the same
// grid cell collapse into one count bubble; tapping it zooms into that cell.
type Cluster = {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  users: User[];
};

function buildClusters(users: User[], lngDelta: number): Cluster[] {
  // Cell size scales with zoom: wide view -> big cells (state-level bubbles),
  // tight view -> tiny cells (individual pins). Clamped so it never degenerates.
  const cell = Math.min(Math.max(lngDelta / 6, 0.02), 12);
  const grid = new Map<
    string,
    { users: User[]; latSum: number; lngSum: number }
  >();

  users.forEach(u => {
    const lat = u.geoLocation?.latitude;
    const lng = u.geoLocation?.longitude;
    if (lat == null || lng == null) return;
    const key = `${Math.floor(lat / cell)}:${Math.floor(lng / cell)}`;
    const g = grid.get(key) ?? { users: [], latSum: 0, lngSum: 0 };
    g.users.push(u);
    g.latSum += lat;
    g.lngSum += lng;
    grid.set(key, g);
  });

  return [...grid.values()].map(g => ({
    id: g.users[0].id,
    latitude: g.latSum / g.users.length,
    longitude: g.lngSum / g.users.length,
    count: g.users.length,
    users: g.users,
  }));
}

// Leaflet thinks in zoom levels, the rest of this screen in longitude deltas
// (inherited from react-native-maps). 360 degrees spans the world at zoom 0
// and halves each level, so this converts between the two.
function zoomForDelta(longitudeDelta: number) {
  if (!longitudeDelta || longitudeDelta <= 0) return 11;
  return Math.min(Math.max(Math.log2(360 / longitudeDelta), 2), 16);
}

export default function MapScreen() {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const { userDB } = useUserDBProvider();
  const { isWithinBounds } = useMap();
  const route =
    useRoute<
      RouteProp<
        { params: { user: User; search: string; filters: Filters } },
        'params'
      >
    >();

  const userParams = route.params;

  const { supportedCountries } = useCountry();

  const [city, setCity] = useState(userParams?.filters?.city || '');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [allFriends, setAllFriends] = useState<User[]>();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [user, setUser] = useState<User | null>(userParams?.user);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [age, setAge] = useState<{ id: string; label: string }[]>(
    userParams?.filters?.age || [],
  );
  const [gender, setGender] = useState<{ id: string; label: string }[]>(
    userParams?.filters?.gender || [],
  );
  const [country, setCountry] = useState<{ id: string; label: string }[]>(
    userParams?.filters?.country ||
      supportedCountries.map(country => ({
        id: country.code,
        label: country.name,
      })),
  );
  const [designation, setDesignation] = useState<
    { id: string; label: string }[]
  >(userParams?.filters?.designation || []);
  const [diagnosisType, setDiagnosisType] = useState<
    { id: string; label: string }[]
  >(userParams?.filters?.diagnosisType || []);
  const [diagnosisYear, setDiagnosisYear] = useState<
    { id: string; label: string }[]
  >(userParams?.filters?.diagnosisYear || []);
  const [initialRegion, setInitialRegion] = useState<Region>({
    latitude: 37.0902,
    longitude: -95.7129,
    latitudeDelta: 30.0,
    longitudeDelta: 50.0,
  });
  const [region, setRegion] = useState<Region>();
  // Tracks the visible region on EVERY change (even when zoomed past the fetch
  // threshold) purely to drive cluster cell sizing — kept separate from
  // `region` so the users_in_bbox fetch behavior is unchanged.
  const [viewRegion, setViewRegion] = useState<Region>();
  const [isShowMarkers, setIsShowMarkers] = useState(false);
  // Viewport-aware: only profiles inside the visible region are fetched
  // (users_in_bbox RPC) — scales to any community size. The hook keeps the
  // previous page while the next viewport loads, so markers never blink out.
  const { data: usersData } = useGetUsersInRegionReq(
    region ?? initialRegion ?? null,
  );
  // Rebuild fix (P1 perf): removed `countRender` state — it incremented on
  // every isShowMarkers flip, forcing an extra full re-render of the map and
  // all markers, and was never read anywhere.

  const fetchUsersLocation = () => {
    if (!usersData?.data) return;

    try {
      const usersWithLocation = (
        usersData.data.filter(
          user =>
            user.geoLocation &&
            user.id !== userDB?.id &&
            user.geoLocation.latitude &&
            user.geoLocation.longitude,
        ) as User[]
      ).filter(
        user =>
          user.geoLocation &&
          isWithinBounds(user.geoLocation.latitude, user.geoLocation.longitude),
      );

      const adjustedFriends = offsetOverlappingMarkers(usersWithLocation);

      setAllFriends(adjustedFriends);
      setIsLoading(false);
    } catch (error) {
      if (__DEV__) console.warn('Error fetching users location', error);
    }
  };

  useEffect(() => {
    // Rebuild fix: run even when the list is EMPTY — the old length>0 gate
    // meant a community with no (visible) users left the map spinning forever.
    if (usersData?.data) fetchUsersLocation();
  }, [usersData]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Rebuild fix: NO blocking alert — iOS queues these across mounts and
          // they stack (users reported tapping through dozens). The map works
          // fine from the profile location fallback; just skip GPS.
          throw new Error('location-permission-not-granted');
        }

        const currentLocation = await Location.getCurrentPositionAsync({});

        const { latitude, longitude } = currentLocation.coords;

        const myLocation = { latitude, longitude };

        // Rebuild fix (P1 map): open the map ON the user's actual location with a
        // tight, city-level zoom — NOT the whole continental US. Priority order:
        //   1) live device GPS (tight delta)
        //   2) the user's saved profile geoLocation (tight delta)
        //   3) whole-US ONLY as a last resort when we truly have no location
        const TIGHT_DELTA = { latitudeDelta: 0.15, longitudeDelta: 0.15 };

        const region: Region = latitude && longitude
          ? { ...myLocation, ...TIGHT_DELTA }
          : userParams?.user?.geoLocation
            ? { ...userParams.user.geoLocation, ...TIGHT_DELTA }
            : {
                latitude: 37.0902,
                longitude: -95.7129,
                latitudeDelta: 30.0,
                longitudeDelta: 50.0,
              };

        const myRegion = {
          ...myLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };

        setInitialRegion(region);
        setCurrentLocation(myRegion);
        setIsCurrentLocation(true);
        leafletRef.current?.flyTo(region.latitude, region.longitude, zoomForDelta(region.longitudeDelta));
      } catch (error) {
        // Rebuild fix: GPS failure (timeout, airplane mode, simulator) should
        // NOT block the user with an alert. Fall back to their profile
        // location, then the US overview, and move on.
        if (__DEV__) console.log('Location unavailable, using fallback', error);
        const TIGHT_DELTA = { latitudeDelta: 0.15, longitudeDelta: 0.15 };
        const fallback: Region = userParams?.user?.geoLocation
          ? { ...userParams.user.geoLocation, ...TIGHT_DELTA }
          : userDB?.geoLocation?.latitude
            ? { ...userDB.geoLocation, ...TIGHT_DELTA }
            : {
                latitude: 37.0902,
                longitude: -95.7129,
                latitudeDelta: 30.0,
                longitudeDelta: 50.0,
              };
        setInitialRegion(fallback);
        setIsLoading(false);
      }
    })();
  }, []);

  // Perf: filtered markers are now derived with useMemo instead of an effect
  // writing to a second state slice (which double-rendered the whole map, and
  // had a stale `isLoading` dep instead of `allFriends`). Same predicate.
  const friends = useMemo(() => {
    return allFriends?.filter(friend => {
      const matchesRole = designation.length
        ? designation.some(
            designation => friend.role?.description === designation.id,
          )
        : true;
      const matchesAge = age.length
        ? age.some(age => friend.age === age.id)
        : true;
      const matchesGender = gender.length
        ? gender.some(gender => friend.gender === gender.id)
        : true;
      const matchesDiagnosisType = diagnosisType.length
        ? diagnosisType.some(diagnosisType =>
            friend.diagnosisTypes.some(
              dt => dt.description === diagnosisType.id,
            ),
          )
        : true;
      const matchesDiagnosisYear = diagnosisYear.length
        ? diagnosisYear.some(
            diagnosisYear => friend.diagnosisYear === diagnosisYear.id,
          )
        : true;
      const matchesCountry = country.length
        ? country.some(country => friend.country === country.id)
        : true;
      const matchesCity = city
        ? friend.city?.toLowerCase().includes(city.toLowerCase())
        : true;

      return (
        matchesRole &&
        matchesAge &&
        matchesGender &&
        matchesDiagnosisType &&
        matchesDiagnosisYear &&
        matchesCountry &&
        matchesCity
      );
    });
  }, [
    allFriends,
    designation,
    age,
    gender,
    diagnosisType,
    diagnosisYear,
    country,
    city,
  ]);

  function countFilters() {
    let count = 0;

    if (city.trim() !== '') count++;
    if (age.length > 0) count++;
    if (designation.length > 0) count++;
    if (diagnosisType.length > 0) count++;
    if (gender.length > 0) count++;
    if (diagnosisYear.length > 0) count++;
    return count;
  }

  // Perf: computed once per render instead of 4x in JSX.
  const filtersCount = countFilters();

  function handleView() {
    navigation.navigate('Connect', {
      screen: 'ListView',
      params: {
        search: query,
        filters: {
          country,
          city,
          age,
          designation,
          diagnosisType,
          gender,
          diagnosisYear,
        },
      },
    });
  }

  async function handleSearch(city: string) {
    if (!city.trim()) {
      throw new Error('Invalid search.');
    }

    try {
      const geocodedLocation = await Location.geocodeAsync(city);

      if (geocodedLocation && geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];

        const region = {
          latitude,
          longitude,
          latitudeDelta: 1.0922,
          longitudeDelta: 1.0421,
        };

        leafletRef.current?.flyTo(region.latitude, region.longitude, zoomForDelta(region.longitudeDelta));
        setIsCurrentLocation(false);
      } else {
        throw new Error('Location not found.');
      }
    } catch (error) {
      throw new Error(`Failed to search for the location: ${error}`);
    }
  }

  function handleCurrentLocation() {
    if (currentLocation) {
      leafletRef.current?.flyTo(currentLocation.latitude, currentLocation.longitude, zoomForDelta(currentLocation.longitudeDelta));
      setIsCurrentLocation(true);
    }
  }

  function isRegionOutOfThreshold(region: Region): boolean {
    if (!currentLocation) return false;

    const threshold = 0.01;
    const latitudeDiff = Math.abs(region.latitude - currentLocation.latitude);
    const longitudeDiff = Math.abs(
      region.longitude - currentLocation.longitude,
    );

    return latitudeDiff > threshold || longitudeDiff > threshold;
  }

  function handleRegionChangeComplete(newRegion: Region) {
    setViewRegion(newRegion); // always — drives cluster granularity
    const isZoomedIn = newRegion.longitudeDelta < MIN_LONGITUDE_DELTA;
    if (isRegionOutOfThreshold(newRegion)) setIsCurrentLocation(false);
    if (!isZoomedIn) setRegion(newRegion);
    else if (region)
      (() => {
        const target = {
          ...region,
          longitudeDelta: isZoomedIn
            ? MIN_LONGITUDE_DELTA
            : region.longitudeDelta,
        };
        leafletRef.current?.flyTo(
          target.latitude,
          target.longitude,
          zoomForDelta(target.longitudeDelta),
        );
      })();
  }

  useEffect(() => {
    if (!isFocused) {
      setIsShowMarkers(false);
      return;
    }
    const timeout = setTimeout(() => {
      setIsShowMarkers(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [isFocused]);

  useEffect(() => {
    // Rebuild fix (P1 map): previously Android re-zoomed to the WHOLE US every
    // time the map tab was focused. Instead, return to the user's own location
    // (their current location if we have it, otherwise the already-correct
    // initialRegion). Never force the whole-US view.
    if (isFocused && Platform.OS === 'android') {
      const target = currentLocation ?? initialRegion;
      if (target) {
        leafletRef.current?.flyTo(target.latitude, target.longitude, zoomForDelta(target.longitudeDelta));
      }
    }
    // Rebuild fix (P1 perf): no setTracksView(true) here — static image markers
    // never need view tracking, and toggling it re-rendered every marker.
  }, [isFocused]);

  useEffect(() => {
    if (!isFiltersOpen) {
      setQuery(city);

      // Perf: previously called unconditionally — with an empty city this
      // threw an unhandled rejection on every mount/filter close, and geocode
      // failures also rejected unhandled. Same visible behavior (geocode +
      // animate when a city is set), without the rejection churn.
      if (city.trim()) handleSearch(city).catch(() => {});
    }
  }, [isFiltersOpen]);

  // Perf: marker elements are memoized so unrelated re-renders (search
  // keystrokes, region changes, "my location" toggles) don't rebuild the whole
  // Marker tree on every render. Rebuilds only when the visible friends set
  // or the show flag changes. setUser is a stable useState setter.
  // Hierarchical clusters (state -> city -> individual) derived from the
  // filtered users at the current zoom. Cell size shrinks as you zoom in, so
  // bubbles progressively split until single members become pins.
  const leafletRef = useRef<LeafletMapHandle>(null);

  // Marker data crosses to the page over postMessage rather than as React
  // children: rebuilding the page on every change would throw away the pan and
  // zoom the member had set.
  const pushMarkersToMap = useCallback(() => {
    const list = (friends ?? [])
      .filter(u => u.geoLocation?.latitude != null && u.geoLocation?.longitude != null)
      .map(u => ({
        id: u.id,
        latitude: u.geoLocation!.latitude,
        longitude: u.geoLocation!.longitude,
      }));
    leafletRef.current?.setMarkers(list);
  }, [friends]);

  // Keep the page in step as the viewport fetch returns new people.
  useEffect(() => {
    pushMarkersToMap();
  }, [pushMarkersToMap]);

  const handleLeafletMarkerPress = useCallback(
    (id: string) => {
      const match = (friends ?? []).find(u => u.id === id);
      if (match) setUser(match);
    },
    [friends],
  );

  // Leaflet reports a bounding box; the existing fetch wants a centre plus
  // deltas, so convert rather than change the hook every screen shares.
  const handleLeafletRegionChange = useCallback(
    (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => {
      const next: Region = {
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2,
        latitudeDelta: Math.abs(bounds.maxLat - bounds.minLat),
        longitudeDelta: Math.abs(bounds.maxLng - bounds.minLng),
      };
      setViewRegion(next);
      setRegion(next);
    },
    [],
  );

  const clusters = useMemo(() => {
    const lngDelta =
      viewRegion?.longitudeDelta ?? initialRegion.longitudeDelta ?? 50;
    return buildClusters(friends ?? [], lngDelta);
  }, [friends, viewRegion?.longitudeDelta, initialRegion.longitudeDelta]);

  // Tap a count bubble -> zoom into that cell (roughly 1/3 the current span),
  // which re-clusters at the finer granularity. The existing users_in_bbox
  // fetch (via region change) keeps supplying the members in view.
  const handleClusterPress = useCallback(
    (cluster: Cluster) => {
      const currentDelta =
        viewRegion?.longitudeDelta ?? initialRegion.longitudeDelta ?? 10;
      const nextDelta = Math.max(currentDelta / 3, MIN_LONGITUDE_DELTA);
      leafletRef.current?.flyTo(
        cluster.latitude,
        cluster.longitude,
        zoomForDelta(nextDelta),
      );
    },
    [viewRegion?.longitudeDelta, initialRegion.longitudeDelta],
  );

  // The native <Marker> tree lived here. Leaflet renders and clusters the
  // pins inside the WebView now, fed by pushMarkersToMap, so this is gone
  // rather than kept as dead JSX.

  if (isLoading || !isFocused) {
    // Branded loading screen (user-requested): logo + progress bar instead
    // of a bare spinner — perceived speed while GPS + users resolve.
    return <BrandedLoader />;
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={{ flex: 1 }}>
        {/* Leaflet in a WebView, not react-native-maps. The native map threw
            "this.getNativeComponent is not a function" from inside AIRMap on
            this app's build and took the whole screen with it, and it needed a
            Google key per platform that the manifest never had. This is the
            same map the web app ships: same tiles, same green filter, same
            magenta clusters, identical on iOS and Android, no keys. */}
        <LeafletMap
          ref={leafletRef}
          style={styles.map}
          onReady={pushMarkersToMap}
          onMarkerPress={handleLeafletMarkerPress}
          // Restores what the native map's onPress did: tapping away from a
          // pin dismisses the member card. Without it the card had no way out.
          onMapPress={() => setUser(null)}
          onRegionChange={handleLeafletRegionChange}
        />
        <SafeAreaView style={styles.safeAreaTop}>
          <View style={styles.topContainer}>
            <Searchbar
              value={query}
              onChangeText={setQuery}
              onSubmit={() => handleSearch(query)}
              placeholder="Search city"
            />
            <View style={styles.searchContainer}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    {
                      backgroundColor: isCurrentLocation
                        ? colors.magenta
                        : colors.surface2,
                    },
                  ]}
                  onPress={handleCurrentLocation}
                >
                  <IconPaperAirplane
                    width={14}
                    height={14}
                    stroke={
                      isCurrentLocation ? colors.white : colors.muted
                    }
                  />
                  <Text
                    style={[
                      styles.locationButtonText,
                      {
                        color: isCurrentLocation ? colors.white : colors.muted,
                      },
                    ]}
                  >
                    My location
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsFiltersOpen(true)}
                  style={[
                    styles.filterButton,
                    {
                      borderColor:
                        filtersCount > 0 ? colors.magentaText : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.filterText}>Filters</Text>
                  <IconChevronDown
                    width={20}
                    height={20}
                    stroke={colors.white}
                  />

                  {filtersCount > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{filtersCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setIsInfoOpen(!isInfoOpen)}>
                <IconInformationCircle
                  width={24}
                  height={24}
                  stroke={colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <SafeAreaView style={styles.safeAreaBottom}>
          {user ? (
            <UserCard user={user} onClose={() => setUser(null)} setInitialRegion={setInitialRegion} />
          ) : (
            <View style={styles.cardContainer}>
              <TouchableOpacity
                onPress={handleView}
                style={styles.listViewButton}
              >
                <IconBars3 width={18} height={18} stroke={colors.white} />
                <Text style={styles.listViewText}>List view</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
        <FiltersModal
          isFiltersOpen={isFiltersOpen}
          setIsFiltersOpen={setIsFiltersOpen}
          designation={designation}
          setDesignation={setDesignation}
          age={age}
          setAge={setAge}
          gender={gender}
          setGender={setGender}
          diagnosisType={diagnosisType}
          setDiagnosisType={setDiagnosisType}
          diagnosisYear={diagnosisYear}
          setDiagnosisYear={setDiagnosisYear}
          country={country}
          setCountry={setCountry}
          city={city}
          setCity={setCity}
        />
        <InfoModal isInfoOpen={isInfoOpen} setIsInfoOpen={setIsInfoOpen} />
      </View>
    </TouchableWithoutFeedback>
  );
}
