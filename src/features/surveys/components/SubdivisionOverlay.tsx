import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Circle, Polygon, Polyline } from 'react-native-svg';

import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { MapCoordinate } from '@/features/reports/domain/manualMap';
import type { SubdivisionPiece } from '@/features/surveys/domain/plotSubdivision';
import { useTheme } from '@/hooks/use-theme';

const CUT_HANDLE_SIZE = 44;

type LayerPointFn = (coordinate: MapCoordinate) => { x: number; y: number };

interface CutPointHandleProps {
  accessibilityLabel: string;
  left: number;
  top: number;
  testID: string;
  onDragBegin: () => void;
  onDragMove: (translationX: number, translationY: number) => void;
  onDragEnd: () => void;
}

function CutPointHandle(props: CutPointHandleProps) {
  const latest = useRef(props);
  useEffect(() => { latest.current = props; });
  /* eslint-disable react-hooks/refs */
  const gesture = useMemo(() => Gesture.Pan()
    .withTestId(`${props.testID}.drag`)
    .runOnJS(true)
    .minDistance(4)
    .onBegin(() => latest.current.onDragBegin())
    .onUpdate((event) => latest.current.onDragMove(event.translationX, event.translationY))
    .onFinalize(() => latest.current.onDragEnd()), [props.testID]);
  /* eslint-enable react-hooks/refs */

  return (
    <GestureDetector gesture={gesture}>
      <Pressable
        testID={props.testID}
        accessibilityRole="button"
        accessibilityLabel={props.accessibilityLabel}
        style={{
          position: 'absolute',
          left: props.left,
          top: props.top,
          width: CUT_HANDLE_SIZE,
          height: CUT_HANDLE_SIZE,
        }}
      />
    </GestureDetector>
  );
}

export interface SubdivisionSvgLayerProps {
  pieces: SubdivisionPiece[];
  selectedPieceIds: string[];
  cutLines: MapCoordinate[][];
  activeCut: MapCoordinate[];
  layerPoint: LayerPointFn;
}

/** SVG graphics rendered inside the survey map's `<Svg pointerEvents="none">` layer during subdivision. */
export function SubdivisionSvgLayer({
  pieces,
  selectedPieceIds,
  cutLines,
  activeCut,
  layerPoint,
}: SubdivisionSvgLayerProps) {
  const theme = useTheme();
  const selectedSet = new Set(selectedPieceIds);

  return (
    <>
      {pieces.map((piece) => {
        const selected = selectedSet.has(piece.id);
        const points = piece.polygon.coordinates[0]
          .map(([longitude, latitude]) => layerPoint({ longitude, latitude }))
          .map((point) => `${point.x},${point.y}`)
          .join(' ');
        return (
          <Polygon
            key={`divide-piece-poly-${piece.id}`}
            points={points}
            fill={selected ? 'rgba(205, 112, 36, 0.36)' : 'rgba(68, 93, 72, 0.14)'}
            stroke={selected ? theme.warning : theme.info}
            strokeWidth={selected ? 3.5 : 2}
          />
        );
      })}
      {cutLines.map((line, cutIndex) => {
        const points = line.map((point) => {
          const at = layerPoint(point);
          return `${at.x},${at.y}`;
        }).join(' ');
        return (
          <Polyline
            key={`divide-cut-line-${cutIndex}`}
            points={points}
            fill="none"
            stroke={theme.info}
            strokeWidth={3}
            strokeDasharray="7 5"
          />
        );
      })}
      {activeCut.length >= 2 ? (
        <Polyline
          points={activeCut.map((point) => {
            const at = layerPoint(point);
            return `${at.x},${at.y}`;
          }).join(' ')}
          fill="none"
          stroke={theme.info}
          strokeWidth={3}
          strokeDasharray="7 5"
        />
      ) : null}
      {cutLines.map((line, cutIndex) => line.map((point, pointIndex) => {
        const at = layerPoint(point);
        return (
          <Circle
            key={`divide-cut-dot-${cutIndex}-${pointIndex}`}
            cx={at.x}
            cy={at.y}
            r={7}
            fill="white"
            stroke={theme.info}
            strokeWidth={3}
          />
        );
      }))}
      {activeCut.map((point, pointIndex) => {
        const at = layerPoint(point);
        return (
          <Circle
            key={`divide-active-dot-${pointIndex}`}
            cx={at.x}
            cy={at.y}
            r={7.5}
            fill={theme.info}
            stroke="white"
            strokeWidth={2.5}
          />
        );
      })}
    </>
  );
}

