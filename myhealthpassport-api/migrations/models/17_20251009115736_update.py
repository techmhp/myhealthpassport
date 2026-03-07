from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "consultations" DROP COLUMN "hold_expiry";
        ALTER TABLE "lab_test_bookings" ADD "tx_id" BIGINT NOT NULL;
        ALTER TABLE "lab_test_bookings" ADD CONSTRAINT "fk_lab_test_transact_72c6b061" FOREIGN KEY ("tx_id") REFERENCES "transactions" ("tx_id") ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS "idx_lab_test_bo_tx_id_f20f29" ON "lab_test_bookings" ("tx_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP INDEX IF EXISTS "idx_lab_test_bo_tx_id_f20f29";
        ALTER TABLE "lab_test_bookings" DROP CONSTRAINT IF EXISTS "fk_lab_test_transact_72c6b061";
        ALTER TABLE "consultations" ADD "hold_expiry" TIMESTAMPTZ;
        ALTER TABLE "lab_test_bookings" DROP COLUMN "tx_id";"""
