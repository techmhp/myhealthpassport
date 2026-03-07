from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "transactions" ADD "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "transactions" DROP COLUMN "payment_status";"""
