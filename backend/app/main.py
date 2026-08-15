from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routes import router

app = FastAPI(title="Weather Explorer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Pydantic/FastAPI raise 422 for bad input by default; the spec calls for 400.
    first_error = exc.errors()[0]
    field = ".".join(str(part) for part in first_error["loc"] if part != "body")
    message = f"{field}: {first_error['msg']}" if field else first_error["msg"]
    return JSONResponse(status_code=400, content={"status": "error", "message": message})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"status": "error", "message": exc.detail})


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}
