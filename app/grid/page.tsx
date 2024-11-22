"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface TerrainInfo {
  elevation: number;
  lat: number;
  lng: number;
  slope?: number;    // 坡度（度）
  aspect?: string;   // 坡向（方向）
  roughness?: number; // 地形起伏度
}

const getAspectDescription = (aspect: number): string => {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const index = Math.floor(((aspect + 22.5) % 360) / 45);
  return directions[index];
};

const calculateTerrainMetrics = async (
  lng: number, 
  lat: number, 
  zoom: number,
  pixels: Uint8Array,
  pixelX: number,
  pixelY: number
): Promise<{ slope: number; aspect: string; roughness: number }> => {
  try {
    // 获取3x3网格的高程值
    const elevationGrid: number[][] = [];
    for (let i = -1; i <= 1; i++) {
      const row: number[] = [];
      for (let j = -1; j <= 1; j++) {
        const x = pixelX + j;
        const y = pixelY + i;
        
        if (x < 0 || x >= 256 || y < 0 || y >= 256) {
          row.push(0);
          continue;
        }
        
        const idx = ((y * 256) + x) * 4;
        const R = pixels[idx];
        const G = pixels[idx + 1];
        const B = pixels[idx + 2];
        
        const elevation = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);
        row.push(elevation);
      }
      elevationGrid.push(row);
    }

    // 计算坡度（使用Horn算法）
    const [z1, z2, z3, z4, z5, z6, z7, z8, z9] = [
      elevationGrid[0][0], elevationGrid[0][1], elevationGrid[0][2],
      elevationGrid[1][0], elevationGrid[1][1], elevationGrid[1][2],
      elevationGrid[2][0], elevationGrid[2][1], elevationGrid[2][2]
    ];

    // 计算x方向梯度
    const dx = ((z3 + 2*z6 + z9) - (z1 + 2*z4 + z7)) / (8 * 30);
    // 计算y方向梯度
    const dy = ((z7 + 2*z8 + z9) - (z1 + 2*z2 + z3)) / (8 * 30);

    // 计算坡度（度）
    const slope = Math.atan(Math.sqrt(dx*dx + dy*dy)) * (180/Math.PI);

    // 计算坡向（度）
    const aspect = ((Math.atan2(dy, -dx) * (180/Math.PI)) + 360) % 360;

    // 计算地形起伏度（简单版本：中心点与周围点的高程差的标准差）
    const centerElevation = elevationGrid[1][1];
    const differences = [
      z1, z2, z3, z4, z6, z7, z8, z9
    ].map(z => Math.abs(z - centerElevation));
    const roughness = Math.sqrt(
      differences.reduce((sum, diff) => sum + diff * diff, 0) / differences.length
    );

    return {
      slope,
      aspect: getAspectDescription(aspect),
      roughness
    };
  } catch (error) {
    console.error("Error calculating terrain metrics:", error);
    throw error;
  }
};

const InfoPanel = ({ info }: { info: TerrainInfo | null }) => {
  if (!info) return null;
  
  const formatNumber = (value: number | undefined, decimals: number = 1): string => {
    if (typeof value !== 'number') return '未知';
    return value.toFixed(decimals);
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-10 
      bg-white/10 backdrop-blur-md 
      rounded-lg p-4 
      border border-white/20
      text-white text-sm
      shadow-lg
      space-y-1">
      <div>经度: {formatNumber(info.lng, 4)}°</div>
      <div>纬度: {formatNumber(info.lat, 4)}°</div>
      <div>海拔: {formatNumber(info.elevation)} 米</div>
      {info.slope !== undefined && <div>坡度: {formatNumber(info.slope)}°</div>}
      {info.aspect && <div>坡向: {info.aspect}</div>}
      {info.roughness !== undefined && <div>起伏度: {formatNumber(info.roughness/10000)} 米</div>}
    </div>
  );
};

