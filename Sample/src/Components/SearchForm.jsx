// SearchForm.jsx — Filter form with Internship/Job toggle and city autocomplete

import CityAutocomplete from "./CityAutocomplete";

const SECTOR_OPTIONS = [
    { value: "", label: "All Sectors" },
    { value: "it-jobs", label: "Information Technology" },
    { value: "engineering-jobs", label: "Engineering" },
    { value: "scientific-qa-jobs", label: "Data & Analytics" },
    { value: "marketing-jobs", label: "Marketing" },
    { value: "accounting-finance-jobs", label: "Finance & Accounting" },
    { value: "creative-design-jobs", label: "Design / UI-UX" },
    { value: "graduate-jobs", label: "Graduate / Fresher" },
    { value: "hr-jobs", label: "Human Resources" },
    { value: "teaching-jobs", label: "Education & Teaching" },
    { value: "sales-jobs", label: "Sales" },
    { value: "healthcare-nursing-jobs", label: "Healthcare" },
    { value: "logistics-warehouse-jobs", label: "Logistics / Operations" },
    { value: "social-work-jobs", label: "Management / Administration" },
];

function SearchForm({
    searchMode, setSearchMode,
    query, setQuery,
    location, setLocation,
    skills, setSkills,
    mode, setMode,
    sector, setSector,
    salaryMin, setSalaryMin,
    onSearch,
    loading,
}) {
    return (
        <div className="form-container">

            {/* 🔀 Internship / Job Toggle */}
            <div className="mode-toggle-wrapper">
                <button
                    type="button"
                    className={`mode-toggle-btn ${searchMode === "internship" ? "active" : ""}`}
                    onClick={() => setSearchMode("internship")}
                >
                    🎓 Internship
                </button>
                <button
                    type="button"
                    className={`mode-toggle-btn ${searchMode === "job" ? "active" : ""}`}
                    onClick={() => setSearchMode("job")}
                >
                    💼 Job Seeker
                </button>
            </div>

            {/* Job / Role Search */}
            <div className="form-group">
                <label>
                    {searchMode === "internship" ? "Internship Role" : "Job Role"}
                </label>
                <input
                    type="text"
                    value={query}
                    placeholder={
                        searchMode === "internship"
                            ? "e.g. software intern, data intern..."
                            : "e.g. software engineer, data analyst..."
                    }
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Location with City Autocomplete */}
            <div className="form-group">
                <label>
                    Location <span className="label-hint">(within India)</span>
                </label>
                <CityAutocomplete value={location} onChange={setLocation} />
            </div>

            {/* Skills */}
            <div className="form-group">
                <label>Skills</label>
                <input
                    type="text"
                    value={skills}
                    placeholder="e.g. React, Python, Machine Learning..."
                    onChange={(e) => setSkills(e.target.value)}
                />
            </div>

            {/* Sector / Category */}
            <div className="form-group">
                <label>Sector of Interest</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)}>
                    {SECTOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Mode of Work (used as scoring hint, not Adzuna filter) */}
            <div className="form-group">
                <label>Mode of Work <span className="label-hint">(preference)</span></label>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="">Any</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                </select>
            </div>

            {/* Minimum Salary / Stipend */}
            <div className="form-group">
                <label>
                    {searchMode === "internship"
                        ? "Minimum Stipend (₹)"
                        : "Minimum Salary (₹)"}
                </label>
                <input
                    type="number"
                    value={salaryMin}
                    placeholder="e.g. 10000"
                    min={0}
                    onChange={(e) => setSalaryMin(e.target.value)}
                />
            </div>

            {/* Submit Button */}
            <button onClick={onSearch} disabled={loading} className="search-btn">
                {loading
                    ? "🔍 Finding Best Matches..."
                    : searchMode === "internship"
                        ? "🎓 Find Internships"
                        : "💼 Find Jobs"}
            </button>
        </div>
    );
}

export default SearchForm;
