from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "healthians_packages" ADD "health_id" BIGINT UNIQUE;
        CREATE UNIQUE INDEX IF NOT EXISTS "uid_healthians__health__348b9a" ON "healthians_packages" ("health_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP INDEX IF EXISTS "uid_healthians__health__348b9a";
        ALTER TABLE "healthians_packages" DROP COLUMN "health_id";"""
