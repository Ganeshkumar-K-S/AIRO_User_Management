from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.middlewares.auth import AuthMiddleware
from backend.app.middlewares.logging import LoggingMiddleware
from backend.app.middlewares.rate_limit import RateLimitMiddleware

from backend.app.routes.auth_routes import auth_router
from backend.app.routes.form_routes import form_router
from backend.app.routes.resume_routes import resume_router

app = FastAPI()

@app.get("/")
def health():
    return {"status" : "running"}

app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


app.include_router(auth_router)
app.include_router(form_router)
app.include_router(resume_router)
