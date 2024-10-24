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
  const [coordinates, setCoordinates] = useState({ lng: 0, lat: 0 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 116.27,
    latitude: 40,
    zoom: 12,
    minZoom: 5,
    maxZoom: 15,
    pitch: 40.5,
    bearing: -27,
  });
  const [isAddingFire, setIsAddingFire] = useState(false);

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

    firePointRef.current = new mapboxgl.Marker(el)
      .setLngLat(e.lngLat)
      .addTo(map.current);
  };

  useEffect(() => {
    if (map.current) {
      if (isAddingFire) {
        map.current.on("click", handleMapClick);
      } else {
        map.current.off("click", handleMapClick);
      }
    }
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

    map.current.on("load", () => {
      setIsMapLoaded(true);
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
    new mapboxgl.Marker(el).setLngLat([116.27, 40]).addTo(map.current);

    map.current.on("click", handleMapClick);

    return () => {
      map.current?.off("click", handleMapClick);
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
          className="z-10 fixed shadow-xl top-5 left-5 w-[200px] h-[200px] rounded-lg border-2 border-black"
        />
        <div className="z-10 fixed top-96 left-5 bg-black/70 text-white p-2 rounded-md">
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
        </div>
      </div>
    </>
  );
}


// "use client";

// import mapboxgl from "mapbox-gl";
// import { useEffect, useRef, useState } from "react";
// import "mapbox-gl/dist/mapbox-gl.css";
// import fireTruck from "../../public/fire-truck.svg";
// import firePoint from "../../public/fire-point.svg";
// import MiniMap from "@/components/mini-map";

// export default function FireTruck() {
//   const mapContainer = useRef(null);
//   const map = useRef<mapboxgl.Map | null>(null);
//   const fireMarker = useRef<mapboxgl.Marker | null>(null);
//   const [coordinates, setCoordinates] = useState({ lng: 0, lat: 0 });
//   const [isAddingFire, setIsAddingFire] = useState(false);
//   const [isMapLoaded, setIsMapLoaded] = useState(false);  // 添加地图加载状态
//   const [viewState, setViewState] = useState({
//     longitude: 116.27,
//     latitude: 40,
//     zoom: 12,
//     minZoom: 5,
//     maxZoom: 15,
//     pitch: 40.5,
//     bearing: -27,
//   });

//   const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
//     if (!isAddingFire || !map.current) return;
//     if (fireMarker.current) {
//       fireMarker.current.remove();
//     }

//     const el = document.createElement("div");
//     el.className = "fire-point";
//     el.style.width = "50px";
//     el.style.height = "50px";
//     el.style.backgroundImage = `url(${firePoint.src})`;

//     fireMarker.current = new mapboxgl.Marker(el)
//       .setLngLat(e.lngLat)
//       .addTo(map.current);
//   };

//   useEffect(() => {
//     if (map.current) {
//       if (isAddingFire) {
//         map.current.on("click", handleMapClick);
//       } else {
//         map.current.off("click", handleMapClick);
//       }
//     }
//   }, [isAddingFire]);

//   useEffect(() => {
//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mapbox/dark-v10",
//       center: [116.27, 40],
//       zoom: 12,
//       attributionControl: false,
//       accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
//     });

//     // 监听地图加载完成事件
//     map.current.on('load', () => {
//       setIsMapLoaded(true);
//     });

//     map.current.on("move", () => {
//       setViewState({
//         longitude: map.current.getCenter().lng,
//         latitude: map.current.getCenter().lat,
//         zoom: map.current.getZoom(),
//         pitch: map.current.getPitch(),
//         bearing: map.current.getBearing(),
//         minZoom: 5,
//         maxZoom: 15,
//       });
//     });

//     map.current.on(
//       "mousemove",
//       (e: { lngLat: { lng: number; lat: number } }) => {
//         const lngLat = e.lngLat;
//         setCoordinates({
//           lng: parseFloat(lngLat.lng.toFixed(4)),
//           lat: parseFloat(lngLat.lat.toFixed(4)),
//         });
//       }
//     );

//     // 添加消防车
//     const el = document.createElement("div");
//     el.className = "fire-truck";
//     el.style.width = "50px";
//     el.style.height = "50px";
//     el.style.backgroundImage = `url(${fireTruck.src})`;
//     el.style.backgroundSize = "contain";
//     el.style.backgroundRepeat = "no-repeat";
//     new mapboxgl.Marker(el).setLngLat([116.27, 40]).addTo(map.current);

//     map.current.on("click", handleMapClick);

//     return () => {
//       map.current?.off("click", handleMapClick);
//       map.current?.remove();
//     };
//   }, []);

//   return (
//     <>
//       <div className="relative w-screen h-screen">
//         <div ref={mapContainer} className="absolute w-full h-[100vh]" />
//         <div className="fixed bottom-4 left-4 bg-black/50 text-white p-2 rounded-md">
//           <p>经度：{coordinates.lng}</p>
//           <p>纬度：{coordinates.lat}</p>
//         </div>
//         {/* 只在地图加载完成后显示小地图 */}
//         {isMapLoaded && (
//           <MiniMap
//             viewState={viewState}
//             className="z-10 fixed shadow-xl bottom-24 left-5 w-[200px] h-[200px] rounded-lg border-2 border-black"
//           />
//         )}
//         <div className="z-10 fixed top-96 left-5 bg-black/70 text-white p-2 rounded-md">
//           <button
//             onClick={() => setIsAddingFire(!isAddingFire)}
//             className={`w-full px-4 py-2 rounded-md transition-colors ${
//               isAddingFire
//                 ? "bg-red-600 hover:bg-red-700"
//                 : "bg-slate-600 hover:bg-slate-700"
//             }`}
//           >
//             {isAddingFire ? "停止添加" : "添加火点"}
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }