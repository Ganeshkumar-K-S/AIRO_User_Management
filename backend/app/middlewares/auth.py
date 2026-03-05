from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from backend.app.utils.jwt_handler import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        public_paths = (
            "/auth",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/api/extract",
            "/api/download"
        )

        if request.url.path.startswith(public_paths):
            return await call_next(request)

        token = request.headers.get("Authorization")

        if not token:
            return JSONResponse(status_code=401, content={"detail": "Token missing"})

        try:
            payload = verify_token(token)
            request.state.user = payload

        except Exception as e:
            print(f"Token validation error: {e}")
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

        response = await call_next(request)
        return response