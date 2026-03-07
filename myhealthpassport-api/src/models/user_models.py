import enum
from tortoise import fields
from tortoise.models import Model


class ParentRoles(str, enum.Enum):
    PARENT = "PARENT"
    GUARDIAN = "GUARDIAN"

class SchoolRoles(str, enum.Enum):
    SCHOOL_ADMIN = "SCHOOL_ADMIN"
    TEACHER = "TEACHER"

class OnGroundTeamRoles(str, enum.Enum):
    REGISTRATION_TEAM = "REGISTRATION_TEAM"
    CAMP_COORDINATOR = "CAMP_COORDINATOR"

class ScreeningTeamRoles(str, enum.Enum):
    PHYSICAL_WELLBEING = "PHYSICAL_WELLBEING"
    DENTIST = "DENTIST"
    EYE_SPECIALIST = "EYE_SPECIALIST"
    NUTRITIONIST = "NUTRITIONIST"
    PSYCHOLOGIST = "PSYCHOLOGIST"
    SMART_SCALE = "SMART_SCALE"

class AnalystRoles(str, enum.Enum):
    NUTRITIONIST = "NUTRITIONIST"
    PSYCHOLOGIST = "PSYCHOLOGIST"
    MEDICAL_OFFICER = "MEDICAL_OFFICER"

class AdminTeamRoles(str, enum.Enum):
    PROGRAM_COORDINATOR = "PROGRAM_COORDINATOR"
    SUPER_ADMIN = "SUPER_ADMIN"
    HEALTH_BUDDY = "HEALTH_BUDDY"

class ConsultantRoles(str, enum.Enum):
    PEDIATRICIAN = "PEDIATRICIAN"
    DENTIST = "DENTIST"
    EYE_SPECIALIST = "EYE_SPECIALIST"
    NUTRITIONIST = "NUTRITIONIST"
    PSYCHOLOGIST = "PSYCHOLOGIST"

class Parents(Model):
    id = fields.BigIntField(pk=True)

    primary_first_name = fields.CharField(max_length=50, default="")
    primary_last_name = fields.CharField(max_length=50, default="")
    primary_middle_name = fields.CharField(max_length=50, default="")
    primary_mobile = fields.CharField(max_length=20, unique=True)
    primary_email = fields.CharField(max_length=100, default="")
    primary_country_calling_code = fields.CharField(max_length=100, default="")
    country = fields.CharField(max_length=100, default="")

    secondary_first_name = fields.CharField(max_length=50, default="")
    secondary_last_name = fields.CharField(max_length=50, default="")
    secondary_middle_name = fields.CharField(max_length=50, default="")
    secondary_mobile = fields.CharField(max_length=20, default="")
    secondary_email = fields.CharField(max_length=100, default="")
    secondary_country_calling_code = fields.CharField(max_length=100, default="")

    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=True)
    profile_image = fields.CharField(max_length=255, default="")
    location = fields.CharField(max_length=50, default="")
    blood_group = fields.CharField(max_length=10, default="", null=True)
    user_role = fields.CharEnumField(ParentRoles, default=ParentRoles.PARENT)
    role_type = fields.CharField(max_length=50, default="PARENT")

    #missing fields
    dob = fields.DateField(null=True)
    gender = fields.CharField(max_length=20, default="")
    address_line_1 = fields.CharField(max_length=100, default="")
    address_line_2 = fields.CharField(max_length=100, default="")
    landmark = fields.CharField(max_length=100, default="")
    street_name = fields.CharField(max_length=100, default="")
    state = fields.CharField(max_length=100, default="")
    pincode = fields.CharField(max_length=100, default="")

    students = fields.ManyToManyField(
        "models.Students",
        related_name="parents",
        through="health_passport_parent_children",
        backward_key="student_id",
        forward_key="parent_id",
    )

    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True) # Created User ID
    created_user_role = fields.CharField(null=True, max_length=50, default="") # Created User Role
    created_role_type = fields.CharField(null=True, max_length=50, default="") # Created Role Type

    updated_at = fields.DatetimeField(auto_now=True)
    updated_by = fields.BigIntField(null=True) # Updated User ID
    updated_user_role = fields.CharField(null=True, max_length=50, default="") # Updated User Role
    updated_role_type = fields.CharField(null=True, max_length=50, default="") # Updated Role Type

    deleted_at = fields.DatetimeField(null=True)    # Deleted DateTime
    is_deleted = fields.BooleanField(default=False)
    deleted_by = fields.BigIntField(null=True)  # User ID who performed soft delete
    deleted_user_role = fields.CharField(null=True, max_length=50, default="")

    # Relations
    parent_children = fields.ReverseRelation["ParentChildren"]

    def __str__(self):
        return f"Parent Profile for User {self.id}"

    class Meta:
        table = "users_parents"


