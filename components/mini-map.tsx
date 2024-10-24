import React from "react";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  minZoom?: number;
  maxZoom?: number;
}

interface MiniMapProps {
  viewState: ViewState;
  className?: string;
}

const MiniMap = ({ viewState, className = "" }: MiniMapProps) => {
  const miniMapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化小地图
    miniMapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom - 4, // 缩小4个级别以显示更大范围
      pitch: 0, // 保持平面视角
      bearing: 0, // 保持正北朝向
      interactive: false, // 禁用交互
      attributionControl: false,
      minZoom: 0,
      maxZoom: 22,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    });

    // 等待地图样式加载完成后再添加图层
    miniMapRef.current.on('load', () => {
      // 添加视野范围数据源
      miniMapRef.current?.addSource('viewport-bounds', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      // 添加视野范围图层
      miniMapRef.current?.addLayer({
        id: 'viewport-bounds',
        type: 'line',
        source: 'viewport-bounds',
        paint: {
          'line-color': '#fff',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    });

    // 添加导航控制
    miniMapRef.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: false,
      }),
      "top-right"
    );

    return () => {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
      }
    };
  }, []);

  // 当主地图视角改变时更新小地图
  useEffect(() => {
    if (miniMapRef.current && miniMapRef.current.loaded()) {
      // 平滑过渡到新的位置
      miniMapRef.current.easeTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: Math.max(viewState.zoom - 4, 0), // 确保缩放级别不小于0
        duration: 500, // 过渡动画持续500ms
        pitch: 0, // 保持平面视角
        bearing: 0, // 保持正北朝向
      });

      // 更新视野范围框
      const bounds = miniMapRef.current.getBounds();
      const coordinates = [
        bounds.getNorthWest().toArray(),
        bounds.getNorthEast().toArray(),
        bounds.getSouthEast().toArray(),
        bounds.getSouthWest().toArray(),
        bounds.getNorthWest().toArray(),
      ];

      // 更新视野范围数据
      const source = miniMapRef.current.getSource('viewport-bounds');
      if (source) {
        (source as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        });
      }
    }
  }, [viewState]);

  return (
    <div
      ref={containerRef}
      className={`${className} relative`}
      style={{ zIndex: 1 }}
    >
    </div>
  );
};

export default MiniMap;
