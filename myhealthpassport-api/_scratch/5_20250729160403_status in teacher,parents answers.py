from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "parent_screening_answers" ADD "status" BOOL NOT NULL DEFAULT False;
        ALTER TABLE "teacher_screening_answers" ADD "status" BOOL NOT NULL DEFAULT False;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "parent_screening_answers" DROP COLUMN "status";
        ALTER TABLE "teacher_screening_answers" DROP COLUMN "status";"""
