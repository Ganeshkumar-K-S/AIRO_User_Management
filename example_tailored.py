# ──────────────────────────────────────────────────────────
# example_tailored.py — End-to-End Tailoring + Gap Analysis Demo
#
# Demonstrates the full enhanced pipeline:
#   1. Resume tailoring (embedding scoring -> LLM rewriting -> PDF)
#   2. Gap analysis (quantified skill gaps -> learning recommendations)
#   3. Comparative analysis (multi-JD comparison matrix)
# ──────────────────────────────────────────────────────────

import json
import os
from resume_generator import generate_tailored_resume
from resume_generator.tailoring.gap_analyzer import (
    analyze_gap, compare_jds,
    print_gap_report, print_comparison_matrix,
)
from resume_generator.tailoring.skill_scorer import cluster_skills


sample_resume = {
    "name": "Arun Kumar",
    "summary": (
        "Versatile software engineer with experience in web development, "
        "data analysis, machine learning, mobile apps, and UI design. "
        "Built multiple full-stack applications and ML models across "
        "domains including NLP, computer vision, and analytics."
    ),
    "skills": [
        "Python", "Java", "C++", "JavaScript", "HTML", "CSS", "React", "Node.js",
        "Express.js", "MongoDB", "MySQL", "PostgreSQL", "Docker", "Kubernetes",
        "AWS", "Firebase", "Android", "Flutter", "TensorFlow", "PyTorch",
        "scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn",
        "OpenCV", "NLP", "Computer Vision", "Deep Learning", "Machine Learning",
        "REST APIs", "GraphQL", "Git", "Linux", "CI/CD", "Figma", "Photoshop",
        "Tableau", "Power BI", "Data Analysis", "Statistics",
    ],
    "projects": [
        {
            "name": "E-commerce Web Platform",
            "description": "Built full-stack MERN e-commerce app with authentication, payments, and admin dashboard.",
            "skills": ["React", "Node.js", "MongoDB", "Express.js"],
        },
        {
            "name": "Chat Application",
            "description": "Real-time chat app using WebSockets and Firebase backend.",
            "skills": ["JavaScript", "Firebase", "Node.js"],
        },
        {
            "name": "Image Classification System",
            "description": "Trained CNN model to classify plant diseases using TensorFlow and OpenCV.",
            "skills": ["Python", "TensorFlow", "Computer Vision", "Deep Learning", "OpenCV"],
        },
        {
            "name": "Resume Parser NLP",
            "description": "Developed NLP pipeline to extract skills and entities from resumes using spaCy.",
            "skills": ["Python", "NLP", "Machine Learning"],
        },
        {
            "name": "Sales Forecasting",
            "description": "Time-series forecasting using ARIMA and regression models.",
            "skills": ["Python", "Machine Learning", "Pandas", "Statistics"],
        },
        {
            "name": "Portfolio Website",
            "description": "Responsive personal portfolio with animations and dark mode.",
            "skills": ["HTML", "CSS", "JavaScript"],
        },
    ],
    "experience": [
        {
            "role": "Full Stack Developer Intern",
            "company": "TechSoft Solutions",
            "description": "Developed REST APIs and frontend dashboards for enterprise clients using MERN stack.",
            "skills": ["React", "Node.js", "MongoDB"],
        },
        {
            "role": "Data Science Intern",
            "company": "Insight Analytics",
            "description": "Built predictive models and performed exploratory data analysis on business datasets.",
            "skills": ["Python", "Machine Learning", "Pandas", "scikit-learn"],
        },
        {
            "role": "Mobile App Developer",
            "company": "AppWorks",
            "description": "Developed cross-platform mobile apps using Flutter and Firebase.",
            "skills": ["Flutter", "Firebase"],
        },
    ],
    "education": [
        {
            "degree": "B.E. Computer Science",
            "institution": "ABC Engineering College",
            "year": "2024",
        }
    ],
}


jd_backend_python = {
    "role": "Backend Python Developer",
    "required_skills": ["Python", "REST APIs", "SQL", "Git"],
    "preferred_skills": ["Docker", "AWS", "Flask", "PostgreSQL"],
    "responsibilities": [
        "Design and implement scalable REST APIs using Python and Flask/Django",
        "Write clean, maintainable, and well-tested backend code",
        "Manage PostgreSQL databases and optimize query performance",
        "Deploy services using Docker containers on AWS",
        "Participate in code reviews and mentor junior developers",
    ],
}

