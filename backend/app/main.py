from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.middlewares.auth import AuthMiddleware
from app.middlewares.logging import LoggingMiddleware
from app.middlewares.rate_limit import RateLimitMiddleware

from app.routes.auth_routes import auth_router
from app.routes.form_routes import form_router

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
