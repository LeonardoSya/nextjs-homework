"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import fireTruck from "../../public/fire-truck.svg";
import firePoint from "../../public/fire-point.svg";
import MiniMap from "@/components/mini-map";

export default function FireTruck() {
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const firePointRef = useRef<mapboxgl.Marker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [coordinates, setCoordinates] = useState({ lng: 0, lat: 0 });
  const [isAddingFire, setIsAddingFire] = useState(false);
  const [firePosition, setFirePosition] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 116.27,
    latitude: 40,
    zoom: 12,
    minZoom: 5,
    maxZoom: 15,
    pitch: 40.5,
    bearing: -27,
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const fireTruckMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!isAddingFire || !map.current) return;
    if (firePointRef.current) {
      firePointRef.current.remove();
    }

    const el = document.createElement("div");
    el.className = "fire-point";
    el.style.width = "50px";
    el.style.height = "50px";
    el.style.backgroundImage = `url(${firePoint.src})`;
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    setFirePosition(e.lngLat);
    firePointRef.current = new mapboxgl.Marker(el)
      .setLngLat(e.lngLat)
      .addTo(map.current);
  };

  const handleNavigate = async () => {
    if (
      !map.current ||
      !firePosition ||
      !fireTruckMarkerRef.current ||
      isNavigating
    )
      return;

    setIsNavigating(true);
    const start = fireTruckMarkerRef.current.getLngLat();
    const end = firePosition;

    try {
      // 调用 Mapbox Directions API
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );
      const json = await query.json();
      const route = json.routes[0].geometry;

      // 添加路线图层
      if (map.current.getSource("route")) {
        (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData(
          route
        );
      } else {
        map.current.addSource("route", {
          type: "geojson",
          data: route,
        });
        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#f5222d",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
      }

      // 动画移动消防车
      const coordinates = route.coordinates;
      let counter = 0;

      const animate = () => {
        if (counter >= coordinates.length) {
          setIsNavigating(false);
          firePointRef.current?.remove();
          return;
        }

        fireTruckMarkerRef.current?.setLngLat(coordinates[counter]);
        counter++;

        requestAnimationFrame(() => {
          setTimeout(animate, 100);
        });
      };

      animate();
    } catch (error) {
      console.error("导航错误:", error);
      setIsNavigating(false);
    }
  };

  useEffect(() => {
    if (map.current) {
      abortControllerRef.current?.abort();
      if (isAddingFire) {
        abortControllerRef.current = new AbortController();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.current.on("click", handleMapClick, {
          signal: abortControllerRef.current.signal,
        });
      }
    }

    return () => {
      map.current?.off("click", handleMapClick);
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [isAddingFire]);

  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [116.27, 40],
      zoom: 12,
      attributionControl: false,
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    });

    map.current.on("move", () => {
      setViewState({
        longitude: map.current.getCenter().lng,
        latitude: map.current.getCenter().lat,
        zoom: map.current.getZoom(),
        pitch: map.current.getPitch(),
        bearing: map.current.getBearing(),
        minZoom: 5,
        maxZoom: 15,
      });
    });

    map.current.on(
      "mousemove",
      (e: { lngLat: { lng: number; lat: number } }) => {
        const lngLat = e.lngLat;
        setCoordinates({
          lng: parseFloat(lngLat.lng.toFixed(4)),
          lat: parseFloat(lngLat.lat.toFixed(4)),
        });
      }
    );

    // 添加消防车
    const el = document.createElement("div");
    el.className = "fire-truck";
    el.style.width = "50px";
    el.style.height = "50px";
    el.style.backgroundImage = `url(${fireTruck.src})`;
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    fireTruckMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([116.27, 40])
      .addTo(map.current);

    return () => {
      if (map.current?.getLayer('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
      abortControllerRef.current?.abort();
      firePointRef.current?.remove();
      fireTruckMarkerRef.current?.remove();
      map.current?.remove();
    };
  }, []);

  return (
    <>
      <div className="relative w-screen h-screen">
        <div ref={mapContainer} className="absolute w-full h-[100vh]" />
        <div className="fixed bottom-4 left-4 bg-black/50 text-white p-2 rounded-md">
          <p>经度：{coordinates.lng}</p>
          <p>纬度：{coordinates.lat}</p>
        </div>
        <MiniMap
          viewState={viewState}
          className="absolute top-5 left-5 w-[200px] h-[200px] rounded-lg overflow-hidden border-2 border-slate-700"
        />
        <div className="z-10 fixed top-96 left-5 bg-black/70 text-white p-4 rounded-md">
          <button
            onClick={() => setIsAddingFire(!isAddingFire)}
            className={`w-full px-4 py-2 rounded-md transition-colors ${
              isAddingFire
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-600 hover:bg-slate-700"
            }`}
          >
            {isAddingFire ? "停止添加" : "添加火点"}
          </button>
          <button
            onClick={handleNavigate}
            disabled={!firePosition || isNavigating}
            className={`mt-4 w-full px-4 py-2 rounded-md transition-colors ${
              !firePosition || isNavigating
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isNavigating ? "正在前往..." : "前往灭火"}
          </button>
        </div>
      </div>
    </>
  );
}
