import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

import { useAuth } from "./context/AuthContext";
import Header from "./Components/Header";
import SearchForm from "./Components/SearchForm";
import JobCard from "./Components/JobCard";
import SearchHistory from "./Components/SearchHistory";
import AiChatbot from "./Components/AiChatbot";

const BACKEND_URL = ""; // Relative URL — Nginx proxies /api/* to Spring Boot backend

function App() {
  const { user } = useAuth();

  // --- Search Mode (internship / job) ---
  const [searchMode, setSearchMode] = useState("internship");

  // --- Filter State ---
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [mode, setMode] = useState("");
  const [sector, setSector] = useState("");
  const [salaryMin, setSalaryMin] = useState("");

  // --- Result State ---
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- History Panel State ---
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef(null);

  // --- Fetch Recommendations from Python Backend ---
  const fetchJobs = async () => {
    if (!query && !sector && !skills) {
      setError("Please enter at least a job role, skills, or select a sector.");
      return;
    }
    setLoading(true);
    setError("");
    setJobs([]);
    try {
      const res = await axios.get("/recommendations/api/recommendations", {
        params: {
          q: query,
          location,
          skills,
          contract_time: mode,
          category: sector,
          salary_min: salaryMin || undefined,
          search_mode: searchMode,
        },
      });

      if (res.data.success && res.data.results.length > 0) {
        setJobs(res.data.results);
        // ✅ Save to history if user is logged in
        if (user) {
          saveSearchHistory();
        }
      } else {
        setError("No results found. Try broadening your filters or changing your search.");
      }
    } catch (err) {
      setError("Failed to fetch recommendations. Please check your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // --- Save current search to Spring Boot backend ---
  const saveSearchHistory = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/history`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location, skills, sector, searchMode, mode, salaryMin }),
      });
      // Refresh history list if panel is open
      if (historyRef.current) {
        historyRef.current();
      }
    } catch (_) { }
  };

  // --- Restore a search from history ---
  const handleRestoreHistory = (entry) => {
    setQuery(entry.query || "");
    setLocation(entry.location || "");
    setSkills(entry.skills || "");
    setSector(entry.sector || "");
    setSearchMode(entry.searchMode || "internship");
    setMode(entry.mode || "");
    setSalaryMin(entry.salaryMin || "");
    setShowHistory(false);
    // Give React a tick, then trigger search
    setTimeout(() => {
      document.querySelector(".search-btn")?.click();
    }, 100);
  };

  const resultLabel = searchMode === "internship" ? "Internships" : "Jobs";

  return (
    <div className="app">
      {/* 🏷️ App Header */}
      <Header />

      {/* 📋 History Toggle Button (only when logged in) */}
      {user && (
        <div className="history-toggle-wrapper">
          <button
            className="history-toggle-btn"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            {showHistory ? "✕ Close History" : "📋 My Search History"}
          </button>
        </div>
      )}

      {/* 📂 History Panel */}
      {showHistory && user && (
        <SearchHistory
          onRestore={handleRestoreHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* 🔎 Search & Filter Form */}
      <SearchForm
        searchMode={searchMode} setSearchMode={setSearchMode}
        query={query} setQuery={setQuery}
        location={location} setLocation={setLocation}
        skills={skills} setSkills={setSkills}
        mode={mode} setMode={setMode}
        sector={sector} setSector={setSector}
        salaryMin={salaryMin} setSalaryMin={setSalaryMin}
        onSearch={fetchJobs}
        loading={loading}
      />

      {/* ⚠️ Error Message */}
      {error && <div className="error">{error}</div>}

      {/* 🏆 Results Section */}
      {jobs.length > 0 && (
        <h2 className="results-title">
          🎯 Top {jobs.length} {resultLabel} Recommended for You
        </h2>
      )}

      <div className="job-grid">
        {jobs.map((job, index) => (
          <JobCard key={index} job={job} />
        ))}
      </div>

      {/* 📭 Loading / Empty State */}
      {loading && (
        <p className="empty-text">⏳ Searching across Indian {resultLabel.toLowerCase()}...</p>
      )}
      {!loading && jobs.length === 0 && !error && (
        <p className="empty-text">
          Fill in the filters above and click{" "}
          <strong>{searchMode === "internship" ? "🎓 Find Internships" : "💼 Find Jobs"}</strong>.
        </p>
      )}

      {/* 🤖 AI CareerBot — only for logged-in users */}
      {user && <AiChatbot />}
    </div>
  );
}

export default App;
