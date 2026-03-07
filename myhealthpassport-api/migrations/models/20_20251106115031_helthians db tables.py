from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "lab_test_bookings" ALTER COLUMN "tx_id" DROP NOT NULL;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "lab_test_bookings" ALTER COLUMN "tx_id" SET NOT NULL;"""
