from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "lab_transactions" (
    "lab_tx_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "lab_tx_no" VARCHAR(50) NOT NULL UNIQUE,
    "invoice_no" VARCHAR(50) NOT NULL UNIQUE,
    "vendor" VARCHAR(20) NOT NULL,
    "vendor_booking_id" VARCHAR(100),
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "payment_mode" VARCHAR(20) NOT NULL DEFAULT 'online',
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "gateway_response" JSONB,
    "amount_refunded" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refund_status" VARCHAR(20),
    "description" VARCHAR(255) NOT NULL DEFAULT '',
    "order_id" VARCHAR(100),
    "email" VARCHAR(255),
    "contact" VARCHAR(15),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,
    "created_user_role" VARCHAR(50) NOT NULL,
    "healthians_booking_id" BIGINT REFERENCES "healthians_bookings" ("booking_id") ON DELETE SET NULL,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE,
    "thyrocare_order_id" BIGINT REFERENCES "thyrocare_orders" ("order_id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_lab_transac_vendor__8411e2" ON "lab_transactions" ("vendor_booking_id");
CREATE INDEX IF NOT EXISTS "idx_lab_transac_vendor_9547da" ON "lab_transactions" ("vendor", "vendor_booking_id");"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "lab_transactions";"""
