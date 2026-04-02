'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { BASEMAPS } from '@/shared/config/basemaps';
import { getDefaultMetricId, getMetricOptionById } from '@/shared/config/metric-catalog';
import { resolveLayer } from '@/entities/map/api/map-api';
import { getParcelDetail } from '@/entities/parcel/api/parcel-api';
import { useMapStore } from '@/entities/map/model/use-map-store';
import { ParcelPopup } from '@/features/parcel-popup/ui/parcel-popup';
import { ParcelAnalyticsModal } from '@/features/parcel-analytics/ui/parcel-analytics-modal';
import { RasterOverlay } from '@/widgets/map-shell/ui/raster-overlay';
import type { AreaMeta, AreaId, LayerResolveResponse, LayersByArea } from '@/shared/types/map';

function fitFeatureCollection(map: L.Map, featureCollection?: GeoJSON.FeatureCollection) {
  if (!featureCollection?.features?.length) return;
  const layer = L.geoJSON(featureCollection as never);
  const bounds = layer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.08));
  }
}

function FitController({ aoi, area, parcels }: { aoi?: GeoJSON.FeatureCollection; area: AreaId; parcels?: GeoJSON.FeatureCollection }) {
  const map = useMap();
  const fitToken = useMapStore((state) => state.fitToken);
  const focusFavorite = useMapStore((state) => state.focusFavorite);
  const setSelectedParcelId = useMapStore((state) => state.setSelectedParcelId);

  useEffect(() => {
    fitFeatureCollection(map, aoi);
  }, [area, aoi, fitToken, map]);

  useEffect(() => {
    if (!focusFavorite || focusFavorite.area !== area || !parcels) return;

    const feature = parcels.features.find((item) => {
      const props = (item.properties ?? {}) as Record<string, unknown>;
      return String(props.parcel_id ?? props.id ?? props.parcelId ?? '') === focusFavorite.parcelId;
    });

    if (!feature) return;

    const layer = L.geoJSON(feature as never);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.4));
    }

    setSelectedParcelId(focusFavorite.parcelId);
  }, [area, focusFavorite, map, parcels, setSelectedParcelId]);

  return null;
}

