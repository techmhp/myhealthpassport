from tortoise import run_async, Tortoise, transactions
from src.models.user_models import Parents, ParentRoles
from src.models.student_models import Students, ParentChildren, SchoolStudents
from src.models.school_models import Schools
from datetime import date
from tortoise.exceptions import IntegrityError

async def create_parent_and_children():
    # Initialize Tortoise ORM
    await Tortoise.init(
        config={
            'connections': {
                'default': {
                    'engine': 'tortoise.backends.asyncpg',
                    'credentials': {
                        'host': 'localhost',
                        'port': 5432,
                        'user': 'secretadmin',
                        'password': 'Access100',
                        'database': 'myhealth_passport'
                    }
                }
            },
            'apps': {
                'models': {
                    'models': [
                        'src.models.user_models',
                        'src.models.student_models',
                        'src.models.school_models'
                    ],
                    'default_connection': 'default',
                }
            }
        }
    )

    try:
        # Generate database schemas
        await Tortoise.generate_schemas()

        async with transactions.in_transaction():
            # Create or get School
            school, created = await Schools.get_or_create(
                school_code="SCH001",
                defaults={
                    "school_name": "Sunrise Academy",
                    "school_full_name": "Sunrise International Academy",
                    "school_logo": "",
                    "registration_no": "REG123456",
                    "country_code": "+1",
                    "phone": "+12345678900",
                    "primary_contact_fullname": "Alice Smith",
                    "primary_contact_email": "alice.smith@example.com",
                    "primary_contact_phone": "+12345678904",
                    "location": "Downtown",
                    "admin_contact_fullname": "Bob Johnson",
                    "admin_contact_email": "bob.johnson@example.com",
                    "admin_contact_phone": "+12345678905",
                    "address_line1": "456 School Lane",
                    "address_line2": "",
                    "landmark": "Near Central Park",
                    "street": "School Lane",
                    "state": "California",
                    "pincode": "123456",
                    "country": "USA",
                    "status": True
                }
            )
            print(f"{'Created' if created else 'Retrieved'} school: {school}")

            # Create or get Parent
            parent, created = await Parents.get_or_create(
                mobile="+12345678901",
                defaults={
                    "first_name": "John",
                    "last_name": "Doe",
                    "middle_name": "Michael",
                    "email": "john.doe@example.com",
                    "is_active": True,
                    "is_verified": True,
                    "profile_image": "",
                    "relation": "Father",
                    "user_role": ParentRoles.PARENT,
                    "role_type": "PARENT"
                }
            )
            print(f"{'Created' if created else 'Retrieved'} parent: {parent}")

            # Create or get Student 1
            student1, created = await Students.get_or_create(
                aadhaar_no="123456789012",
                defaults={
                    "first_name": "Emma",
                    "middle_name": "Jane",
                    "last_name": "Doe",
                    "gender": "FEMALE",
                    "dob": date(2012, 5, 15),
                    "class_room": 5,
                    "section": "A",
                    "roll_no": "STU001",
                    "abha_id": "ABHA1234567890",
                    "mp_uhid": "MPUHID001",
                    "food_preferences": "Vegetarian",
                    "address_line1": "123 Main St",
                    "address_line2": "",
                    "landmark": "Near Park",
                    "street": "Main Street",
                    "state": "California",
                    "pincode": "123456",
                    "country_code": "+1",
                    "phone": "+12345678902",
                    "country": "USA",
                    "blood_group": "A+",
                    "profile_image": ""
                }
            )
            print(f"{'Created' if created else 'Retrieved'} student 1: {student1}")

            # Create or get Student 2
            student2, created = await Students.get_or_create(
                aadhaar_no="987654321098",
                defaults={
                    "first_name": "Liam",
                    "middle_name": "James",
                    "last_name": "Doe",
                    "gender": "MALE",
                    "dob": date(2014, 8, 22),
                    "class_room": 3,
                    "section": "B",
                    "roll_no": "STU002",
                    "abha_id": "ABHA0987654321",
                    "mp_uhid": "MPUHID002",
                    "food_preferences": "No allergies",
                    "address_line1": "123 Main St",
                    "address_line2": "",
                    "landmark": "Near Park",
                    "street": "Main Street",
                    "state": "California",
                    "pincode": "123456",
                    "country_code": "+1",
                    "phone": "+12345678903",
                    "country": "USA",
                    "blood_group": "O+",
                    "profile_image": ""
                }
            )
            print(f"{'Created' if created else 'Retrieved'} student 2: {student2}")

            # Link Parent to Student 1
            parent_child1, created = await ParentChildren.get_or_create(
                parent=parent,
                student=student1,
                defaults={
                    "primary_phone_no": "+12345678901",
                    "secondary_phone_no": "+12345678902",
                    "status": True
                }
            )
            print(f"{'Created' if created else 'Retrieved'} parent-child link 1: {parent_child1}")

            # Link Parent to Student 2
            parent_child2, created = await ParentChildren.get_or_create(
                parent=parent,
                student=student2,
                defaults={
                    "primary_phone_no": "+12345678906",
                    "secondary_phone_no": "+12345678903",
                    "status": True
                }
            )
            print(f"{'Created' if created else 'Retrieved'} parent-child link 2: {parent_child2}")

            # Link Student 1 to School
            school_student1, created = await SchoolStudents.get_or_create(
                school=school,
                student=student1,
                defaults={"status": True}
            )
            print(f"{'Created' if created else 'Retrieved'} school-student link 1: {school_student1}")

            # Link Student 2 to School
            school_student2, created = await SchoolStudents.get_or_create(
                school=school,
                student=student2,
                defaults={"status": True}
            )
            print(f"{'Created' if created else 'Retrieved'} school-student link 2: {school_student2}")

    except IntegrityError as e:
        print(f"Integrity error occurred: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        await Tortoise.close_connections()

if __name__ == "__main__":
    run_async(create_parent_and_children())