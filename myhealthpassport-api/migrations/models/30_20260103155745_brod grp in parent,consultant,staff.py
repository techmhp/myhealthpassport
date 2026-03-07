from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users_consultant" ADD "blood_group" VARCHAR(10) DEFAULT '';
        ALTER TABLE "users_parents" ADD "blood_group" VARCHAR(10) DEFAULT '';
        ALTER TABLE "users_school_staff" ADD "blood_group" VARCHAR(10) DEFAULT '';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "users_parents" DROP COLUMN "blood_group";
        ALTER TABLE "users_school_staff" DROP COLUMN "blood_group";
        ALTER TABLE "users_consultant" DROP COLUMN "blood_group";"""