class SchoolStaff(Model):
    id = fields.BigIntField(pk=True)

    first_name = fields.CharField(max_length=50, default="")
    last_name = fields.CharField(max_length=50, default="")
    middle_name = fields.CharField(max_length=50, default="")
    username = fields.CharField(unique=True, max_length=50)
    password = fields.CharField(max_length=255, default="")
    phone = fields.CharField(max_length=20, unique=True)
    email = fields.CharField(max_length=100, default="")
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=True)
    profile_image = fields.CharField(max_length=255, default="")
    
    class_room = fields.CharField(max_length=10, default="", null=False)
    section = fields.CharField(default="", max_length=2)
    user_role = fields.CharEnumField(SchoolRoles, default=SchoolRoles.TEACHER)
    role_type = fields.CharField(max_length=50, default="SCHOOL_STAFF")
    blood_group = fields.CharField(max_length=10, default="", null=True)
    street = fields.CharField(max_length=100, default="")
    state = fields.CharField(max_length=100, default="")
    pincode = fields.CharField(max_length=10, default="")
    country = fields.CharField(max_length=50, default="")

    #missing fields
    dob = fields.DateField(null=True)
    gender = fields.CharField(max_length=20, default="")
    address_line_1 = fields.CharField(max_length=100, default="")
    address_line_2 = fields.CharField(max_length=100, default="")
    landmark = fields.CharField(max_length=100, default="")
    country_calling_code = fields.CharField(max_length=5, default="")
    location = fields.CharField(max_length=50, default="")

    school = fields.ForeignKeyField("models.Schools", related_name="school_staff_profiles", on_delete=fields.SET_NULL, null=True)

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

    def __str__(self):
        return f"School Staff Profile for User {self.id}"

    class Meta:
        table = "users_school_staff"


class OnGroundTeam(Model):
    id = fields.BigIntField(pk=True)

    first_name = fields.CharField(max_length=50, default="")
    last_name = fields.CharField(max_length=50, default="")
    middle_name = fields.CharField(max_length=50, default="")
    username = fields.CharField(unique=True, max_length=50)
    phone = fields.CharField(max_length=20, unique=True)
    email = fields.CharField(max_length=100, null=True, default="")
    password = fields.CharField(max_length=255, default="")
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=True)
    profile_image = fields.CharField(max_length=255, default="")

    role_type = fields.CharField(max_length=50, default="ON_GROUND_TEAM")
    user_role = fields.CharEnumField(OnGroundTeamRoles, default=OnGroundTeamRoles.REGISTRATION_TEAM)

    #missing fields
    dob = fields.DateField(null=True)
    gender = fields.CharField(max_length=20, default="")
    address_line_1 = fields.CharField(max_length=100, default="")
    address_line_2 = fields.CharField(max_length=100, default="")
    landmark = fields.CharField(max_length=100, default="")
    street_name = fields.CharField(max_length=100, default="")
    state = fields.CharField(max_length=50, default="")
    pincode = fields.CharField(max_length=10, default="")
    country_calling_code = fields.CharField(max_length=5, default="")
    country = fields.CharField(max_length=50, default="")
    location = fields.CharField(max_length=50, default="")
    blood_group = fields.CharField(max_length=10, default="", null=True)
    spoken_languages = fields.TextField(default="", null=True)
    days_available = fields.TextField(default="", null=True)
    employee_id = fields.CharField(max_length=50, unique=True, default=None, null=True)

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
        return f"{self.username} ({self.user_role.value})"

    class Meta:
        table = "users_on_ground_team"


