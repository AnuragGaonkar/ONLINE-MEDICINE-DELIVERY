// src/components/SearchNotFound.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SearchNotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold mb-4 text-green-500">
        No results found
      </h1>
      {query && (
        <p className="text-lg mb-2">
          We could not find any medicine for "<span className="font-semibold">{query}</span>".
        </p>
      )}
      <p className="text-gray-500 mb-6">
        Check the spelling, or try searching with a different name or browse from the home page.
      </p>
      <button
        onClick={handleBackHome}
        className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
      >
        Go to Home
      </button>
    </div>
  );
};

export default SearchNotFound;
