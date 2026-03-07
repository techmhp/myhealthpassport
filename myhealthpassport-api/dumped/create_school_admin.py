import asyncio
import asyncpg
from argon2 import PasswordHasher, Type
from datetime import datetime
import pytz

async def create_school_admin():
    # Step 1: Generate Argon2 hash for the password "access100"
    ph = PasswordHasher(
        memory_cost=65536,  # 64 MiB
        time_cost=3,       # 3 iterations
        parallelism=4,     # 4 threads
        hash_len=32,       # Default hash length
        salt_len=16,       # Default salt length
        type=Type.ID       # argon2id
    )
    password = "access100"
    hashed_password = ph.hash(password)
    print(f"Generated hash for password 'access100': {hashed_password}")

    # Step 2: Parse the timestamp with timezone
    timestamp_str = "2025-05-06 10:00:00"
    timezone = pytz.timezone("Asia/Kolkata")  # +05:30 timezone (IST)
    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
    timestamp = timezone.localize(timestamp)  # Add timezone info

    # Step 3: Connect to the PostgreSQL database
    try:
        conn = await asyncpg.connect(
            user='secretadmin',
            password='Access100',
            database='myhealth_passport',
            host='localhost',
            port=5432
        )
        print("Connected to the database successfully.")

        # Step 4: Insert the user into users_school_staff table
        insert_query = """
        INSERT INTO users_school_staff (
            first_name, last_name, middle_name, username, phone, email, password,
            is_active, is_verified, profile_image, user_role, role_type, created_at,
            updated_at, street, state, pincode, country, dob, gender, address_line_1,
            address_line_2, landmark, country_calling_code, school_id
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25
        ) RETURNING id;
        """
        try:
            user_id = await conn.fetchval(
                insert_query,
                'John',                     # first_name
                'Doe',                      # last_name
                '',                         # middle_name
                'johnadmin',                # username
                '9876543210',               # phone
                'john.doe@example.com',     # email
                hashed_password,            # password (hashed)
                True,                       # is_active
                True,                       # is_verified
                '',                         # profile_image
                'SCHOOL_ADMIN',             # user_role
                'SCHOOL_STAFF',             # role_type
                timestamp,                  # created_at (datetime object)
                timestamp,                  # updated_at (datetime object)
                '',                         # street
                '',                         # state
                '',                         # pincode
                '',                         # country
                None,                       # dob
                '',                         # gender
                '',                         # address_line_1
                '',                         # address_line_2
                '',                         # landmark
                '',                         # country_calling_code
                1                           # school_id
            )
            print(f"User 'johnadmin' created successfully with ID: {user_id}")

        except asyncpg.exceptions.UniqueViolationError as e:
            print(f" legteError: User with username 'johnadmin' or phone '9876543210' already exists. Details: {e}")
        except Exception as e:
            print(f"Error inserting user: {e}")

        # Step 5: Close the database connection
        await conn.close()
        print("Database connection closed.")

    except Exception as e:
        print(f"Error connecting to the database: {e}")

# Run the async function
if __name__ == "__main__":
    asyncio.run(create_school_admin())