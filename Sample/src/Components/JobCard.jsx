// JobCard.jsx — Displays a single internship/job result card

function formatSalary(value) {
    if (!value) return null;
    return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatContractTime(value) {
    if (!value) return null;
    return value === "full_time" ? "Full Time" : value === "part_time" ? "Part Time" : value;
}

function JobCard({ job }) {
    const salaryMin = formatSalary(job.salary_min);
    const salaryMax = formatSalary(job.salary_max);
    const contractType = formatContractTime(job.contract_time);
    const category = job.category?.label;

    return (
        <div className="job-card">
            {/* Badges row */}
            <div className="card-badges">
                {contractType && (
                    <span className={`badge badge-mode ${job.contract_time}`}>
                        {contractType}
                    </span>
                )}
                {category && (
                    <span className="badge badge-category">{category}</span>
                )}
            </div>

            <h3>{job.title}</h3>

            <p className="company">{job.company?.display_name || "Unknown Company"}</p>

            <p className="location">
                📍 {job.location?.display_name || "Location not specified"}
            </p>

            {/* Salary */}
            {(salaryMin || salaryMax) && (
                <p className="salary">
                    💰 {salaryMin && salaryMax
                        ? `${salaryMin} – ${salaryMax}`
                        : salaryMin || salaryMax}
                    <span className="salary-note"> / year</span>
                </p>
            )}

            <p className="snippet">
                {job.description
                    ? job.description.slice(0, 130) + "..."
                    : "No description available."}
            </p>

            <a
                href={job.redirect_url}
                target="_blank"
                rel="noreferrer"
                className="apply-btn"
            >
                View Details →
            </a>
        </div>
    );
}

export default JobCard;
