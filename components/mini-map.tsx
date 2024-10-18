import React from "react";
import Map from "react-map-gl";

const MiniMap = ({ viewState }) => {
  return (
    <div className="absolute bottom-2 left-2 w-64 h-64 border-2 border-gray-500 rounded-lg overflow-hidden">
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v10"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        interactive={false}
      >
        <div
          style={{
            position: "absolute",
            border: "3px solid #ff4136",
            boxSizing: "border-box",
            left: `${((viewState.longitude + 180) / 360) * 100}%`,
            top: `${((90 - viewState.latitude) / 180) * 100}%`,
            width: `${(360 / Math.pow(2, viewState.zoom) / 360) * 100}%`,
            height: `${(180 / Math.pow(2, viewState.zoom) / 180) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </Map>
    </div>
  );
};

export default MiniMap;
