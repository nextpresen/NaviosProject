/**
 * NearbyScreen 用スタイル定義
 * app/(tabs)/nearby.tsx から分離
 */
import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** ボトムシートの最大高さ */
export const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.62;

/** @see nearby.tsx SheetState */
export const SHEET_TRANSLATE = {
  closed: MAX_SHEET_HEIGHT - 70,
  half:   MAX_SHEET_HEIGHT - 220,
  full:   0,
} as const;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ─── 地図 ─────────────────────────────────────────────
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapSubText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // ─── 現在地マーカー ────────────────────────────────────
  locationMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.35)',
  },
  locationDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  // ─── 投稿ピン ──────────────────────────────────────────
  pin: {
    position: 'absolute',
    marginLeft: -18,
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinCircleSelected: {
    borderWidth: 3,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  pinUrgency: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinUrgencyText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  // ─── ヘッダー ──────────────────────────────────────────
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: 10,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bellButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  // ─── ボトムシート ──────────────────────────────────────
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MAX_SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  closedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  liveDotWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  countTextSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sheetContent: {
    flex: 1,
  },
  hotCardsWrapper: {
    height: 165,
    flexShrink: 0,
  },
  hotCards: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  fullList: {
    flex: 1,
  },
  hotCardItem: { marginRight: 12 },
  listSeparator: { height: 8 },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
});
