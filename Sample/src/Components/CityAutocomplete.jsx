// CityAutocomplete.jsx
// Location input with GeoDB Cities API autocomplete (India only)
// Replace RAPIDAPI_KEY below with your actual RapidAPI key

import { useState, useRef, useEffect } from "react";

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || "API_KEY";
const RAPIDAPI_HOST = "wft-geo-db.p.rapidapi.com";

function CityAutocomplete({ value, onChange }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchCities = async (prefix) => {
        if (!prefix || prefix.length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(
                `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?countryIds=IN&namePrefix=${encodeURIComponent(prefix)}&minPopulation=50000&limit=8&sort=-population`,
                {
                    method: "GET",
                    headers: {
                        "x-rapidapi-key": RAPIDAPI_KEY,
                        "x-rapidapi-host": RAPIDAPI_HOST,
                    },
                }
            );
            const data = await res.json();
            const cities = (data.data || []).map((c) => c.city || c.name);
            setSuggestions(cities);
            setShowDropdown(cities.length > 0);
        } catch (err) {
            console.warn("GeoDB fetch error:", err);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchCities(val), 400);
    };

    const handleSelect = (city) => {
        onChange(city);
        setSuggestions([]);
        setShowDropdown(false);
    };

    return (
        <div className="city-autocomplete" ref={containerRef}>
            <input
                type="text"
                value={value}
                placeholder="e.g. Chennai, Bangalore, Delhi..."
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                autoComplete="off"
            />
            {loading && <div className="city-loading">🔍</div>}
            {showDropdown && suggestions.length > 0 && (
                <ul className="city-dropdown">
                    {suggestions.map((city, i) => (
                        <li
                            key={i}
                            className="city-option"
                            onMouseDown={() => handleSelect(city)}
                        >
                            📍 {city}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CityAutocomplete;
