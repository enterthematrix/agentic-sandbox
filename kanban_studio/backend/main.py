import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Hello from FastAPI!"}

# Mount static directory to serve Next.js frontend (SPA routing)
if os.path.exists("static"):
    from fastapi import Request
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import Response
    
    class NoCacheStaticFiles(StaticFiles):
        def is_not_modified(self, response_headers: dict, request_headers: dict) -> bool:
            return False

    app.mount("/", NoCacheStaticFiles(directory="static", html=True), name="static")

@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    response: Response = await call_next(request)
    if response.status_code == 200 and request.url.path == "/":
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response
