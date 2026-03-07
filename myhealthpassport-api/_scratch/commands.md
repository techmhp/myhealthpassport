## Run on Development Mode
fastapi dev main.py

or

uvicorn main:app --reload
aerich init-db
aerich migrate  --name  "Initial Migration"
aerich upgrade

# New Commands

# to run the app in production mode
export APP_ENV=production
python main.py 

# to run the app in development mode
export APP_ENV=development
python main.py 



## Create SUper Admin

python cli.py




sudo ssh -i my_health_passport.pem ubuntu@3.110.216.252


    CREATE USER secretadmin WITH PASSWORD 'Access100';

    GRANT ALL PRIVILEGES ON DATABASE myhealth_passport TO secretadmin;

postgres-# ;
DROP DATABASE
postgres=# create database myhealth_passport;
CREATE DATABASE
postgres=#
GRANT USAGE ON SCHEMA public TO secretadmin;
GRANT CREATE ON SCHEMA public TO secretadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO secretadmin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO secretadmin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO secretadmin;
GRANT
GRANT
GRANT
ALTER DEFAULT PRIVILEGES
ALTER DEFAULT PRIVILEGES
postgres=#


-- Grant permission to access the 'public' schema
GRANT USAGE ON SCHEMA public TO secretadmin;

-- Grant permission to create objects (like tables) within the 'public' schema
GRANT CREATE ON SCHEMA public TO secretadmin;

-- Grant all permissions on all existing tables in the 'public' schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO secretadmin;

-- Ensure the user has privileges on any new tables created in the future
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO secretadmin;


# AD 
# Copy DB 
postgres=# CREATE DATABASE myhealth_passport_dev WITH OWNER secretadmin TEMPLATE myhealth_passport;

<!-- consultations parents foreign key to students -->
-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE consultations DROP CONSTRAINT consultations_patient_id_fkey;

<!-- step 2 -->
ALTER TABLE consultations
ADD CONSTRAINT consultations_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES students (id);

<!-- step 3 -->
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'consultations'
    AND kcu.column_name = 'patient_id';

<!-- hold_expiry column issue -->
ALTER TABLE consultations
ADD COLUMN hold_expiry TIMESTAMP NULL;





<!-- labtests issues , run all below tables-->

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

CREATE TABLE IF NOT EXISTS "healthians_booking_tests" (
"id" BIGSERIAL NOT NULL PRIMARY KEY,
"code" VARCHAR(50) NOT NULL,
"price_mrp" DECIMAL(10,2) NOT NULL,
"price_discounted" DECIMAL(10,2) NOT NULL,
"booking_id" BIGINT NOT NULL REFERENCES "healthians_bookings" ("booking_id") ON DELETE CASCADE,
"package_id" BIGINT REFERENCES "healthians_packages" ("package_id") ON DELETE SET NULL,
"test_id" BIGINT REFERENCES "healthians_tests" ("test_id") ON DELETE SET NULL
);

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