const MapToggleButton = ({
  isVisible,
  onClick,
}: {
  isVisible: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        absolute top-4 right-4 z-10
        px-4 py-2
        backdrop-blur-md
        border border-gray-200/20
        rounded-lg
        transition-all duration-300 ease-in-out
        ${
          isVisible
            ? "bg-white/10 hover:bg-white/20 text-white"
            : "bg-blue-500/80 hover:bg-blue-600/80 text-white"
        }
        shadow-lg hover:shadow-xl
        transform hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        font-medium text-sm
      `}
    >
      {isVisible ? "隐藏高程图层" : "显示高程图层"}
    </button>
  );
};

export default function GridPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isTerrainVisible, setIsTerrainVisible] = useState(true);
  const [terrainInfo, setTerrainInfo] = useState<TerrainInfo | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [120, 30],
      zoom: 3,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    });

    map.current.on("load", () => {
      // 添加Mapbox的terrain-rgb数据源
      map.current?.addSource("terrain-rgb", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 256,
      });

      // 添加高程可视化图层
      map.current?.addLayer({
        id: "terrain-layer",
        type: "hillshade",
        source: "terrain-rgb",
        paint: {
          "hillshade-exaggeration": 1,
        },
      });

      // 添加点击事件监听器
      map.current.on("click", async (e) => {
        const { lng, lat } = e.lngLat;
        
        try {
          const terrainData = await queryElevation(lng, lat);
          setTerrainInfo(terrainData);
        } catch (error) {
          console.error("获取高程数据失败:", error);
          setTerrainInfo(null);
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // 经纬度转瓦片坐标
  const getTileCoordinates = (lng: number, lat: number, zoom: number) => {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  };

  // 查询高程值的函数
  const queryElevation = async (lng: number, lat: number): Promise<TerrainInfo> => {
    if (!map.current) throw new Error('地图未初始化');

    try {
      const zoom = Math.floor(map.current.getZoom());
      const { x, y } = getTileCoordinates(lng, lat, zoom);
      
      const response = await fetch(
        `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.pngraw?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );
      
      if (!response.ok) throw new Error('获取高程数据失败');
      
      const data = await response.arrayBuffer();
      const pixels = new Uint8Array(data);
      
      // 计算点击位置在瓦片内的像素位置
      const pixelX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom) * 256 % 256);
      const pixelY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom) * 256 % 256);
      
      // 添加边界检查
      if (pixelX < 0 || pixelX >= 256 || pixelY < 0 || pixelY >= 256) {
        throw new Error('像素坐标超出范围');
      }
      
      // 计算像素在数组中的位置
      const idx = (pixelY * 256 + pixelX) * 4;
      
      // 添加数组边界检查
      if (idx < 0 || idx + 2 >= pixels.length) {
        throw new Error('像素索引超出范围');
      }
      
      // 获取RGB值
      const R = pixels[idx];
      const G = pixels[idx + 1];
      const B = pixels[idx + 2];
      
      // 验证RGB值
      if (R === undefined || G === undefined || B === undefined) {
        throw new Error('无法读取RGB值');
      }
      
      // 使用正确的解码公式计算高程（确保返回数字类型）
      const height = Number((-10000 + ((R * 256 * 256 + G * 256 + B) * 0.1))/100);
      
      // 验证计算结果
      if (isNaN(height) || !isFinite(height)) {
        throw new Error('高程值计算错误');
      }

      // 计算地形指标
      const metrics = await calculateTerrainMetrics(lng, lat, zoom, pixels, pixelX, pixelY);

      // 确保所有返回值都是数字类型
      return {
        elevation: height,
        lat: Number(lat),
        lng: Number(lng),
        ...metrics
      };
    } catch (error) {
      console.error("Error querying elevation:", error);
      throw error;
    }
  };

  const toggleTerrain = () => {
    if (!map.current) return;

    const newVisibility = !isTerrainVisible;
    map.current.setLayoutProperty(
      "terrain-layer",
      "visibility",
      newVisibility ? "visible" : "none"
    );
    setIsTerrainVisible(newVisibility);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute w-full h-full cursor-crosshair" />
      <MapToggleButton isVisible={isTerrainVisible} onClick={toggleTerrain} />
      <InfoPanel info={terrainInfo} />
    </div>
  );
}
