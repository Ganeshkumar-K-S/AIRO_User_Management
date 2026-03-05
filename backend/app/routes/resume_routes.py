from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from fastapi import APIRouter

resume_router = APIRouter()

@resume_router.get("/")
def read_root():
    return {"status": "ok"}

# We will need the sample resume here, or as an input. For now we use the one from example_tailored.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from example_tailored import sample_resume
from resume_generator import generate_tailored_resume
from resume_generator.tailoring.gap_analyzer import analyze_gap
from resume_generator.tailoring.ats_scorer import ats_with_jd, ats_without_jd, extract_noun_keywords

@resume_router.post("/api/extract")
async def extract_and_tailor(
    input_type: str = Form(...),
    text: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    resume_json: Optional[str] = Form(None)
):
    try:
        jd_info = {}
        # In a real scenario, you'd parse text/url/file into jd_info dict here
        # For simplicity, we assume text contains something resembling jd_info JSON or text we can pass to the generator
        import io
        import PyPDF2
        from resume_generator.tailoring.jd_parser import parse_jd

        jd_text = ""
        if input_type == "text" and text:
            jd_text = text
        elif input_type == "url" and url:
            # Basic URL fallback - realistically we'd scrape HTML but this keeps it simple
            jd_text = f"URL content from: {url}"
        elif input_type in ["pdf", "docx", "eml"] and file:
            content = await file.read()
            if input_type == "pdf":
                try:
                    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                    jd_text = "".join([page.extract_text() for page in pdf_reader.pages])
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
            else:
                # Placeholder for docx/eml parsing if needed later
                jd_text = f"Content from {file.filename}"
        else:
            raise HTTPException(status_code=400, detail="Invalid input type or missing content")

        # Create a raw parsed dictionary (jd_parser expects a dict)
        jd_info = {"role": "Extracted Role", "description": jd_text}

        # Parse the Candidate Resume
        user_resume = sample_resume
        if resume_json:
            try:
                user_resume = json.loads(resume_json)
            except json.JSONDecodeError:
                import ast
                user_resume = ast.literal_eval(resume_json)
        elif input_type == "pdf" and file and not text and not url:
            # If they uploaded a PDF but NO jd_text/url, they might be uploading their resume
            # However, the frontend currently sends JD as the file.
            pass
        elif file and input_type in ["pdf", "docx"]:
            # If a resume file was provided but not parsed as JD (or if we need to support dual uploads)
            pass

        # Check if the text matches the resume JSON heuristic (if front-end sent resume as text instead of resume_json)
        if not resume_json and jd_text and jd_text.strip().startswith('{') and "skills" in jd_text:
            try:
                user_resume = json.loads(jd_text)
                jd_info = {"role": "General", "description": "General JD"} # Reset JD since text was actually resume
            except:
                pass

        # Basic JD format expected by evaluate
        # The prompt might handle raw text better. For now passing as dict
        pdf_path, template, tailored = generate_tailored_resume(
            user_resume, jd_info, verbose=False
        )
        
        gap_result = analyze_gap(user_resume, jd_info, verbose=False)

        # Prepare inputs for new ATS Scorer
        jd_text = jd_info.get("description", "")
        # Extract keywords and assign a default weight of 2
        try:
            extracted_kws = extract_noun_keywords(jd_text)
            jd_keywords = {kw: 2 for kw in extracted_kws}
        except Exception as e:
            print("Warning: Keyword extraction failed, fallback to empty.", e)
            jd_keywords = {}

        # Safely convert resume values to strings for the ATS scorer
        resume_sections = {}
        for k, v in user_resume.items():
            if v and isinstance(v, (str, list, dict)):
                resume_sections[k] = str(v)

        try:
            ats_with_res = ats_with_jd(jd_text, jd_keywords, resume_sections)
            ats_score_with = ats_with_res.get("ATS_score_with_JD", 60)
        except Exception as e:
            # Raise an HTTP exception to properly report ATS scoring failure instead of silently falling back
            raise HTTPException(status_code=500, detail=f"ATS Analysis with JD failed: {str(e)}")

        try:
            full_resume_text = " ".join(resume_sections.values())
            ats_without_res = ats_without_jd(full_resume_text)
            ats_score_without = ats_without_res.get("ATS_score_without_JD", 40)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ATS Analysis without JD failed: {str(e)}")

        return {
            "status": "success",
            "tailored_resume": tailored,
            "gap_analysis": gap_result,
            "ats_score": {"with_jd": ats_score_with, "without_jd": ats_score_without},
            "pdf_path": pdf_path
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@resume_router.get("/api/download")
async def download_pdf(path: str):
    import os
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf", filename=os.path.basename(path))
