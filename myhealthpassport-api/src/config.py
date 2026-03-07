import os

environment = os.environ.get("APP_ENV")

if environment == "production":
    TORTOISE_ORM = {
        "connections": {
            "default": "postgres://secretadmin:Access100@localhost:5432/myhealth_passport"
        },
        "apps": {
            "models": {
                "models": [
                    "src.models.user_models",
                    "src.models.consultation_models",
                    "src.models.other_models",
                    "src.models.school_models",
                    "src.models.screening_models",
                    "src.models.transaction_models",
                    "src.models.student_models",
                    "src.models.questionnaire_models",
                    "src.models.helthians_booking",
                    "src.models.thyrocare_models",
                ],
                "default_connection": "default",
            },
            "aerich": {
                "models": ["aerich.models"],
                "default_connection": "default",
            },
        },
        "use_tz": False,  # ✅ Add this
        "timezone": "UTC"  # ✅ Add this
    }

elif environment == "development" or environment is None:
    TORTOISE_ORM = {
        "connections": {
            "default": "postgres://secretadmin:Access100@localhost:5432/myhealth_passport_dev"
        },
        "apps": {
            "models": {
                "models": [
                    "src.models.user_models",
                    "src.models.consultation_models",
                    "src.models.other_models",
                    "src.models.school_models",
                    "src.models.screening_models",
                    "src.models.transaction_models",
                    "src.models.student_models",
                    "src.models.questionnaire_models",
                    "src.models.helthians_booking",
                    "src.models.thyrocare_models",
                ],
                "default_connection": "default",
            },
            "aerich": {
                "models": ["aerich.models"],
                "default_connection": "default",
            },
        },
        "use_tz": False,  # ✅ Add this
        "timezone": "UTC"  # ✅ Add this
    }
