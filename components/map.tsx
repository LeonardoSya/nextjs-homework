'use client'

import React, { useState } from 'react'
import Map from 'react-map-gl'
import { HexagonLayer } from '@deck.gl/aggregation-layers'
import DeckGL from '@deck.gl/react'
import "mapbox-gl/dist/mapbox-gl.css"

import {
  lightingEffect,
  material,
  INITIAL_VIEW_STATE,
  colorRange,
} from "../lib/mapconfig.js";

const LocationAggregatorMap = () => {
  return (
    <div>
    <DeckGL
      effects={[lightingEffect]}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
    >
      <Map
        className=""
        controller={true}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle="mapbox://styles/petherem/cl2hdvc6r003114n2jgmmdr24"
      ></Map>
    </DeckGL>
  </div>  
  )
}

export default LocationAggregatorMap