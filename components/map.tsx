"use client";

import React, { useState } from "react";
import Map from "react-map-gl";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import DeckGL from "@deck.gl/react";
import {
  lightingEffect,
  material,
  INITIAL_VIEW_STATE,
  colorRange,
} from "../lib/mapconfig";
import "mapbox-gl/dist/mapbox-gl.css";
import MiniMap from "./mini-map";

const LocationAggregatorMap = ({
  upperPercentile = 100,
  coverage = 1,
  data,
  perPage,
  setPerPage,
  fetchData,
}) => {
  const [radius, setRadius] = useState(1000);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const handleRadiusChange = (e) => {
    console.log(e.target.value);
    setRadius(e.target.value);
  };

  const layers = [
    new HexagonLayer({
      id: "heatmap",
      colorRange,
      coverage,
      data,
      elevationRange: [0, 3000],
      elevationScale: data && data.length ? 50 : 0,
      extruded: true,
      getPosition: (d) => d,
      pickable: true,
      radius,
      upperPercentile,
      material,
      transitions: {
        elevationScale: 3000,
      },
    }),
  ];

  const getTooltip = ({ object }) => {
    if (!object) return null;
    const lat = object.position[1];
    const lng = object.position[0];
    const count = object.points.length;

    return `\
    纬度: ${Number.isFinite(lat) ? lat.toFixed(6) : ""}
    精度: ${Number.isFinite(lng) ? lng.toFixed(6) : ""}
    这里有${count}个物流服务运营商 🧐`;
  };

  return (
    <div>
      <DeckGL
        layers={layers}
        effects={[lightingEffect]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
      >
        <Map
          className=""
          controller={true}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/petherem/cl2hdvc6r003114n2jgmmdr24"
        />

        <div className="absolute bg-slate-900 text-white min-h-[200px] h-auto w-[250px] top-10 left-5 rounded-lg p-4 text-sm">
          <div className="flex flex-col">
            <h2 className="font-bold text-xl uppercase my-2">
              Created By 张毅阳
            </h2>
            <h2 className="font-bold text-xl uppercase mb-1">地图控制器 👀</h2>
            <h2 className="font-bold text-md uppercase mb-4">
              拖动滑块调整数据的大小
            </h2>
            <input
              name="radius"
              className="w-fit py-2"
              type="range"
              value={radius}
              min={500}
              step={50}
              max={10000}
              onChange={handleRadiusChange}
            />
            <label htmlFor="radius" className="mt-1">
              <span className="bg-slate-500 font-bold text-white px-2 py-1 rounded-md">
                {radius}
              </span>
              米
            </label>
            <div className="mt-4">
              <label htmlFor="perPage" className="block mb-2">
                自定义数据量:
              </label>
              <input
                type="number"
                id="perPage"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  fetchData();
                }}
                min="1"
                max="28000"
                className="w-full border rounded px-2 py-1 text-black"
              />
            </div>
            <p className="mt-2">
              共查询到 <span className="font-bold">{data.length}</span>{" "}
              个物流服务运营商
            </p>
          </div>
        </div>
        <div className="absolute bg-slate-900 text-white min-h-[200px] h-auto w-[250px] top-10 right-5 rounded-lg p-4 text-sm">
          <div className="flex flex-col">
            <h2 className="font-bold text-xl uppercase mb-2">项目说明</h2>
            <p className="mb-2">
              本简易实验作业使用了 InPost 提供的欧洲物流服务点数据。 数据来源:{" "}
              <a
                href="https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/28639230/1.23.0+Points"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                InPost API文档
              </a>
            </p>
            <h3 className="font-bold text-lg mt-2 mb-1">功能介绍：</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                使用 Next.js
                构建（这是我最近忙里偷闲学的新的全栈开发方案，也希望之后可以用
                Next.js 重构 Firelens）
              </li>
              <li>
                集成 Mapbox GL 加载任何数据（这里仅用 geojson
                作演示）实现地图可视化和交互
              </li>
              <li>使用 deck.gl 绘制热力图</li>
              <li>支持动态调整数据聚合半径</li>
              <li>支持自定义数据量</li>
              <li>添加鹰眼图实现简易定位</li>
            </ul>
          </div>
        </div>
        <MiniMap
          viewState={viewState}
          className="absolute top-[63vh] left-5 w-[200px] h-[200px] rounded-lg overflow-hidden border-2 border-slate-700"
        />
      </DeckGL>
    </div>
  );
};

export default LocationAggregatorMap;
