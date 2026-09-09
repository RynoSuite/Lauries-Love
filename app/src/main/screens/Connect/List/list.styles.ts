import colors from 'styles/colors';
import { StyleSheet } from 'react-native';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.ground,
  },
  searchContainer: {
    gap: 12,
    paddingHorizontal: 16,
    // 12 top and bottom, matching the map view and the community wall's pills.
    paddingTop: 12,
    paddingBottom: 12,
  },
  filterButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 40,
  },
  locationButtonText: {
    fontFamily: FONT_RALEWAY_600,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 40,
    backgroundColor: colors.surface2,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.white,
  },
  filterCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: 18,
    backgroundColor: colors.primary[300],
  },
  filterCountText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.heading,
  },
  flatListContainer: {
    gap: 12,
    paddingHorizontal: 13,
    paddingBottom: 140,
  },
  mapViewButtonContainer: {
    position: 'absolute',
    bottom: 112,
    alignItems: 'center',
    width: '100%',
  },
  mapViewButton: {
    borderRadius: 80,
    backgroundColor: colors.surface,
    boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.25)',
  },
  mapViewButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mapViewText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.heading,
  },
});

export default styles;