class ScreeningTeam(Model):
    id = fields.BigIntField(pk=True)

    first_name = fields.CharField(max_length=50, default="")
    last_name = fields.CharField(max_length=50, default="")
    middle_name = fields.CharField(max_length=50, default="")
    username = fields.CharField(unique=True, max_length=50)
    phone = fields.CharField(max_length=20, unique=True)
    email = fields.CharField(max_length=100, default="")
    password = fields.CharField(max_length=255, default="")
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=True)
    profile_image = fields.CharField(max_length=255, default="")

    user_role = fields.CharEnumField(ScreeningTeamRoles, default=ScreeningTeamRoles.PHYSICAL_WELLBEING)
    role_type = fields.CharField(max_length=50, default="SCREENING_TEAM")

    #missing fields
    dob = fields.DateField(null=True)
    gender = fields.CharField(max_length=20, default="")
    address_line_1 = fields.CharField(max_length=100, default="")
    address_line_2 = fields.CharField(max_length=100, default="")
    landmark = fields.CharField(max_length=100, default="")
    street_name = fields.CharField(max_length=100, default="")
    state = fields.CharField(max_length=50, default="")
    pincode = fields.CharField(max_length=10, default="")
    country_calling_code = fields.CharField(max_length=5, default="")
    country = fields.CharField(max_length=50, default="")
    location = fields.CharField(max_length=50, default="")
    blood_group = fields.CharField(max_length=10, default="", null=True)
    spoken_languages = fields.TextField(default="", null=True)
    days_available = fields.TextField(default="", null=True)
    employee_id = fields.CharField(max_length=50, unique=True, default=None, null=True)

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
        return f"{self.username} ({self.user_role.value})"

    class Meta:
        table = "users_screening_team"



class AnalystTeam(Model):
    id = fields.BigIntField(pk=True)

    first_name = fields.CharField(max_length=50, default="")
    last_name = fields.CharField(max_length=50, default="")
    middle_name = fields.CharField(max_length=50, default="")
    username = fields.CharField(unique=True, max_length=50)
    phone = fields.CharField(max_length=20, unique=True)
    email = fields.CharField(max_length=100, null=True, default="")
    password = fields.CharField(max_length=255, default="")
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=True)
    profile_image = fields.TextField(null=True, default="")

    user_role = fields.CharEnumField(AnalystRoles, default=AnalystRoles.PSYCHOLOGIST)
    role_type = fields.CharField(max_length=50, default="ANALYST_TEAM")

    #missing team
    dob = fields.DateField(null=True)
    gender = fields.CharField(max_length=20, default="")
    address_line_1 = fields.CharField(max_length=100, default="")
    address_line_2 = fields.CharField(max_length=100, default="")
    landmark = fields.CharField(max_length=100, default="")
    street_name = fields.CharField(max_length=100, default="")
    state = fields.CharField(max_length=50, default="")
    pincode = fields.CharField(max_length=10, default="")
    country_calling_code = fields.CharField(max_length=5, default="")
    country = fields.CharField(max_length=50, default="")
    location = fields.CharField(max_length=50, default="")
    blood_group = fields.CharField(max_length=10, default="", null=True)
    spoken_languages = fields.TextField(default="", null=True)
    days_available = fields.TextField(default="", null=True)
    employee_id = fields.CharField(max_length=50, unique=True, default=None, null=True)

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
        return f"{self.username} ({self.user_role.value})"

    class Meta:
        table = "users_analyst_team"



