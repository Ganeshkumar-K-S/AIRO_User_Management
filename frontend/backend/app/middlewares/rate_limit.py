from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware 
import time

# Token bucket Algorithm

class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity 
        self.refill_rate = refill_rate 
        self.tokens = capacity 
        self.last_refill = time.time()

    def consume(self):
        now = time.time()

        elapsed = now - self.last_refill 

        self.tokens = min(
            self.capacity, 
            self.tokens + elapsed * self.refill_rate
        )

        self.last_refill = now 

        if self.tokens >= 1:
            self.tokens -= 1
            return True 
        return False 

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, capacity = 10, refill_rate = 1):
        super().__init__(app)
        self.capacity = capacity 
        self.refill_rate = refill_rate
        self.buckets= {}
        
    async def dispatch(self, request, call_next):
        client_ip = request.client.host 

        if client_ip not in self.buckets:
            self.buckets[client_ip] = TokenBucket(
                self.capacity,
                self.refill_rate
            )

        bucket = self.buckets[client_ip]

        if not bucket.consume():
            return JSONResponse(status_code = 429, content = { "detail" : 'Request Rate exceeded'})
        
        return await call_next(request)
    