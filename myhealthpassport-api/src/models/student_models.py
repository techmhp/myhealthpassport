from tortoise import fields
from tortoise.models import Model


class Students(Model):
    id = fields.BigIntField(pk=True)

    first_name = fields.CharField(default="", max_length=50)
    middle_name = fields.CharField(default="", max_length=50)
    last_name = fields.CharField(default="", max_length=50)
    gender = fields.CharField(default="", max_length=10)
    dob = fields.DateField()

    class_room = fields.CharField(max_length=50, default="")
    section = fields.CharField(default="", max_length=10)
    roll_no = fields.CharField(default="", max_length=50)

    aadhaar_no = fields.CharField(max_length=20, default="")
    abha_id = fields.CharField(max_length=50, default="")
    mp_uhid = fields.CharField(max_length=50, default="")

    food_preferences = fields.CharField(default="", max_length=255)

    address_line1 = fields.CharField(default="", max_length=255)
    address_line2 = fields.CharField(default="", max_length=255)
    landmark = fields.CharField(default="", max_length=255)
    street = fields.CharField(default="", max_length=255)
    state =fields.CharField(default="", max_length=50)
    pincode = fields.CharField(default="", max_length=50)

    country_code = fields.CharField(default="", max_length=50)
    phone = fields.CharField(default="", max_length=255)
    country = fields.CharField(default="", max_length=255)

    blood_group = fields.CharField(default="", max_length=10)
    profile_image = fields.CharField(default="", max_length=255)

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
    parents = fields.ManyToManyRelation["Parents"]
    behavioural_screenings = fields.ReverseRelation["BehaviouralScreening"]
    dental_screenings = fields.ReverseRelation["DentalScreening"]
    eye_screenings = fields.ReverseRelation["EyeScreening"]
    nutrition_screenings = fields.ReverseRelation["NutritionScreening"]
    contact_transcriptions = fields.ReverseRelation["ContactTranscriptions"]
    parent_children_rel = fields.ReverseRelation["ParentChildren"]
    school_students = fields.ReverseRelation["SchoolStudents"]
    student_lab_test_reports = fields.ReverseRelation["StudentLabTestReports"]
    student_questionnaires = fields.ReverseRelation["StudentQuestionnaire"]
    student_vaccinations = fields.ReverseRelation["StudentVaccination"]
    screening_analysis_checklists = fields.ReverseRelation["ScreeningAnalysisChecklist"]
    screening_reports_summaries = fields.ReverseRelation["ScreeningReportsSummary"]

    class Meta:
        table = "students"


class ParentChildren(Model):
    pc_id = fields.BigIntField(pk=True)

    primary_phone_no = fields.CharField(max_length=20)
    secondary_phone_no = fields.CharField(max_length=20)

    status = fields.BooleanField(default=True)

    # Foreign Keys
    parent = fields.ForeignKeyField("models.Parents", related_name="parent_children", index=True)
    student = fields.ForeignKeyField("models.Students", related_name="parent_children_rel", index=True)

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
    
    class Meta:
        table = "parent_children"


class AttendanceStatus(Model):
    id = fields.BigIntField(pk=True)

    attendance_status = fields.BooleanField(default=False)
    date = fields.DateField()
    user_id = fields.BigIntField()
    role = fields.CharField(max_length=50)
    role_type = fields.CharField(max_length=50)
    school_id = fields.BigIntField()
    class_name = fields.CharField(max_length=50)
    section = fields.CharField(max_length=10)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="attendance_status", index=True)

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

    class Meta:
        table = "attendance_status"


