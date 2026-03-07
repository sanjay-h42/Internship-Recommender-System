from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from recommendation_model import recommend_top_jobs

import os

app = Flask(__name__)
CORS(app)

# 🔑 Adzuna API credentials from environment variables
APP_ID = os.environ.get("ADZUNA_APP_ID", "ID")
APP_KEY = os.environ.get("ADZUNA_APP_KEY", "KEY")

# 🌍 India is the fixed country code for Adzuna
COUNTRY = "in"
ADZUNA_BASE_URL = f"https://api.adzuna.com/v1/api/jobs/{COUNTRY}/search"

# Adzuna max 50 results per page — we fetch 2 pages = 100 results
RESULTS_PER_PAGE = 50
TOTAL_PAGES = 2


def build_what_query(q, skills, search_mode):
    """
    Build a minimal, effective Adzuna 'what' query.

    ⚠️  IMPORTANT: Adzuna's 'what' is AND-matched — every word must appear
    in the listing. Adding too many words (skills + role + intern keywords)
    causes near-zero results. Keep it short and targeted.

    Strategy:
      - Internship mode : "{role} intern"  (e.g. "software intern")
                          fallback: "intern" alone — broadest possible
      - Job mode        : "{role}"  (e.g. "software engineer")
                          fallback: "jobs"

    Skills are intentionally NOT included here — they are used only by
    the TF-IDF recommender model for ranking, not for Adzuna filtering.
    """
    if search_mode == "internship":
        if q:
            return f"{q.strip()} intern"
        return "intern"   # broadest internship search — always returns results
    else:
        if q:
            return q.strip()
        return "jobs"


def fetch_adzuna_jobs(params):
    """
    Fetch jobs from Adzuna across multiple pages and merge results.
    NOTE: contract_time is intentionally NOT passed to Adzuna because
    most Indian job listings don't have this field populated — passing it
    causes near-zero results. Instead, it is used as a scoring signal in
    the recommendation model.
    """
    all_jobs = []
    for page in range(1, TOTAL_PAGES + 1):
        url = f"{ADZUNA_BASE_URL}/{page}"
        try:
            res = requests.get(
                url,
                params={**params, "results_per_page": RESULTS_PER_PAGE},
                timeout=10,
            )
            res.raise_for_status()
            data = res.json()
            page_jobs = data.get("results", [])
            all_jobs.extend(page_jobs)
            print(f"  📄 Page {page}: {len(page_jobs)} jobs fetched")
            if len(page_jobs) < RESULTS_PER_PAGE:
                break  # No more pages available
        except Exception as e:
            print(f"  ❌ Error fetching page {page}: {e}")
            break
    return all_jobs


@app.route("/")
def home():
    return "✅ Flask backend running – Internship Recommender API (India only)"


@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    """
    Fetch jobs from Adzuna (India only) and return AI-ranked recommendations.

    Adzuna parameters actually used (only ones that work reliably for India):
      - what      : role query + internship keywords (if internship mode) + skills
      - where     : city / region in India
      - category  : Adzuna sector tag  (e.g. 'it-jobs')
      - salary_min: minimum annual salary

    Note: contract_time is NOT sent to Adzuna — it is used only for scoring
    because most Indian listings lack this field and the filter returns empty results.
    """

    # --- Read user inputs ---
    q             = request.args.get("q", "").strip()
    location      = request.args.get("location", "").strip()
    skills        = request.args.get("skills", "").strip()
    contract_time = request.args.get("contract_time", "").strip()   # full_time / part_time
    category      = request.args.get("category", "").strip()        # Adzuna category tag
    salary_min    = request.args.get("salary_min", "").strip()
    search_mode   = request.args.get("search_mode", "internship").strip()  # internship / job

    print(f"\n🔍 Recommendation request:")
    print(f"   search_mode={search_mode!r}, q={q!r}, location={location!r}")
    print(f"   skills={skills!r}, contract_time={contract_time!r}")
    print(f"   category={category!r}, salary_min={salary_min!r}")

    # --- Build Adzuna params (only params Adzuna actually uses for India) ---
    adzuna_params = {
        "app_id":  APP_ID,
        "app_key": APP_KEY,
        "what":    build_what_query(q, skills, search_mode),
    }

    if location:
        adzuna_params["where"] = location

    if category:
        adzuna_params["category"] = category

    if salary_min:
        try:
            adzuna_params["salary_min"] = int(float(salary_min))
        except ValueError:
            pass  # Ignore invalid salary input

    # contract_time intentionally omitted from Adzuna params — see docstring above

    print(f"   Adzuna what query: {adzuna_params['what']!r}")
    print(f"   Adzuna params (excl. keys): { {k: v for k, v in adzuna_params.items() if k not in ('app_id', 'app_key')} }")

    # --- Fetch up to 100 jobs from India ---
    jobs_data = fetch_adzuna_jobs(adzuna_params)
    print(f"✅ Total jobs fetched: {len(jobs_data)}")

    if not jobs_data:
        return jsonify({
            "success": False,
            "error": "No jobs returned from Adzuna. Try broadening your search.",
        })

    # --- Build user profile for the recommender ---
    user_profile = {
        "query":         q,
        "skills":        skills,
        "location":      location,
        "contract_time": contract_time,   # used for scoring boost only
        "category":      category,
        "salary_min":    salary_min,
        "search_mode":   search_mode,
    }

    # --- Run recommendation model (returns top 10) ---
    recommended_jobs = recommend_top_jobs(user_profile, jobs_data, top_n=10)

    print(f"🎯 Returning {len(recommended_jobs)} recommendations")

    return jsonify({
        "success": True,
        "total_fetched": len(jobs_data),
        "results": recommended_jobs,
    })


if __name__ == "__main__":
    app.run(debug=True)