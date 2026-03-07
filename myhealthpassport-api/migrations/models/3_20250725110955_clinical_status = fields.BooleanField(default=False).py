from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "clinical_findings" ADD "clinical_status" BOOL NOT NULL DEFAULT False;
        ALTER TABLE "clinical_recomendations" ADD "clinical_status" BOOL NOT NULL DEFAULT False;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "clinical_findings" DROP COLUMN "clinical_status";
        ALTER TABLE "clinical_recomendations" DROP COLUMN "clinical_status";"""
