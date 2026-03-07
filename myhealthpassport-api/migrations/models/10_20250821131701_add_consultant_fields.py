from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users_consultant" ADD "max_consultations_per_day" INT DEFAULT 10;
        ALTER TABLE "users_consultant" ADD "consultation_charges" DOUBLE PRECISION DEFAULT 0;
        ALTER TABLE "users_consultant" ADD "languages_spoken" JSONB;
        ALTER TABLE "users_consultant" ADD "consultation_duration" INT DEFAULT 30;
        ALTER TABLE "users_consultant" ADD "available_time_slots" JSONB;
        ALTER TABLE "users_consultant" ADD "license_number" VARCHAR(100) DEFAULT '';
        ALTER TABLE "users_consultant" ADD "brief_bio" TEXT;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users_consultant" DROP COLUMN "max_consultations_per_day";
        ALTER TABLE "users_consultant" DROP COLUMN "consultation_charges";
        ALTER TABLE "users_consultant" DROP COLUMN "languages_spoken";
        ALTER TABLE "users_consultant" DROP COLUMN "consultation_duration";
        ALTER TABLE "users_consultant" DROP COLUMN "available_time_slots";
        ALTER TABLE "users_consultant" DROP COLUMN "license_number";
        ALTER TABLE "users_consultant" DROP COLUMN "brief_bio";"""
