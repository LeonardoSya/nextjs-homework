"use client";

import React, { useState, useEffect } from "react";
import LocationAggregatorMap from "../components/map";

const HomePage = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [details, setDetails] = useState([]);
  const [coordinates, setCoordinates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [perPage, setPerPage] = useState(5000);

  const handlePerPageChange = (e) => {
    setPerPage(e.target.value);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `https://api-shipx-pl.easypack24.net/v1/points?per_page=${perPage}`
      );
      const data = await res.json();
      setDetails(data.items);

      const coords = data.items.map((item) => [
        item.location.longitude,
        item.location.latitude,
      ]);
      setCoordinates(coords);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [perPage]);

  return (
    <div className="relative min-h-screen">
      {isLoading && (
        <div className="flex justify-center items-center w-200">Loading...</div>
      )}
      <LocationAggregatorMap
        data={coordinates}
        perPage={perPage}
        setPerPage={setPerPage}
        fetchData={fetchData}
      />
    </div>
  );
};

export default HomePage;
