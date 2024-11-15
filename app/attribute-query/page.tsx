"use client";

import React, { useState, useCallback } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl";
import { ScatterplotLayer, PolygonLayer } from "@deck.gl/layers";
import * as turf from "@turf/turf";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
);

interface Property {
  key: string;
  value: string | number;
  type: "string" | "number";
}

interface Point {
  longitude: number;
  latitude: number;
  properties: Property[];
}

interface Polygon {
  polygon: number[][];
  fillColor: [number, number, number, number];
  lineColor: [number, number, number];
}

const INITIAL_VIEW_STATE = {
  longitude: 120.19,
  latitude: 30.26,
  zoom: 11,
  pitch: 0,
  bearing: 0,
  transitionDuration: 1000,
};

const AttributeQueryPage = () => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [points, setPoints] = useState<Point[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<number[][]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newPoint, setNewPoint] = useState({
    longitude: "",
    latitude: "",
    properties: [{ key: "", value: "", type: "string" as const }],
  });
  const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [clusters, setClusters] = useState<
    {
      points: Point[];
      center: [number, number];
      count: number;
    }[]
  >([]);
  const [clusterDistance, setClusterDistance] = useState<number>(1); // 单位：公里

  // 添加新属性字段
  const addProperty = () => {
    setNewPoint((prev) => ({
      ...prev,
      properties: [...prev.properties, { key: "", value: "", type: "string" }],
    }));
  };

  // 更新属性值
  const updateProperty = (
    index: number,
    field: keyof Property,
    value: string
  ) => {
    setNewPoint((prev) => {
      const newProperties = [...prev.properties];
      if (field === "type") {
        newProperties[index] = {
          ...newProperties[index],
          [field]: value as "string" | "number",
          value: "", // 重置值当类型改变时
        };
      } else {
        newProperties[index] = {
          ...newProperties[index],
          [field]: value,
        };
      }
      return { ...prev, properties: newProperties };
    });
  };

  // 删除属性字段
  const removeProperty = (index: number) => {
    setNewPoint((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }));
  };

  // 处理点击事件
  const handleClick = useCallback(
    (event) => {
      if (!isDrawing) {
        const { object } = event;
        if (object) {
          setHoveredPoint(object);
        }
        return;
      }

      const { coordinate } = event;
      setDrawingPoints((points) => [...points, coordinate]);
    },
    [isDrawing]
  );

  // 开始绘制
  const startDrawing = () => {
    setIsDrawing(true);
    setDrawingPoints([]);
  };

  // 完成绘制
  const finishDrawing = () => {
    if (drawingPoints.length < 3) {
      alert("请至少绘制3个点以形成多边形");
      return;
    }

    // 闭合多边形
    const closedPolygon = [...drawingPoints, drawingPoints[0]];

    const newPolygon: Polygon = {
      polygon: closedPolygon,
      fillColor: [0, 0, 255, 100],
      lineColor: [0, 0, 255],
    };

    setPolygons((polygons) => [...polygons, newPolygon]);

    try {
      // 使用turf.js进行空间查询
      const turfPolygon = turf.polygon([closedPolygon]);
      const selected = points.filter((point) => {
        const pt = turf.point([point.longitude, point.latitude]);
        return turf.booleanPointInPolygon(pt, turfPolygon);
      });

      setSelectedPoints(selected);
    } catch (error) {
      console.error("空间查询失败:", error);
      alert("框选查询失败，请重试");
    }

    setDrawingPoints([]);
    setIsDrawing(false);
  };

  // 清除多边形
  const clearPolygons = () => {
    setPolygons([]);
    setSelectedPoints([]);
    setDrawingPoints([]);
  };

  // 添加点的输入验证
  const validatePointInput = () => {
    const lon = Number(newPoint.longitude);
    const lat = Number(newPoint.latitude);

    if (isNaN(lon) || isNaN(lat)) {
      alert("请输入有效的经纬度");
      return false;
    }

    if (lon < -180 || lon > 180) {
      alert("经度范围应在-180到180之间");
      return false;
    }

    if (lat < -90 || lat > 90) {
      alert("纬度范围应在-90到90之间");
      return false;
    }

    // 验证属性字段
    const invalidProps = newPoint.properties.filter(
      (prop) => !prop.key || prop.value === ""
    );
    if (invalidProps.length > 0) {
      alert("请填写完整的属性字段信息");
      return false;
    }

    return true;
  };

  // 修改添加点的处理函数
  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePointInput()) {
      return;
    }

    try {
      // 验证属性值类型
      const validProperties = newPoint.properties.map((prop) => ({
        ...prop,
        value: prop.type === "number" ? Number(prop.value) : prop.value,
      }));

      const point: Point = {
        longitude: Number(newPoint.longitude),
        latitude: Number(newPoint.latitude),
        properties: validProperties,
      };

      setPoints((prevPoints) => [...prevPoints, point]);

      setViewState({
        ...viewState,
        longitude: point.longitude,
        latitude: point.latitude,
        zoom: 13,
        transitionDuration: 1000,
      });

      // 重置表单
      setNewPoint({
        longitude: "",
        latitude: "",
        properties: [{ key: "", value: "", type: "string" }],
      });
    } catch (error) {
      console.error("添加点位失败:", error);
      alert("添加点位失败，请重试");
    }
  };

  const layers = [
    new ScatterplotLayer({
      id: "scatter-layer",
      data: points,
      getPosition: (d) => [d.longitude, d.latitude],
      getFillColor: (d) =>
        selectedPoints.includes(d) ? [255, 255, 0] : [255, 0, 0],
      getRadius: 100,
      pickable: true,
      onHover: ({ object }) => setHoveredPoint(object),
    }),
    // 已完成的多边形图层
    new PolygonLayer({
      id: "polygon-layer",
      data: polygons,
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => d.fillColor,
      getLineColor: (d) => d.lineColor,
      lineWidthMinPixels: 2,
      pickable: true,
      filled: true,
      stroked: true,
      wireframe: true,
    }),
    // 正在绘制的多边形图层
    new PolygonLayer({
      id: "drawing-layer",
      data:
        drawingPoints.length > 2
          ? [
              {
                polygon: [...drawingPoints, drawingPoints[0]],
                fillColor: [255, 0, 0, 100],
                lineColor: [255, 0, 0],
              },
            ]
          : [],
      getPolygon: (d) => d.polygon,
      getFillColor: (d) => d.fillColor,
      getLineColor: (d) => d.lineColor,
      lineWidthMinPixels: 2,
      filled: true,
      stroked: true,
      wireframe: true,
    }),
  ];

  // 自定义控制器设置
  const getController = () => {
    if (isDrawing) {
      return {
        dragPan: false,
        dragRotate: false,
        scrollZoom: true,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      };
    }
    return true;
  };

  // 计算数据统计信息
  const getStatistics = useCallback(() => {
    if (points.length === 0) return null;

    // 获取所有数值类型的属性
    const numericProperties = points.reduce((acc, point) => {
      point.properties.forEach((prop) => {
        if (prop.type === "number" && !acc.includes(prop.key)) {
          acc.push(prop.key);
        }
      });
      return acc;
    }, [] as string[]);

    // 计算每个数值属性的统计信息
    const stats = numericProperties.map((key) => {
      const values = points
        .map(
          (point) =>
            point.properties.find((prop) => prop.key === key)?.value as number
        )
        .filter((value) => !isNaN(value));

      return {
        key,
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values),
      };
    });

    return stats;
  }, [points]);

  // 准备图表数据
  const getChartData = useCallback(() => {
    if (points.length === 0) return null;

    const stats = getStatistics();
    if (!stats) return null;

    return {
      labels: stats.map((stat) => stat.key),
      datasets: [
        {
          label: "平均值",
          data: stats.map((stat) => stat.avg),
          backgroundColor: "rgba(99, 102, 241, 0.5)",
          borderColor: "rgb(99, 102, 241)",
          borderWidth: 1,
        },
      ],
    };
  }, [points, getStatistics]);

  // 在现有的统计分析面板中添加聚类分析部分
  const performClustering = useCallback(() => {
    if (points.length === 0) {
      alert("请先添加点位数据");
      return;
    }

    try {
      // 将点位数据转换为 GeoJSON 格式
      const features = points.map((point) =>
        turf.point([point.longitude, point.latitude], { ...point })
      );
      const collection = turf.featureCollection(features);

      // 执行聚类分析
      const clustered = turf.clustersKmeans(collection, {
        minPoints: 1,
        maxDistance: clusterDistance * 1000, // 转换为米
        units: "meters",
      });

      // 处理聚类结果
      const clusterGroups = new Map<number, Point[]>();
      const clusterCenters = new Map<number, [number, number]>();

      clustered.features.forEach((feature) => {
        const clusterNumber = feature.properties?.cluster;
        const point = points.find(
          (p) =>
            p.longitude === feature.geometry.coordinates[0] &&
            p.latitude === feature.geometry.coordinates[1]
        );

        if (point) {
          if (!clusterGroups.has(clusterNumber)) {
            clusterGroups.set(clusterNumber, []);
            clusterCenters.set(clusterNumber, [0, 0]);
          }
          clusterGroups.get(clusterNumber)!.push(point);
        }
      });

      // 计算每个聚类的中心点
      const clusterResults = Array.from(clusterGroups.entries()).map(
        ([id, points]) => {
          const center = points.reduce(
            (acc, point) => {
              acc[0] += point.longitude / points.length;
              acc[1] += point.latitude / points.length;
              return acc;
            },
            [0, 0]
          ) as [number, number];

          return {
            points,
            center,
            count: points.length,
          };
        }
      );

      setClusters(clusterResults);

      // 更新图层以显示聚类结果
      const newLayers = [...layers];
      newLayers[0] = new ScatterplotLayer({
        ...layers[0],
        getFillColor: (d) => {
          const cluster = clusterResults.find((c) =>
            c.points.some(
              (p) => p.longitude === d.longitude && p.latitude === d.latitude
            )
          );
          return cluster
            ? [
                (cluster.points.length * 50) % 255,
                (cluster.points.length * 100) % 255,
                (cluster.points.length * 150) % 255,
              ]
            : [255, 0, 0];
        },
      });
    } catch (error) {
      console.error("聚类分析失败:", error);
      alert("聚类分析失败，请重试");
    }
  }, [points, clusterDistance, layers]);

  return (
    <div className="relative min-h-screen bg-slate-100">
      <div className="absolute top-4 left-4 z-10 bg-white p-6 rounded-lg shadow-lg max-w-md">
        <div className="flex gap-3 mb-6">
          {!isDrawing ? (
            <button
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 
                         transition-colors duration-200 shadow-sm"
              onClick={startDrawing}
            >
              开始框选
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 
                         transition-colors duration-200 shadow-sm"
              onClick={finishDrawing}
            >
              完成框选
            </button>
          )}

          {polygons.length > 0 && (
            <button
              className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 
                         transition-colors duration-200 shadow-sm"
              onClick={clearPolygons}
            >
              清除框选
            </button>
          )}
        </div>

        <form onSubmit={handleAddPoint} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="经度"
              value={newPoint.longitude}
              onChange={(e) =>
                setNewPoint({ ...newPoint, longitude: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                         focus:border-indigo-500 transition-colors duration-200
                         text-slate-600 placeholder-slate-400"
            />
            <input
              type="text"
              placeholder="纬度"
              value={newPoint.latitude}
              onChange={(e) =>
                setNewPoint({ ...newPoint, latitude: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                         focus:border-indigo-500 transition-colors duration-200
                         text-slate-600 placeholder-slate-400"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-700 font-medium">属性字段</h4>
            {newPoint.properties.map((prop, index) => (
              <div key={index} className="grid grid-cols-10 gap-2 items-center">
                <input
                  type="text"
                  placeholder="字段名"
                  value={prop.key}
                  onChange={(e) => updateProperty(index, "key", e.target.value)}
                  className="col-span-3 px-3 py-2 border border-slate-200 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                             focus:border-indigo-500 transition-colors duration-200
                             text-slate-600 placeholder-slate-400"
                />
                <input
                  type={prop.type === "number" ? "number" : "text"}
                  placeholder="字段值"
                  value={prop.value}
                  onChange={(e) =>
                    updateProperty(index, "value", e.target.value)
                  }
                  className="col-span-3 px-3 py-2 border border-slate-200 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                             focus:border-indigo-500 transition-colors duration-200
                             text-slate-600 placeholder-slate-400"
                />
                <select
                  value={prop.type}
                  onChange={(e) =>
                    updateProperty(index, "type", e.target.value)
                  }
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                             focus:border-indigo-500 transition-colors duration-200
                             text-slate-600 bg-white appearance-none cursor-pointer"
                >
                  <option value="string">文本</option>
                  <option value="number">数字</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeProperty(index)}
                  className="col-span-2 px-3 py-2 bg-rose-100 text-rose-600 rounded-md 
                             hover:bg-rose-200 transition-colors duration-200"
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addProperty}
              className="w-full px-4 py-2 bg-slate-100 text-slate-600 rounded-md 
                         hover:bg-slate-200 transition-colors duration-200"
            >
              + 添加字段
            </button>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-indigo-500 text-white rounded-md 
                       hover:bg-indigo-600 transition-colors duration-200 shadow-sm"
          >
            添加点
          </button>
        </form>

        {selectedPoints.length > 0 && (
          <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
            <h3 className="text-slate-700 font-medium mb-3">
              选中的点：{selectedPoints.length}个
            </h3>
            <ul className="space-y-3">
              {selectedPoints.map((point, index) => (
                <li key={index} className="text-slate-600">
                  <div className="font-medium">
                    经度: {point.longitude}, 纬度: {point.latitude}
                  </div>
                  <div className="ml-4 mt-1 space-y-1">
                    {point.properties.map((prop, propIndex) => (
                      <div key={propIndex} className="text-slate-500">
                        {prop.key}: {prop.value}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hoveredPoint && !isDrawing && (
          <div className="mt-6 p-4 bg-white rounded-md border border-slate-200 shadow-sm">
            <h4 className="text-slate-700 font-medium mb-2">点位属性</h4>
            <div className="text-slate-600 mb-2">
              经度: {hoveredPoint.longitude}, 纬度: {hoveredPoint.latitude}
            </div>
            <div className="space-y-1">
              {hoveredPoint.properties.map((prop, index) => (
                <div key={index} className="text-slate-500">
                  {prop.key}: {prop.value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 bg-white p-6 rounded-lg shadow-lg max-w-md 
                      max-h-[calc(100vh-2rem)] overflow-y-auto
                      scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <h3 className="text-slate-700 font-medium mb-4 sticky top-0 bg-white pt-1 pb-3 
                       border-b border-slate-100">
          空间数据分析
        </h3>

        {points.length > 0 ? (
          <div className="space-y-6">
            {/* 基础统计信息 */}
            <div>
              <h4 className="text-slate-600 font-medium mb-2">基础统计</h4>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-slate-600">总点位数：{points.length}</p>
                <p className="text-slate-600">
                  已选点位：{selectedPoints.length}
                </p>
              </div>
            </div>

            {/* 数值属性统计 */}
            {getStatistics()?.map((stat) => (
              <div key={stat.key} className="bg-slate-50 p-4 rounded-md">
                <h5 className="text-slate-600 font-medium mb-2">{stat.key}</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-slate-500">
                    平均值：{stat.avg.toFixed(2)}
                  </div>
                  <div className="text-slate-500">
                    总和：{stat.sum.toFixed(2)}
                  </div>
                  <div className="text-slate-500">
                    最大值：{stat.max.toFixed(2)}
                  </div>
                  <div className="text-slate-500">
                    最小值：{stat.min.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            {/* 添加聚类分析控制 */}
            <div>
              <h4 className="text-slate-600 font-medium mb-2">空间聚类分析</h4>
              <div className="bg-slate-50 p-4 rounded-md space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-slate-600 whitespace-nowrap">
                    聚类距离(km)：
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={clusterDistance}
                    onChange={(e) => setClusterDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md 
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                               focus:border-indigo-500 transition-colors duration-200
                               text-slate-600"
                  />
                </div>
                <button
                  onClick={performClustering}
                  className="w-full px-4 py-2 bg-indigo-500 text-white rounded-md 
                           hover:bg-indigo-600 transition-colors duration-200 shadow-sm"
                >
                  执行聚类分析
                </button>
              </div>
            </div>

            {/* 聚类结果展示 */}
            {clusters.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-md">
                <h5 className="text-slate-600 font-medium mb-2">聚类结果</h5>
                <div className="space-y-2">
                  <p className="text-slate-600">聚类总数：{clusters.length}</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {clusters.map((cluster, index) => (
                      <div
                        key={index}
                        className="bg-white p-3 rounded-md shadow-sm"
                      >
                        <p className="text-slate-600 font-medium">
                          聚类 #{index + 1} ({cluster.points.length}个点)
                        </p>
                        <p className="text-slate-500 text-sm">
                          中心点：[{cluster.center[0].toFixed(4)},{" "}
                          {cluster.center[1].toFixed(4)}]
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 图表展示 */}
            <div className="mt-6">
              <h4 className="text-slate-600 font-medium mb-2">数据可视化</h4>
              <div className="bg-white p-4 rounded-md border border-slate-200">
                {getChartData() && (
                  <Bar
                    data={getChartData()!}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: "top" as const,
                        },
                        title: {
                          display: true,
                          text: "数值属性统计",
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-8">
            暂无数据，请先添加点位
          </div>
        )}
      </div>

      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={getController()}
        layers={layers}
        onClick={handleClick}
      >
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v10"
        />
      </DeckGL>
    </div>
  );
};

export default AttributeQueryPage;
