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
import {
  useGetUsersInRegionReq,
  useGetUserPointsInRegionReq,
  useGetMembersByStateReq,
} from 'presentation/services/react-query/user.query';
// For fetching one profile when a tapped pin is not in the capped profile set.
import { makeAxiosHttpClient } from 'main/factories/http';
import { appConfig } from 'main/config/app.config';
import { captureException } from 'services/sentry.shim';
import { useCountry } from 'presentation/hooks';
import {
  IconBars3,
  IconTabHeart,
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

  // The dots. A separate query from the one above, and the one the map is
  // actually drawn from.
  //
  // useGetUsersInRegionReq returns whole profiles and is capped at 1000 rows
  // in the database with no ORDER BY, while the screen asks for 500. With
  // 3,979 members carrying coordinates, a country-wide viewport returned an
  // arbitrary 500 of them, so whole states had no pins until you zoomed in far
  // enough for the locals to fit under the cap. Raising the cap is not the
  // answer: 3,979 whole profiles is 1.81 MB against 315 KB of points.
  //
  // The filters go with it. Filtering in memory could only ever filter the
  // truncated 500, so a filtered map was wrong twice over — this filters
  // before the limit, in the database.
  //
  // Whole profiles are still fetched above: they drive the loading state and
  // give the member card an instant answer for any pin already in that set.
  const pointFilters = useMemo(
    () => ({
      roles: designation.map(d => d.id),
      ages: age.map(a => a.id),
      genders: gender.map(g => g.id),
      diagnosisTypes: diagnosisType.map(d => d.id),
      diagnosisYears: diagnosisYear.map(d => d.id),
      // Both, because the column holds both "US" and "United States".
      countries: country.flatMap(c => [c.id, c.label].filter(Boolean)),
      city,
    }),
    [designation, age, gender, diagnosisType, diagnosisYear, country, city],
  );

  const { data: pointsData } = useGetUserPointsInRegionReq(
    region ?? initialRegion ?? null,
    pointFilters,
  );

  // Members in view grouped by state: what the map draws when zoomed out, and
  // the only honest count of what is out there.
  //
  // Filtered, so the numbers on the bubbles mean what they say. Fetched
  // unfiltered as well, below, because whether individual pins are possible is
  // a property of the viewport rather than of the filters — deciding on the
  // filtered count would flip the map between bubbles and pins as filters
  // change, which reads as a glitch.
  const { data: statesData } = useGetMembersByStateReq(
    region ?? initialRegion ?? null,
    pointFilters,
  );
  const { data: statesUnfiltered } = useGetMembersByStateReq(
    region ?? initialRegion ?? null,
  );

  // PostgREST returns at most 1000 rows per request whatever a function's own
  // limit says — verified on staging as "content-range: 0-999/3971". So above
  // this, individual markers are not slow, they are impossible, and the map
  // has to aggregate. Which is also what the board asked for.
  const POINT_LIMIT = 1000;
  const totalInView = useMemo(
    () =>
      (statesUnfiltered ?? []).reduce(
        (n, s) => n + Number(s.member_count || 0),
        0,
      ),
    [statesUnfiltered],
  );
  // Until the aggregate has answered, behave as before rather than flashing
  // bubbles over a map that is about to show pins.
  const showStates = totalInView > POINT_LIMIT;

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

        // A member passed in from "View on map" comes FIRST. GPS used to win
        // here, so asking to see someone dropped you on your own street
        // instead — the member was only consulted if GPS failed.
        const region: Region = userParams?.user?.geoLocation
          ? { ...userParams.user.geoLocation, ...TIGHT_DELTA }
          : latitude && longitude
            ? { ...myLocation, ...TIGHT_DELTA }
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
      // The filter carries country CODES ("US") while a profile stores the
      // country NAME ("United States"), so a strict id comparison matched
      // nothing and emptied the map. Accept either, case-insensitively.
      const matchesCountry = country.length
        ? country.some(
            c =>
              friend.country?.toLowerCase() === c.id?.toLowerCase() ||
              friend.country?.toLowerCase() === c.label?.toLowerCase(),
          )
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

  // What the map is drawn from: every member in view, filtered in the database.
  //
  // Falls back to `friends` — the capped, in-memory-filtered set this screen
  // used to draw — whenever the points query has nothing. That covers the
  // first render, a transient network failure, AND the case where
  // users_in_bbox_points has not been created yet, because the migration is
  // applied by hand. Without that fallback, shipping this ahead of the
  // migration would leave the map with no pins at all, which is worse than the
  // bug it fixes. Once the function exists, the map upgrades itself.
  const points = useMemo(() => {
    if (pointsData && pointsData.length) {
      return pointsData
        .filter(p => p.latitude != null && p.longitude != null)
        .map(p => ({
          id: p.id,
          geoLocation: { latitude: p.latitude, longitude: p.longitude },
        }));
    }
    return (friends ?? [])
      .filter(
        u => u.geoLocation?.latitude != null && u.geoLocation?.longitude != null,
      )
      .map(u => ({
        id: u.id,
        geoLocation: {
          latitude: u.geoLocation!.latitude,
          longitude: u.geoLocation!.longitude,
        },
      }));
  }, [pointsData, friends]);

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
        // The list shows the people the map is showing, so it needs to know
        // what the map is looking at.
        region: viewRegion ?? region ?? initialRegion,
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
    clearFocusRequest();
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
      // A pending member focus wins: this effect exists to undo Android's
      // whole-US re-zoom, not to overrule an explicit request.
      if (applyPendingFocus()) return;
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

  // Where a "View on map" wants the map to sit, until it has been applied.
  const pendingFocus = useRef<Region | null>(null);

  // Fly to a pending focus if there is one and the map can accept it. Cleared
  // only once it lands, so a request made before the WebView is ready is not
  // thrown away — and never replays afterwards.
  const applyPendingFocus = useCallback(() => {
    const target = pendingFocus.current;
    const handle = leafletRef.current;
    if (!target || !handle) return false;
    handle.flyTo(
      target.latitude,
      target.longitude,
      zoomForDelta(target.longitudeDelta),
    );
    // Deliberately NOT cleared here.
    //
    // It used to be, and "View on map" still landed on the wide default view.
    // Applying once assumes the fly-to is the last word on the camera, and it
    // is not: the request and the WebView being ready race, onReady can fire
    // again if the page reloads underneath us, and the map is re-centred from
    // several places. Whichever of those wins, clearing on the first apply
    // means there is nothing left to re-apply and the member is lost.
    //
    // So the request outlives the apply and is re-applied whenever the map
    // becomes ready. It is cleared by clearFocusRequest() the moment the
    // member does anything with the map themselves — see below — so it can
    // never drag them back to a pin they have panned away from.
    return true;
  }, []);

  // The member has taken control of the map, so stop re-applying the focus
  // that brought them here. Called from every deliberate camera action: tapping
  // the map, tapping a pin, the current-location button, and search.
  const clearFocusRequest = useCallback(() => {
    pendingFocus.current = null;
  }, []);

  // Opened from a member's profile. This cannot live in the mount effect:
  // MapView already sits under that screen in the Connect stack, so it never
  // remounts — the params simply change underneath it.
  const focusUserId = userParams?.user?.id;
  useEffect(() => {
    const target = userParams?.user;
    const lat = target?.geoLocation?.latitude;
    const lng = target?.geoLocation?.longitude;
    if (!target || lat == null || lng == null) return;

    pendingFocus.current = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };
    setUser(target);
    setIsCurrentLocation(false);
    applyPendingFocus();
  }, [focusUserId, applyPendingFocus]);

  // Marker data crosses to the page over postMessage rather than as React
  // children: rebuilding the page on every change would throw away the pan and
  // zoom the member had set.
  // Which member the map is singling out: whoever's card is open.
  const selectedId = user?.id;

  const pushMarkersToMap = useCallback(() => {
    // Zoomed out: one bubble per state, counted in the database, instead of a
    // cloud of pins the transport cannot even deliver.
    if (showStates) {
      leafletRef.current?.setMarkers(
        (statesData ?? [])
          .filter(s => s.latitude != null && s.longitude != null)
          .map(s => ({
            id: s.label,
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
            count: Number(s.member_count),
          })),
      );
      return;
    }

    const list = points.map(u => ({
      id: u.id,
      latitude: u.geoLocation.latitude,
      longitude: u.geoLocation.longitude,
      // The selected member — arrived at from their profile, or tapped — is
      // singled out and named. Centring on their area is not an answer on a
      // map this dense: "somewhere in this cluster" still does not say which
      // pin is them.
      //
      // The name comes from `user` rather than the point, because a point is
      // only an id and a coordinate — and `user` is exactly the member being
      // singled out.
      focus: u.id === selectedId,
      label: u.id === selectedId ? user?.firstName || 'This member' : undefined,
    }));
    leafletRef.current?.setMarkers(list);
  }, [points, selectedId, user?.firstName, showStates, statesData]);

  // Keep the page in step as the viewport fetch returns new people.
  useEffect(() => {
    pushMarkersToMap();
  }, [pushMarkersToMap]);

  const handleLeafletMarkerPress = useCallback(
    async (id: string) => {
      // Fast path: the profile query above may already hold this member, in
      // which case the card opens with no round trip.
      const match = (friends ?? []).find(u => u.id === id);
      if (match) {
        setUser(match);
        return;
      }
      // Otherwise fetch the one profile. Pins now come from a points query
      // that returns every member in view, so most of them are NOT in that
      // capped set — before this, tapping such a pin did nothing at all.
      try {
        const res = await makeAxiosHttpClient().request({
          method: 'get',
          url: `${appConfig.apiUrl}/users/getUserInfoByCognitoId/${id}`,
        });
        const profile = (res as any)?.body;
        if (profile?.id) setUser(profile);
      } catch (error) {
        captureException(error);
      }
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
    // Clustered from the points, so the counts describe every member in view
    // rather than the arbitrary 500 that used to arrive.
    if (showStates) return [];
    return buildClusters(points as any, lngDelta);
  }, [points, showStates, viewRegion?.longitudeDelta, initialRegion.longitudeDelta]);

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
          onReady={() => {
            pushMarkersToMap();
            applyPendingFocus();
          }}
          onMarkerPress={id => {
            clearFocusRequest();
            handleLeafletMarkerPress(id);
          }}
          // A state bubble is a count, not a person: tapping it zooms into that
          // state, which is where the individual members become drawable.
          onCountPress={({ latitude, longitude }) => {
            clearFocusRequest();
            leafletRef.current?.flyTo(latitude, longitude, zoomForDelta(6));
          }}
          // Restores what the native map's onPress did: tapping away from a
          // pin dismisses the member card. Without it the card had no way out.
          onMapPress={() => {
            clearFocusRequest();
            setUser(null);
          }}
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
                    stroke={colors.heading}
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
                  stroke={colors.heading}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <SafeAreaView style={styles.safeAreaBottom}>
          {user ? (
            <UserCard user={user} onClose={() => setUser(null)} setInitialRegion={setInitialRegion} />
          ) : (
            <View style={styles.bottomRow}>
              <View style={styles.cardContainer}>
                <TouchableOpacity
                  onPress={handleView}
                  style={styles.listViewButton}
                >
                  <IconBars3 width={18} height={18} stroke={colors.heading} />
                  <Text style={styles.listViewText}>List view</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Connect', { screen: 'MatchView' })}
                style={styles.matchButton}
                accessibilityRole="button"
                accessibilityLabel="Meet members, one at a time"
              >
                <IconTabHeart width={18} height={18} stroke={colors.white} />
                <Text style={styles.matchButtonText}>Meet members</Text>
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