jd_ml_engineer = {
    "role": "Machine Learning Engineer",
    "domain": "Artificial Intelligence",
    "required_skills": [
        "Python", "Machine Learning", "Deep Learning",
        "PyTorch", "TensorFlow", "Data Analysis", "Statistics",
    ],
    "preferred_skills": [
        "Computer Vision", "NLP", "Model Deployment", "Docker", "AWS",
    ],
    "responsibilities": [
        "Develop and train machine learning models",
        "Analyze large datasets and extract insights",
        "Build deep learning pipelines",
        "Optimize model performance",
        "Collaborate with data engineers for deployment",
    ],
}

jd_frontend = {
    "role": "Frontend Developer",
    "required_skills": ["JavaScript", "React", "HTML", "CSS", "TypeScript"],
    "preferred_skills": ["Next.js", "GraphQL", "Figma", "CI/CD"],
    "responsibilities": [
        "Build responsive web interfaces using React",
        "Collaborate with designers on UI/UX",
        "Write unit tests for frontend components",
    ],
}


def print_comparison(original_skills, tailored):
    """Print before/after skill comparison."""
    print("\n" + "=" * 60)
    print("  TAILORING COMPARISON")
    print("=" * 60)
    print(f"\n  Original skills ({len(original_skills)}):")
    print(f"   {original_skills}")

    tailored_skills = tailored.get("skills", [])
    print(f"\n  Tailored skills ({len(tailored_skills)}):")
    print(f"   {tailored_skills}")

    # Show auto-clustered skills
    clustered = tailored.get("skills_categorized", {})
    if clustered:
        print(f"\n  Auto-clustered categories:")
        for cat, members in clustered.items():
            print(f"   {cat}: {members}")

    print(f"\n  Section order:")
    print(f"   {tailored.get('section_order', 'N/A')}")
    print(f"\n  Tailored summary:")
    print(f"   {tailored.get('professional_summary', 'N/A')[:200]}...")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    print("=" * 60)
    print("  TAILORED RESUME DEMO (Enhanced Pipeline)")
    print("=" * 60)

    # --- Demo 1: Skill Clustering ---
    print("\n\n" + "=" * 60)
    print("  SKILL CLUSTERING DEMO")
    print("=" * 60)
    clusters = cluster_skills(sample_resume["skills"])
    for cat, members in clusters.items():
        print(f"  {cat}: {members}")

    # --- Demo 2: Tailored Resume ---
    jd = jd_ml_engineer

    print(f"\n\n{'=' * 60}")
    print(f"  Target role : {jd['role']}")
    print(f"  Required    : {jd['required_skills']}")
    print(f"  Preferred   : {jd['preferred_skills']}")
    print(f"{'=' * 60}")

    try:
        pdf_path, template, tailored = generate_tailored_resume(
            sample_resume, jd, verbose=True,
        )
        print_comparison(sample_resume["skills"], tailored)
        print(f"\n  PDF generated : {pdf_path}")
        print(f"  Template      : {template}")

        output_path = os.path.join(
            os.path.dirname(__file__),
            "resume_generator", "output", "tailored_profile.json",
        )
        with open(output_path, "w") as f:
            json.dump(tailored, f, indent=2)
        print(f"  Tailored JSON : {output_path}")

    except Exception as e:
        print(f"\n  ERROR: {e}")
        raise

    # --- Demo 3: Gap Analysis with Quantified Scores ---
    print("\n\n" + "=" * 60)
    print("  RUNNING GAP ANALYSIS")
    print("=" * 60)

    try:
        gap_result = analyze_gap(sample_resume, jd, verbose=True)
        print_gap_report(gap_result)

        gap_path = os.path.join(
            os.path.dirname(__file__),
            "resume_generator", "output", "gap_analysis.json",
        )
        with open(gap_path, "w") as f:
            json.dump(gap_result, f, indent=2)
        print(f"\n  Gap analysis saved: {gap_path}")

    except Exception as e:
        print(f"\n  ERROR (Gap analysis): {e}")
        raise

    # --- Demo 4: Comparative Multi-JD Analysis ---
    print("\n\n" + "=" * 60)
    print("  COMPARATIVE ANALYSIS (3 Roles)")
    print("=" * 60)

    try:
        comparison = compare_jds(
            sample_resume,
            [jd_ml_engineer, jd_backend_python, jd_frontend],
            verbose=True,
        )
        print_comparison_matrix(comparison)

        comp_path = os.path.join(
            os.path.dirname(__file__),
            "resume_generator", "output", "comparison.json",
        )
        with open(comp_path, "w") as f:
            json.dump(comparison, f, indent=2, default=str)
        print(f"\n  Comparison saved: {comp_path}")

    except Exception as e:
        print(f"\n  ERROR (Comparison): {e}")
        raise
        
  
