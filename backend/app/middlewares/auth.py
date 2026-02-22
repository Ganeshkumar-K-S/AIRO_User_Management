from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.jwt_handler import verify_token

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        if request.url.path.startswith("/auth"):
            return await call_next(request)

        token = request.headers.get("Authorization")

        if not token:
            raise HTTPException(status_code=401, detail="Token missing")

        verify_token(token)

        response = await call_next(request)
        return response