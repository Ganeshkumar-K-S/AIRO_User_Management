import time
import logging
import os
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

os.makedirs("logs", exist_ok=True)

logger = logging.getLogger("api_logger")
logger.setLevel(logging.INFO)

if not logger.handlers:

    file_handler = logging.FileHandler("logs/app.log")
    file_handler.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s"
    )
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        method = request.method
        path = request.url.path
        client = request.client.host

        response = await call_next(request)

        duration = round((time.time() - start_time) * 1000, 2)
        status_code = response.status_code

        logger.info(
            f"{client} | {method} {path} | {status_code} | {duration}ms"
        )

        return response