class SmartScaleData(Model):
    id = fields.BigIntField(pk=True)

    height_cm = fields.FloatField(null=True, default=0.0)
    age_years = fields.IntField(null=True, default=0.0)
    weighing_time = fields.DatetimeField(null=True)
    body_weight_kg = fields.FloatField(null=True, default=0.0)
    body_fat_rate_percent = fields.FloatField(null=False, default=0.0)
    device_mac = fields.CharField(max_length=50, null=True, default="")  # MAC address format: CF:E8:07:03:30:4F
    inorganic_salt_content_kg = fields.FloatField(null=True, default=0.0)
    obesity_percent = fields.FloatField(null=True, default=0.0)
    water_content_kg = fields.FloatField(null=True, default=0.0)
    protein_content_kg = fields.FloatField(null=True, default=0.0)
    subcutaneous_fat_volume_kg = fields.FloatField(null=True, default=0.0)
    bmi = fields.FloatField(null=True, default=0.0)
    fat_content_kg = fields.FloatField(null=True, default=0.0)
    muscle_rate_percent = fields.FloatField(null=True, default=0.0)
    muscle_mass_kg = fields.FloatField(null=True, default=0.0)
    visceral_fat_level = fields.FloatField(null=True, default=0.0)
    bmr = fields.FloatField(null=True, default=0.0)
    body_moisture_content_percent = fields.FloatField(null=True, default=0.0)
    bone_mass_kg = fields.FloatField(null=True, default=0.0)
    internal_protein_rate_percent = fields.FloatField(null=True, default=0.0)
    skeletal_muscle_rate_percent = fields.FloatField(null=True, default=0.0)
    lean_body_mass_kg = fields.FloatField(null=True, default=0.0)
    heart_rate_beats_min = fields.IntField(null=True, default=0)
    physical_score = fields.IntField(null=True, default=0)
    body_type = fields.IntField(null=True, default=0)  # 0: Normal, 1: Obese, 2: Underweight, etc.
    physical_age = fields.IntField(null=True, default=0)
    subcutaneous_fat_rate = fields.FloatField(null=True, default=0.0)
    health_level = fields.IntField(null=True, default=0)  # 0: Healthy, 1: At risk, 2: Unhealthy
    obesity_level = fields.IntField(null=True, default=0)  # 0: Normal, 1: Overweight, 2: Obese
    fat_control_quantity = fields.FloatField(null=True, default=0.0)
    weight_control_quantity = fields.FloatField(null=True, default=0.0)
    muscle_control_quantity = fields.FloatField(null=True, default=0.0)
    standard_body_weight = fields.FloatField(null=True, default=0.0)
    ideal_weight = fields.FloatField(null=True, default=0.0)
    body_cell_volume_kg = fields.FloatField(null=True, default=0.0)
    extracellular_water_volume_kg = fields.FloatField(null=True, default=0.0)
    intracellular_water_volume_kg = fields.FloatField(null=True, default=0.0)
    left_hand_fat_mass_kg = fields.FloatField(null=True, default=0.0)
    left_foot_fat_mass_kg = fields.FloatField(null=True, default=0.0)
    right_hand_fat_mass_kg = fields.FloatField(null=True, default=0.0)
    right_foot_fat_mass_kg = fields.FloatField(null=True, default=0.0)
    trunk_fat_mass_kg = fields.FloatField(null=True, default=0.0)
    left_hand_fat_rate_percent = fields.FloatField(null=True, default=0.0)
    left_foot_fat_rate_percent = fields.FloatField(null=True, default=0.0)
    right_hand_fat_rate_percent = fields.FloatField(null=True, default=0.0)
    right_foot_fat_rate_percent = fields.FloatField(null=True, default=0.0)
    trunk_fat_rate_percent = fields.FloatField(null=True, default=0.0)
    left_hand_muscle_mass_kg = fields.FloatField(null=True, default=0.0)
    left_foot_muscle_mass_kg = fields.FloatField(null=True, default=0.0)
    right_hand_muscle_mass_kg = fields.FloatField(null=True, default=0.0)
    right_foot_muscle_mass_kg = fields.FloatField(null=True, default=0.0)
    trunk_muscle_mass_kg = fields.FloatField(null=True, default=0.0)
    skeletal_muscle_mass_index = fields.FloatField(null=True, default=0.0)
    whr = fields.FloatField(null=True, default=0.0)  # Waist-Hip Ratio
    left_hand_muscle_rate = fields.FloatField(null=True, default=0.0)
    left_leg_muscle_rate = fields.FloatField(null=True, default=0.0)
    right_hand_muscle_rate = fields.FloatField(null=True)
    right_foot_muscle_rate = fields.FloatField(null=True, default=0.0)
    trunk_muscle_rate = fields.FloatField(null=True, default=0.0)
    skeletal_muscle_mass_kg = fields.FloatField(null=True, default=0.0)

    screening_status = fields.BooleanField(default=False)

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="student_smarts", index=True)
    school = fields.ForeignKeyField("models.Schools", related_name="school_smarts", index=True)

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

    class Meta:
        table = "student_smart_scale"


class SchoolStudents(Model):
    ss_id = fields.BigIntField(pk=True)

    status = fields.BooleanField(default=True)

    # Foreign Keys
    school = fields.ForeignKeyField("models.Schools", related_name="school_students", index=True)
    student = fields.ForeignKeyField("models.Students", related_name="school_students", index=True)

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

    class Meta:
        table = "school_students"