export function MapShell({
  areas,
  vectors,
  layersByArea,
}: {
  areas: AreaMeta[];
  vectors: Partial<Record<AreaId, { aoi: GeoJSON.FeatureCollection; parcels: GeoJSON.FeatureCollection }>>;
  layersByArea: LayersByArea;
}) {
  const selectedArea = useMapStore((state) => state.selectedArea);
  const selectedBasemapId = useMapStore((state) => state.selectedBasemapId);
  const selectedMetricId = useMapStore((state) => state.selectedMetricId);
  const selectedMode = useMapStore((state) => state.selectedMode);
  const selectedYear = useMapStore((state) => state.selectedYear);
  const selectedParcelId = useMapStore((state) => state.selectedParcelId);
  const analyticsOpen = useMapStore((state) => state.analyticsOpen);
  const selectedParcelDetail = useMapStore((state) => state.selectedParcelDetail);
  const setSelectedParcelId = useMapStore((state) => state.setSelectedParcelId);
  const setSelectedParcelDetail = useMapStore((state) => state.setSelectedParcelDetail);
  const openAnalytics = useMapStore((state) => state.openAnalytics);
  const setMetricId = useMapStore((state) => state.setMetricId);
  const setYear = useMapStore((state) => state.setYear);
  const clearFavoriteFocus = useMapStore((state) => state.clearFavoriteFocus);
  const focusFavorite = useMapStore((state) => state.focusFavorite);

  const [compositeLayerState, setCompositeLayerState] = useState<LayerResolveResponse | null>(null);
  const [metricLayerState, setMetricLayerState] = useState<LayerResolveResponse | null>(null);
  const activeVectors = vectors[selectedArea];
  const selectedMetric = getMetricOptionById(selectedMetricId) ?? getMetricOptionById('ndvi');
  const selectedBasemap = BASEMAPS.find((item) => item.id === selectedBasemapId) ?? BASEMAPS[0];
  const requestRef = useRef(0);
  const parcelRequestRef = useRef(0);
  const areaLayers = layersByArea[selectedArea];
  const metricAvailable = selectedMetric ? (areaLayers[selectedMetric.group] ?? []).includes(selectedMetric.key) : false;

  useEffect(() => {
    const years = areas.find((area) => area.id === selectedArea)?.years ?? [];
    if (!years.length) return;

    if (!selectedYear || !years.includes(selectedYear)) {
      setYear(years[years.length - 1]);
    }
  }, [areas, selectedArea, selectedYear, setYear]);

  useEffect(() => {
    if (!selectedMetric || metricAvailable) return;

    const nextMetricId = getDefaultMetricId(selectedMode, areaLayers);
    if (nextMetricId && nextMetricId !== selectedMetricId) {
      setMetricId(nextMetricId);
    }
  }, [areaLayers, metricAvailable, selectedMetric, selectedMetricId, selectedMode, setMetricId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const req = ++requestRef.current;
      const composite = await resolveLayer(selectedArea, 'composites', 'annual_composite', selectedYear);
      if (cancelled || req !== requestRef.current) return;
      setCompositeLayerState(composite);

      if (!selectedMetric || selectedMetric.group === 'composites' || !metricAvailable) {
        setMetricLayerState(null);
        return;
      }

      const layer = await resolveLayer(selectedArea, selectedMetric.group, selectedMetric.key, selectedYear);
      if (cancelled || req !== requestRef.current) return;
      setMetricLayerState(layer);
    }

    run().catch((error) => {
      console.error('Layer resolve failed', error);
      setCompositeLayerState(null);
      setMetricLayerState(null);
    });

    return () => {
      cancelled = true;
    };
  }, [metricAvailable, selectedArea, selectedMetric, selectedYear]);

  useEffect(() => {
    if (!selectedParcelId && selectedParcelDetail) {
      setSelectedParcelDetail(undefined);
    }
  }, [selectedParcelDetail, selectedParcelId, setSelectedParcelDetail]);

  useEffect(() => {
    if (!selectedParcelId) return;

    let cancelled = false;
    const req = ++parcelRequestRef.current;

    async function run() {
      const detail = await getParcelDetail(selectedArea, selectedParcelId, selectedYear);
      if (cancelled || req !== parcelRequestRef.current) return;
      setSelectedParcelDetail(detail);
    }

    run().catch((error) => {
      console.error('Parcel detail load failed', error);
      if (!cancelled && req === parcelRequestRef.current) {
        setSelectedParcelDetail(undefined);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedArea, selectedParcelId, selectedYear, setSelectedParcelDetail]);

  useEffect(() => {
    if (!focusFavorite || !selectedParcelDetail) return;
    if (focusFavorite.area !== selectedArea || focusFavorite.parcelId !== selectedParcelDetail.parcelId) return;

    if (focusFavorite.openAnalytics) {
      openAnalytics();
    }

    clearFavoriteFocus();
  }, [clearFavoriteFocus, focusFavorite, openAnalytics, selectedArea, selectedParcelDetail]);

  const parcelsStyle = useMemo(
    () => ({
      color: '#009DFF',
      weight: 1,
      opacity: 0.85,
      fillOpacity: 0.06,
    }),
    [],
  );

  return (
    <>
      <MapContainer center={[61.5, 129.7]} zoom={7} className="h-full w-full" zoomControl>
        <TileLayer url={selectedBasemap.url} attribution={selectedBasemap.attribution} />

        <FitController area={selectedArea} aoi={activeVectors?.aoi} parcels={activeVectors?.parcels} />

        {compositeLayerState?.url ? (
          <RasterOverlay url={compositeLayerState.url} group="composites" metricKey="annual_composite" />
        ) : null}

        {metricLayerState?.url ? (
          <RasterOverlay url={metricLayerState.url} group={metricLayerState.group} metricKey={metricLayerState.metricKey} />
        ) : null}

        {activeVectors?.aoi ? (
          <GeoJSON
            data={activeVectors.aoi as never}
            style={{ color: '#009DFF', weight: 2, opacity: 0.85, fillOpacity: 0 }}
          />
        ) : null}

        {activeVectors?.parcels ? (
          <GeoJSON
            data={activeVectors.parcels as never}
            style={parcelsStyle}
            onEachFeature={(feature, layer) => {
              layer.on('mouseover', () => {
                layer.setStyle({ weight: 2, fillOpacity: 0.18, color: '#009DFF' });
              });
              layer.on('mouseout', () => {
                layer.setStyle(parcelsStyle);
              });
              layer.on('click', () => {
                const props = (feature.properties ?? {}) as Record<string, unknown>;
                const parcelId = String(props.parcel_id ?? props.id ?? props.parcelId ?? '');
                if (!parcelId) return;
                setSelectedParcelId(parcelId);
              });
            }}
          />
        ) : null}
      </MapContainer>

      {selectedParcelDetail ? <ParcelPopup detail={selectedParcelDetail} /> : null}
      {analyticsOpen && selectedParcelDetail ? <ParcelAnalyticsModal detail={selectedParcelDetail} /> : null}
    </>
  );
}
