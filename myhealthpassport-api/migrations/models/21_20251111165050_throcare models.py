from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "healthians_bookings" (
    "booking_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "vendor_booking_id" VARCHAR(100) NOT NULL UNIQUE,
    "zone_id" VARCHAR(10) NOT NULL,
    "latitude" VARCHAR(30) NOT NULL,
    "longitude" VARCHAR(30) NOT NULL,
    "zipcode" VARCHAR(10) NOT NULL,
    "address" TEXT NOT NULL,
    "landmark" VARCHAR(200),
    "slot_id" VARCHAR(50) NOT NULL,
    "slot_date" DATE NOT NULL,
    "slot_time" TIMETZ NOT NULL,
    "freeze_time" TIMESTAMPTZ,
    "customer_name" VARCHAR(200) NOT NULL,
    "customer_mobile" VARCHAR(15) NOT NULL,
    "customer_email" VARCHAR(200),
    "customer_gender" VARCHAR(1) NOT NULL,
    "customer_age" INT NOT NULL,
    "customer_dob" VARCHAR(10) NOT NULL,
    "total_mrp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_discounted" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_mode" VARCHAR(20) NOT NULL DEFAULT 'prepaid',
    "booking_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "phlebo_number" VARCHAR(15),
    "phlebo_name" VARCHAR(100),
    "report_url" VARCHAR(500),
    "healthians_response" JSONB,
    "healthians_booking_id" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,
    "created_user_role" VARCHAR(50) NOT NULL,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE,
    "transaction_id" BIGINT REFERENCES "transactions" ("tx_id") ON DELETE SET NULL
);
COMMENT ON TABLE "healthians_bookings" IS 'Main booking record';
        CREATE TABLE IF NOT EXISTS "healthians_booking_tests" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "code" VARCHAR(50) NOT NULL,
    "price_mrp" DECIMAL(10,2) NOT NULL,
    "price_discounted" DECIMAL(10,2) NOT NULL,
    "booking_id" BIGINT NOT NULL REFERENCES "healthians_bookings" ("booking_id") ON DELETE CASCADE,
    "package_id" BIGINT REFERENCES "healthians_packages" ("package_id") ON DELETE SET NULL,
    "test_id" BIGINT REFERENCES "healthians_tests" ("test_id") ON DELETE SET NULL
);
COMMENT ON TABLE "healthians_booking_tests" IS 'Link booking ↔ tests/packages';
        CREATE TABLE IF NOT EXISTS "healthians_packages" (
    "package_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(200) NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "discounted_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "test_codes" JSONB NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE "healthians_packages" IS 'Package (group of tests)';
        CREATE TABLE IF NOT EXISTS "healthians_tests" (
    "test_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(200) NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "discounted_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOL NOT NULL DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE "healthians_tests" IS 'Individual test or parameter';
        CREATE TABLE IF NOT EXISTS "thyrocare_orders" (
    "order_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "thyrocare_order_id" VARCHAR(100),
    "client_code" VARCHAR(50) NOT NULL UNIQUE,
    "address" TEXT NOT NULL,
    "house_no" VARCHAR(100),
    "street" VARCHAR(200),
    "landmark" VARCHAR(200),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" INT NOT NULL,
    "appointment_date" TIMESTAMPTZ NOT NULL,
    "contact_number" VARCHAR(15) NOT NULL,
    "email" VARCHAR(200),
    "status" VARCHAR(50) NOT NULL DEFAULT 'YET TO ASSIGN',
    "booking_status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "total_mrp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_rate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_payable" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(50) NOT NULL DEFAULT 'POSTPAID',
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unpaid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "phlebo_name" VARCHAR(200),
    "phlebo_number" VARCHAR(15),
    "report_url" VARCHAR(500),
    "report_available" BOOL NOT NULL DEFAULT False,
    "report_timestamp" TIMESTAMPTZ,
    "thyrocare_response" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,
    "created_user_role" VARCHAR(50) NOT NULL,
    "student_id" BIGINT NOT NULL REFERENCES "students" ("id") ON DELETE CASCADE,
    "transaction_id" BIGINT REFERENCES "transactions" ("tx_id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "idx_thyrocare_o_thyroca_213b4d" ON "thyrocare_orders" ("thyrocare_order_id");
COMMENT ON TABLE "thyrocare_orders" IS 'Main Thyrocare order';
        CREATE TABLE IF NOT EXISTS "thyrocare_order_items" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "product_code" VARCHAR(100) NOT NULL,
    "product_name" VARCHAR(300) NOT NULL,
    "product_type" VARCHAR(50) NOT NULL,
    "mrp" DECIMAL(10,2) NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "pay_amt" DECIMAL(10,2) NOT NULL,
    "order_id" BIGINT NOT NULL REFERENCES "thyrocare_orders" ("order_id") ON DELETE CASCADE,
    "product_id" BIGINT REFERENCES "thyrocare_products" ("product_id") ON DELETE SET NULL
);
COMMENT ON TABLE "thyrocare_order_items" IS 'Items in a Thyrocare order';
        CREATE TABLE IF NOT EXISTS "thyrocare_patients" (
    "patient_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "patient_code" VARCHAR(50),
    "name" VARCHAR(200) NOT NULL,
    "age" INT NOT NULL,
    "age_type" VARCHAR(10) NOT NULL DEFAULT 'YEAR',
    "gender" VARCHAR(10) NOT NULL,
    "contact_number" VARCHAR(15),
    "email" VARCHAR(200),
    "report_available" BOOL NOT NULL DEFAULT False,
    "report_timestamp" TIMESTAMPTZ,
    "order_id" BIGINT NOT NULL REFERENCES "thyrocare_orders" ("order_id") ON DELETE CASCADE
);
COMMENT ON TABLE "thyrocare_patients" IS 'Patient details for Thyrocare order';
        CREATE TABLE IF NOT EXISTS "thyrocare_products" (
    "product_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "code" VARCHAR(100) NOT NULL UNIQUE,
    "name" VARCHAR(300) NOT NULL,
    "product_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "mrp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pay_amt" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "parameters_count" INT NOT NULL DEFAULT 0,
    "sample_type" VARCHAR(100),
    "fasting_required" BOOL NOT NULL DEFAULT False,
    "tat_hours" INT NOT NULL DEFAULT 24,
    "is_active" BOOL NOT NULL DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON COLUMN "thyrocare_products"."code" IS 'Thyrocare product code';
COMMENT ON COLUMN "thyrocare_products"."parameters_count" IS 'Number of parameters tested';
COMMENT ON COLUMN "thyrocare_products"."sample_type" IS 'Blood, Urine, etc.';
COMMENT ON COLUMN "thyrocare_products"."tat_hours" IS 'Turnaround time in hours';
COMMENT ON TABLE "thyrocare_products" IS 'Thyrocare test/profile/package stored in our database';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "thyrocare_order_items";
        DROP TABLE IF EXISTS "healthians_bookings";
        DROP TABLE IF EXISTS "thyrocare_products";
        DROP TABLE IF EXISTS "healthians_booking_tests";
        DROP TABLE IF EXISTS "healthians_tests";
        DROP TABLE IF EXISTS "healthians_packages";
        DROP TABLE IF EXISTS "thyrocare_orders";
        DROP TABLE IF EXISTS "thyrocare_patients";"""
