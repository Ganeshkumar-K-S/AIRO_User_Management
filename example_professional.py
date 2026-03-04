
import os
from resume_generator import generate_resume



def find_photo(person_name):
    """Search for photo file in data directory matching person's name"""
    safe_name = person_name.replace(" ", "_").replace(".", "")

    photo_patterns = [
        f"{safe_name}_image.jpg",
        f"{safe_name}_image.jpeg",
        f"{safe_name}_image.png",
        f"{safe_name}.jpg",
        f"{safe_name}.jpeg",
        f"{safe_name}.png",
        "photo.jpg",
        "photo.png",
        "photo.jpeg",
        "profile.jpg",
        "headshot.jpg",
    ]

    for name in photo_patterns:
        path = os.path.join("data", name)
        if os.path.exists(path):
            return path
    return None


def build_profile(base_profile, photo_mode="auto"):
    """
    Add photo to profile based on mode:
    auto  -> use photo if found
    force -> require photo
    none  -> never include photo
    """

    profile = base_profile.copy()
    person_name = profile.get("name", "")

    photo_file = find_photo(person_name)

    if photo_mode == "force":
        if not photo_file:
            raise FileNotFoundError(
                f"No photo found for {person_name} in data/ directory"
            )
        profile["photo"] = photo_file

    elif photo_mode == "auto":
        if photo_file:
            profile["photo"] = photo_file

    elif photo_mode == "none":
        profile.pop("photo", None)

    else:
        raise ValueError("photo_mode must be: auto | force | none")

    return profile, photo_file



base_profile = {"id": "professional_001",
    "name": "Bhuvanesh S",
    "phone": "+91 8438789100",
    "email": "bhuvanesh2310766@ssn.edu.in",
    "github": "https://github.com/BHUVANESH-SSN",
    "linkedin": "https://www.linkedin.com/in/bhuvanesh-cse",
     
    
    "professional_summary": "Computer Science student at SSN College of Engineering with strong interest in software engineering and machine learning. Skilled in Web Technologies and Machine Learning algorithms. Seeking internship opportunities to apply skills in real-world software and AI-driven projects.",
    
    "education": [
        {
            "degree": "B.E.",
            "field": "Computer Science and Engineering",
            "institution": "SSN College of Engineering",
            "year": "2022-2026",
            "gpa": "8.5/10"
        }
    ],
    
    
    "skills": [
        "Python", "Java", "C++", "JavaScript", 
        "React", "Node.js", "Django", "Flask",
        "TensorFlow", "PyTorch", "scikit-learn",
        "MySQL", "MongoDB", "Git", "Docker"
    ],
    
    
    "skills_categorized": {
        "Languages": ["Python", "Java", "C++", "JavaScript", "SQL"],
        "Web Technologies": ["React", "Node.js", "Express", "Django", "Flask"],
        "ML/AI": ["TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy"],
        "Databases": ["MySQL", "MongoDB", "PostgreSQL"],
        "Tools": ["Git", "Docker", "Linux", "VS Code"]
    },
    
    "experience": [
        {
            "role": "Software Development Intern",
            "company": "TechCorp Solutions",
            "duration": "Jun 2024 - Aug 2024",
            "location": "Chennai, India",
            "description": [
                "Developed RESTful APIs using Node.js and Express, improving response time by 30%",
                "Implemented authentication system using JWT and OAuth 2.0 for secure user management",
                "Collaborated with cross-functional teams using Agile methodologies"
            ]
        },
        {
            "role": "ML Research Intern",
            "company": "AI Research Lab, SSN",
            "duration": "Jan 2024 - May 2024",
            "description": [
                "Built image classification model achieving 92% accuracy using TensorFlow and CNN",
                "Preprocessed and augmented dataset of 50,000+ images for improved model performance"
            ]
        }
    ],
    
    "projects": [
        {
            "title": "Real-time Object Detection System",
            "tech": ["Python", "YOLOv5", "OpenCV", "Flask"],
            "link": "https://github.com/username/project",
            "description": [
                "Developed real-time object detection web application using YOLOv5 and Flask",
                "Achieved 85% mAP on custom dataset with 30+ FPS performance",
                "Deployed on cloud with Docker containerization"
            ]
        },
        {
            "title": "E-Commerce Platform",
            "tech": ["React", "Node.js", "MongoDB", "Stripe"],
            "description": [
                "Built full-stack e-commerce application with payment integration",
                "Implemented cart management, order tracking, and user authentication",
                "Designed RESTful API serving 1000+ concurrent requests"
            ]
        },
        {
            "title": "Sentiment Analysis Tool",
            "tech": ["Python", "NLTK", "Transformers", "Streamlit"],
            "description": "Created NLP tool for sentiment analysis using BERT model with 90% accuracy on product reviews"
        }
    ],
    
    "certifications": [
        {
            "name": "AWS Certified Cloud Practitioner",
            "issuer": "Amazon Web Services",
            "date": "2024"
        },
        {
            "name": "Deep Learning Specialization",
            "issuer": "Coursera",
            "date": "2023"
        },
        "Google Cloud Associate Engineer"
    ],
    
    "achievements": [
        "Winner of SSN College Hackathon 2024 - Built AI-powered chatbot",
        "Published research paper in IEEE conference on Machine Learning applications",
        "Rank 1 in departmental programming contest"
    ]
}



# --------------------------------------------------
# MAIN
# --------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("PROFESSIONAL RESUME GENERATOR")
    print("=" * 60)

    
    PHOTO_MODE = "auto" 

    try:
        profile, photo_file = build_profile(base_profile, PHOTO_MODE)

        if "photo" in profile:
            print(f"📷 Using photo: {profile['photo']}")
        else:
            print("ℹ️ Generating resume WITHOUT photo")

        pdf_path, template = generate_resume(profile)

        print(f"\n Resume generated: {pdf_path}")
        print(f" Template: {template}")

    except Exception as e:
        print(f"\n Error: {e}")

    print("\n" + "=" * 60)
    print("Photo options:")
    print(" auto  -> use if exists")
    print(" force -> must exist")
    print(" none  -> never use")
    print("=" * 60)