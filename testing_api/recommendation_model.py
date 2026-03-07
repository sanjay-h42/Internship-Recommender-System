import re
import numpy as np
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

OUTPUT_FILE = "recommendations.txt"


# ---------------------------------------------------------------------------
# Text Utilities
# ---------------------------------------------------------------------------

def clean_text(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_user_text(user_profile):
    """
    Build a rich text representation of the user profile for TF-IDF matching.
    Combines: search query + skills + category label + contract_time.
    """
    parts = [
        user_profile.get("query", ""),
        user_profile.get("skills", ""),
        user_profile.get("category", "").replace("-", " "),   # e.g. "it jobs"
        user_profile.get("location", ""),
    ]
    # Repeat skills twice to give them more weight in TF-IDF
    skills = user_profile.get("skills", "")
    if skills:
        parts.append(skills)

    return clean_text(" ".join(p for p in parts if p))


def build_job_text(job):
    """
    Build a rich text representation of a job for TF-IDF matching.
    Combines: title + description + category label.
    """
    parts = [
        job.get("title", ""),
        job.get("description", ""),
        job.get("category", {}).get("label", ""),
        job.get("location", {}).get("display_name", ""),
    ]
    return clean_text(" ".join(p for p in parts if p))


# ---------------------------------------------------------------------------
# Similarity
# ---------------------------------------------------------------------------

def compute_similarity(user_text, job_texts):
    """Return cosine similarity scores between user text and every job text."""
    corpus = [user_text] + job_texts
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
    )
    tfidf = vectorizer.fit_transform(corpus)
    return cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()


# ---------------------------------------------------------------------------
# File Storage
# ---------------------------------------------------------------------------

def clear_old_recommendations():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("")


def save_recommendations(user_profile, ranked_jobs):
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write("=" * 60 + "\n")
        f.write(f"Recommendation Run: {datetime.now()}\n")
        f.write(f"User Profile: {user_profile}\n\n")

        for idx, job in enumerate(ranked_jobs, 1):
            f.write(f"{idx}. {job.get('title')}\n")
            f.write(f"   Company : {job.get('company', {}).get('display_name')}\n")
            f.write(f"   Location: {job.get('location', {}).get('display_name')}\n")
            f.write(f"   Salary  : {job.get('salary_min')} – {job.get('salary_max')}\n")
            f.write(f"   URL     : {job.get('redirect_url')}\n\n")


# ---------------------------------------------------------------------------
# Scoring Boosts
# ---------------------------------------------------------------------------

def apply_boosts(base_score, job, user_profile):
    """
    Apply additional scoring signals on top of the TF-IDF cosine similarity.

    Boosts applied:
      +0.20  Location match
      +0.15  Contract time (full_time / part_time) match
      +0.15  Category / sector match
      +0.10  Salary within range: job salary_min <= user salary_min <= job salary_max
      -0.10  Salary below user minimum (job salary_max < user salary_min)
    """
    score = base_score

    # 📍 Location boost
    user_loc = user_profile.get("location", "").lower()
    if user_loc:
        job_loc = job.get("location", {}).get("display_name", "").lower()
        if user_loc in job_loc:
            score += 0.20

    # 🕒 Contract time boost
    user_contract = user_profile.get("contract_time", "")
    if user_contract and job.get("contract_time") == user_contract:
        score += 0.15

    # 🏷️ Category / sector boost
    user_category = user_profile.get("category", "").lower().replace("-", " ")
    job_category = job.get("category", {}).get("label", "").lower()
    if user_category and user_category and (
        user_category in job_category or job_category in user_category
    ):
        score += 0.15

    # 💰 Salary boost / penalty
    try:
        user_salary_min = float(user_profile.get("salary_min", 0) or 0)
        job_sal_min = job.get("salary_min")
        job_sal_max = job.get("salary_max")

        if user_salary_min > 0:
            if job_sal_min and job_sal_max:
                if job_sal_min <= user_salary_min <= job_sal_max:
                    score += 0.10          # salary fits perfectly
                elif job_sal_max and job_sal_max < user_salary_min:
                    score -= 0.10          # job pays below user's minimum
            elif job_sal_min and job_sal_min >= user_salary_min:
                score += 0.05             # job min salary meets user minimum
    except (ValueError, TypeError):
        pass

    return score


# ---------------------------------------------------------------------------
# Main Recommender
# ---------------------------------------------------------------------------

def recommend_top_jobs(user_profile, jobs, top_n=10):
    """
    Rank jobs for a user using TF-IDF cosine similarity + scoring boosts.

    Args:
        user_profile : dict with keys: query, skills, location,
                       contract_time, category, salary_min
        jobs         : list of Adzuna job dicts
        top_n        : number of top results to return (default 10)

    Returns:
        List of top_n job dicts, sorted by relevance score descending.
    """
    if not jobs:
        return []

    user_text = build_user_text(user_profile)
    job_texts = [build_job_text(job) for job in jobs]

    print(f"  🧠 User text (TF-IDF input): {user_text[:120]!r}")

    similarity_scores = compute_similarity(user_text, job_texts)

    # Fallback: if no similarity found, return first top_n jobs
    if np.all(similarity_scores == 0):
        print("  ⚠️  All similarity scores are 0, using positional fallback")
        fallback_jobs = jobs[:top_n]
        clear_old_recommendations()
        save_recommendations(user_profile, fallback_jobs)
        return fallback_jobs

    # Apply boosts on top of TF-IDF scores
    final_scores = [
        apply_boosts(similarity_scores[idx], job, user_profile)
        for idx, job in enumerate(jobs)
    ]

    # Sort descending and take top_n
    top_indices = np.argsort(final_scores)[::-1][:top_n]
    ranked_jobs = [jobs[i] for i in top_indices]

    print(f"  🏆 Top score: {max(final_scores):.3f}, Bottom of top-{top_n}: {final_scores[top_indices[-1]]:.3f}")

    clear_old_recommendations()
    save_recommendations(user_profile, ranked_jobs)

    return ranked_jobs
