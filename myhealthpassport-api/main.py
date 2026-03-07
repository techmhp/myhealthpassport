import os
import logging

import typer
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from src.api.reports import router as report_router
from fastapi.staticfiles import StaticFiles
from src.api.doctor import router as doctors_router
from dumped.src.questions import api_router as questions_router, root_router
from src.api.general import router as general_router
from src.api.analysis_crew import router as analysis_crew_router
from src.api.parent import router as parent_router
from src.api.student import router as student_router
from src.api.teacher import router as teacher_router
from src.api.user import router as user_router
from src.config import TORTOISE_ORM
from src.api.screening import router
from src.api.deleted import router as deleted_router
from src.api.school import router as school_router



from src.api.invoice import router as invoice_router
from src.api.home import router as home_router



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(docs_url="/docs", redoc_url="/redoc")
cli_app = typer.Typer()

register_tortoise(
    app,
    config=TORTOISE_ORM,
    generate_schemas=False,
    add_exception_handlers=True,
)

app.mount("/reports_static", StaticFiles(directory="src/api/reports"), name="reports_static")
# Any other static files (like default-photo.jpg)

## Total API endpoints count
# @app.on_event("startup")
# async def startup_event():
#     from fastapi.routing import APIRoute
#     api_count = len([route for route in app.routes if isinstance(route, APIRoute)])
#     logger.info(f"📊 Total API endpoints registered: {api_count}")

# Routers
app.include_router(analysis_crew_router)
app.include_router(questions_router)
app.include_router(parent_router)
app.include_router(student_router)
app.include_router(general_router)
app.include_router(user_router)
app.include_router(teacher_router)
app.include_router(school_router)
app.include_router(router)
app.include_router(doctors_router)
app.include_router(root_router)
app.include_router(deleted_router)
app.include_router(report_router)

app.include_router(home_router)

app.include_router(invoice_router)


# Environment-based config
environment = os.environ.get("APP_ENV", "development")

if environment == "production":
    allowed_origins = ["https://your-production-domain.com"]
    app_port = 8000
elif environment == "uat":
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "https://staging.d31i4bwxow07s2.amplifyapp.com", "https://uat.myhealthpassport.in"]
    app_port = 9000
else:
    allowed_origins = ["http://127.0.0.1:8000", "http://localhost:8000", "http://localhost:3000", "http://127.0.0.1:3000"]
    app_port = 9000

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CLI run command
@cli_app.command("run")
def run():
    """Run FastAPI app with environment-specific settings"""
    import uvicorn

    # Show info
    env_label = "production" if environment == "production" else "development"
    print(f"Starting server in {env_label} mode on port {app_port}")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=app_port,
        reload=(environment != "production")
    )


if __name__ == "__main__":
    cli_app()