class AdminTeam(Model):
    id = fields.BigIntField(pk=True)

    first_name = fields.CharField(max_length=50, default="")
    last_name = fields.CharField(max_length=50, default="")
    middle_name = fields.CharField(max_length=50, default="")
    username = fields.CharField(unique=True, max_length=50)
    phone = fields.CharField(max_length=20, unique=True)
    email = fields.CharField(max_length=100, null=True, default="")
    password = fields.TextField(null=True)
    is_active = fields.BooleanField(default=True)
    is_verified = fields.BooleanField(default=True)
    profile_image = fields.CharField(max_length=255, default="")

    user_role = fields.CharEnumField(AdminTeamRoles, default=AdminTeamRoles.PROGRAM_COORDINATOR)
    role_type = fields.CharField(max_length=50, default="ADMIN_TEAM")

    #missing fields
    dob = fields.DateField(null=True)
    gender = fields.CharField(max_length=20, default="")
    address_line_1 = fields.CharField(max_length=100, default="")
    address_line_2 = fields.CharField(max_length=100, default="")
    landmark = fields.CharField(max_length=100, default="")
    street_name = fields.CharField(max_length=100, default="")
    state = fields.CharField(max_length=50, default="")
    pincode = fields.CharField(max_length=10, default="")
    country_calling_code = fields.CharField(max_length=5, default="")
    country = fields.CharField(max_length=50, default="")
    location = fields.CharField(max_length=50, default="")
    blood_group = fields.CharField(max_length=10, default="", null=True)
    spoken_languages = fields.TextField(default="", null=True)
    days_available = fields.TextField(default="", null=True)
    employee_id = fields.CharField(max_length=50, unique=True, default=None, null=True)

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
        return f"{self.username} ({self.user_role.value})"

    class Meta:
        table = "admin_users"


class ConsultantTeam(Model):
    id = fields.BigIntField(pk=True)
    password = fields.TextField(null=True)
    first_name = fields.CharField(max_length=50, default="")
    last_name = fields.CharField(max_length=50, default="")
    middle_name = fields.CharField(max_length=50, default="")
    education = fields.CharField(max_length=50, default="")
    specialty = fields.CharField(max_length=50, default="")
    experience = fields.CharField(max_length=50, default="")
    location = fields.CharField(max_length=50, default="")
    state = fields.CharField(max_length=50, default="")
    country = fields.CharField(max_length=50, default="")
    clinic_name = fields.CharField(max_length=100, default="")
    pincode = fields.CharField(max_length=10, default="")
    user_role = fields.CharEnumField(ConsultantRoles, default=ConsultantRoles.PEDIATRICIAN)
    role_type = fields.CharField(max_length=50, default="CONSULTANT_TEAM")
    is_verified = fields.BooleanField(default=True)
    blood_group = fields.CharField(max_length=10, default="", null=True)
    #missing team~
    phone = fields.CharField(max_length=20, unique=True, default="0000000000")
    email = fields.CharField(max_length=100, default="")
    dob = fields.DateField(null=True)
    gender = fields.CharField(max_length=20, default="")
    address_line_1 = fields.CharField(max_length=100, default="")
    address_line_2 = fields.CharField(max_length=100, default="")
    landmark = fields.CharField(max_length=100, default="")
    street_name = fields.CharField(max_length=100, default="")
    country_calling_code = fields.CharField(max_length=5, default="")
    profile_image = fields.CharField(max_length=255, default="", null=False)  # Added profile_image field
    is_active = fields.BooleanField(default=True)
    #new fields
    available_time_slots = fields.JSONField(null=True)  # store list of available time slots
    consultation_duration = fields.IntField(null=True, default=30)  # minutes per session
    max_consultations_per_day = fields.IntField(null=True, default=10)
    consultation_charges = fields.FloatField(null=True, default=0.0)  # or commission per session
    brief_bio = fields.TextField(null=True, default="")
    license_number = fields.CharField(max_length=100, null=True, default="")
    languages_spoken = fields.JSONField(null=True)
    username = fields.CharField(max_length=50, unique=True)
    availability = fields.CharField(max_length=255, null=True, default="")
    location_link = fields.CharField(max_length=500, null=True, default="")
    

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
        return f"Doctor Profile for User {self.id}"

    class Meta:
        table = "users_consultant"
        