export interface SubdivisionTouchLayerProps {
  pieces: SubdivisionPiece[];
  selectedPieceIds: string[];
  cutLines: MapCoordinate[][];
  layerPoint: LayerPointFn;
  disabled: boolean;
  onTogglePiece: (pieceId: string) => void;
  onInsertBend: (cutIndex: number, segmentIndex: number) => void;
  onCutDragBegin: (cutIndex: number, pointIndex: number) => void;
  onCutDragMove: (translationX: number, translationY: number) => void;
  onCutDragEnd: () => void;
}

/** Interactive chips (anchored strictly inside each piece via `InteriorPointArea`), bend handles, and draggable cut points. */
export function SubdivisionTouchLayer({
  pieces,
  selectedPieceIds,
  cutLines,
  layerPoint,
  disabled,
  onTogglePiece,
  onInsertBend,
  onCutDragBegin,
  onCutDragMove,
  onCutDragEnd,
}: SubdivisionTouchLayerProps) {
  const theme = useTheme();
  const selectedSet = new Set(selectedPieceIds);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece) => {
        const at = layerPoint(piece.labelPoint);
        const selected = selectedSet.has(piece.id);
        return (
          <Pressable
            key={`divide-chip-${piece.id}`}
            testID={`field-survey.divide-piece.${piece.id}`}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={FIELD_SURVEY_COPY.dividePieceChip(piece.id, piece.percentOfPlot, piece.areaSqm, selected)}
            onPress={() => onTogglePiece(piece.id)}
            style={[
              styles.pieceChip,
              {
                left: at.x - 42,
                top: at.y - 14,
                backgroundColor: selected ? theme.warning : theme.surfaceElevated,
                borderColor: selected ? 'white' : theme.info,
              },
            ]}
          >
            <Text numberOfLines={1} style={[styles.pieceChipText, { color: selected ? 'white' : theme.text }]}>
              {selected ? `✓ ${piece.id} · ${piece.percentOfPlot.toFixed(1)}%` : `${piece.id} · ${piece.percentOfPlot.toFixed(1)}%`}
            </Text>
          </Pressable>
        );
      })}
      {disabled ? null : cutLines.map((line, cutIndex) => (
        <View key={`divide-cut-handles-${cutIndex}`} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {line.slice(0, -1).map((from, segIndex) => {
            const fromPt = layerPoint(from);
            const toPt = layerPoint(line[segIndex + 1]);
            return (
              <Pressable
                key={`divide-bend-${cutIndex}-${segIndex}`}
                testID={`field-survey.divide-bend.${cutIndex}.${segIndex}`}
                accessibilityRole="button"
                accessibilityLabel={FIELD_SURVEY_COPY.divideBendHandle(cutIndex + 1, segIndex + 1)}
                onPress={() => onInsertBend(cutIndex, segIndex)}
                style={[
                  styles.bendHandle,
                  {
                    left: (fromPt.x + toPt.x) / 2 - 12,
                    top: (fromPt.y + toPt.y) / 2 - 12,
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.info,
                  },
                ]}
              >
                <Text style={[styles.bendGlyph, { color: theme.info }]}>+</Text>
              </Pressable>
            );
          })}
          {line.map((point, pointIndex) => {
            const at = layerPoint(point);
            return (
              <CutPointHandle
                key={`divide-handle-${cutIndex}-${pointIndex}`}
                testID={`field-survey.divide-handle.${cutIndex}.${pointIndex}`}
                accessibilityLabel={FIELD_SURVEY_COPY.divideCutHandle(cutIndex + 1, pointIndex + 1)}
                left={at.x - CUT_HANDLE_SIZE / 2}
                top={at.y - CUT_HANDLE_SIZE / 2}
                onDragBegin={() => onCutDragBegin(cutIndex, pointIndex)}
                onDragMove={onCutDragMove}
                onDragEnd={onCutDragEnd}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pieceChip: {
    position: 'absolute',
    minWidth: 84,
    height: 28,
    paddingHorizontal: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceChipText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  bendHandle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bendGlyph: {
    ...Typography.label,
    lineHeight: 18,
  },
});
