
from tortoise import  fields
from tortoise.models import Model
from datetime import datetime


class StudentsQuestionBank(Model):
    question_id = fields.BigIntField(pk=True)

    question_text = fields.CharField(max_length=255, default="")
    question_type = fields.CharField(max_length=100, default="")  # e.g., Developmental & Emotional, Nutritional
    sub_domain = fields.CharField(max_length=100, default="")  # e.g., Emotional Well-being, Social Relationships
    score_type = fields.CharField(max_length=50, default="")  # e.g., Positive, Negative, reverse scored
    applicable_to_parent = fields.BooleanField(default=False)
    applicable_to_teacher = fields.BooleanField(default=False)
    grade_level = fields.CharField(max_length=100, null=True, default="")  # e.g., Play group, PP-I, PP-II, Class 1-3, Class 4-12
    notes = fields.TextField(null=True, default="")

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
        table = "students_question_bank"


class ParentAnswers(Model):
    parent_answer_id = fields.BigIntField(pk=True)

    question_id = fields.BigIntField()  # Stores the ID of a question
    answer = fields.CharField(default="", max_length=100)  # e.g., Yes, No, or descriptive answer
    notes = fields.TextField(null=True, default="")
    status = fields.BooleanField(default=False)
    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="parent_answers", index=True)
    parent = fields.ForeignKeyField("models.Parents", related_name="answers", index=True)

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
        table = "parent_screening_answers"


class TeacherAnswers(Model):
    teacher_answer_id = fields.BigIntField(pk=True)
    status = fields.BooleanField(default=False)
    question_id = fields.BigIntField()  # Stores the ID of a question
    notes = fields.TextField(null=True, default="")
    answer = fields.CharField(default="", max_length=100)  # e.g., Yes, No, or descriptive answer

    # Foreign Keys
    student = fields.ForeignKeyField("models.Students", related_name="teacher_answers", index=True)
    teacher = fields.ForeignKeyField("models.SchoolStaff", related_name="answers", index=True)

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
        table = "teacher_screening_answers"
        