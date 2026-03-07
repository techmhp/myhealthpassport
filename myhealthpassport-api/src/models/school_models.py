from tortoise import fields
from tortoise.models import Model

class Schools(Model):
    school_id = fields.BigIntField(pk=True)

    school_name = fields.CharField(max_length=100, default="")
    school_full_name = fields.CharField(max_length=255, default="")
    school_logo = fields.CharField(max_length=255, default="")
    school_location_link = fields.CharField(max_length=500, null=True, default="")

    # Unique Fields
    school_code = fields.CharField(max_length=20, unique=True)

    registration_no = fields.CharField(max_length=255, default="")
    country_code = fields.CharField(max_length=20, default="")
    phone = fields.CharField(max_length=20, default="")

    primary_contact_fullname = fields.CharField(max_length=50, default="")
    primary_contact_email = fields.CharField(max_length=50, default="")
    primary_contact_phone = fields.CharField(max_length=50, default="")
    location = fields.TextField(default="")  # school_location_link

    admin_contact_fullname = fields.CharField(max_length=50, default="")
    admin_contact_email = fields.CharField(max_length=50, default="")
    admin_contact_phone = fields.CharField(max_length=20, default="")

    address_line1 = fields.CharField(max_length=255, default="")
    address_line2 = fields.CharField(max_length=255, default="")
    landmark = fields.CharField(max_length=100, default="")
    street = fields.CharField(max_length=100, default="")
    state = fields.CharField(max_length=50, default="")
    pincode = fields.CharField(max_length=10, default="")
    country = fields.CharField(max_length=50, default="")

    status = fields.BooleanField(default=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)
    deleted_by = fields.BigIntField(null=True)  # User ID who performed soft delete
    deleted_user_role = fields.CharField(null=True, max_length=50, default="")

    # Relations
    school_staff = fields.ReverseRelation["SchoolStaff"]
    school_students = fields.ReverseRelation["SchoolStudents"]

    class Meta:
        table = "health_passport_schools"

        
class AssignSchool(Model):
    id = fields.BigIntField(pk=True)

    date = fields.DateField(null=True)#renamed from start_time to date
    from_time = fields.CharField(max_length=20, default="")# added new 
    to_time = fields.CharField(max_length=20, default="")# added new 
    team_type = fields.CharField(max_length=50, default="")
    team_role = fields.CharField(max_length=50, default="")
    user_id = fields.BigIntField(null=False)

    school = fields.BigIntField(null=False)
    class_no = fields.CharField(max_length=10, default="")
    section = fields.CharField(max_length=10, default="")

    is_completed = fields.BooleanField(default=False)

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)  # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="")  # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="")  # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)  # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="")  # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="")  # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)

    def __str__(self):
        return f"Assignment {self.id} for User {self.user_id} to School {self.school_id}"

    class Meta:
        table = "hp_assign_school"
        
class StudentSchoolPayment(Model):
    id = fields.BigIntField(pk=True)

    student = fields.ForeignKeyField("models.Students", related_name="school_payments")
    school = fields.ForeignKeyField("models.Schools", related_name="school_payments")

    payment_date = fields.CharField(max_length=10, null=True, default=None)  # "14/12/2025"
    is_paid = fields.BooleanField(default=False)

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)
    created_user_role = fields.CharField(max_length=50, null=True)

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True)
    updated_user_role = fields.CharField(max_length=50, null=True)

    is_deleted = fields.BooleanField(default=False)

    class Meta:
        table = "student_school_payments"
        unique_together = ("student", "payment_date")
        