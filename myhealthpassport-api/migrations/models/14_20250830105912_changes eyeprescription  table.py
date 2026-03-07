from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "eye_report" RENAME COLUMN "vision_test_results" TO "vision_righteye_res";
        ALTER TABLE "eye_report" ADD "vision_lefteye_res" TEXT NOT NULL;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "eye_report" RENAME COLUMN "vision_righteye_res" TO "vision_test_results";
        ALTER TABLE "eye_report" DROP COLUMN "vision_lefteye_res";"""
