from fastapi import APIRouter

from src.utils.response import StandardResponse

router = APIRouter()


@router.get("/student/{student_code}/health-overview")
async def get_student_health_overview(student_code: str):
    data_dict = {
        "status": True,
        "message": "Student Health Overview",
        "data": {
            "student": {
                "student_id": 1,
                "student_code": "STU-001",
                "image": "https://images.unsplash.com/photo-1668620589356-56ba14193005?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "first_name": "Elvis",
                "middle_name": "Aaron",
                "last_name": "Presley",
                "gender": "M",
                "blood_group": "O+",
                "age": "12",  # Calculated from DOB
                "dob": "2011-01-08",
            },
            "health_overview": [
                {
                    "screening_type": "Vision Screening",
                    "screening_data": {
                        "screening_date": "2023-10-01",
                        "final_notes": "The child has normal vision.",
                        "status_list": ["Normal", "normal"],
                    },
                },
                {
                    "screening_type": "Physical Screening",
                    "screening_data": {
                        "screening_date": "2023-10-01",
                        "final_notes": "The child has normal vision.",
                        "status_list": ["Normal", "normal"],
                    },
                },
            ],
        },
    }
    response_obj = StandardResponse(**data_dict)
    return response_obj, 200


@router.get("/student/{student_code}/health-overview-details")
async def get_student_health_overview_details(student_code: str):
    data_dict = {
        "status": True,
        "message": "Student Health Overview",
        "data": {
            "student": {
                "student_id": 1,
                "student_code": "STU-001",
                "image": "https://images.unsplash.com/photo-1668620589356-56ba14193005?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                "first_name": "Elvis",
                "middle_name": "Aaron",
                "last_name": "Presley",
                "gender": "M",
                "blood_group": "O+",
                "age": "12",  # Calculated from DOB
                "dob": "2011-01-08",
            },
            "health_overview": [
                {
                    "screening_type": "physical_screening",
                    "screening_data": {
                        "status_list": ["Normal", "normal"],
                        "health_score": "85",
                        "max_score": "100",
                        "basic_info": {
                            "height_in_cm": 150,
                            "weight_in_kg": 45,
                            "bmi": 20.0,
                        },
                        "body_composite_analysis": {
                            "fat_mass_in_kg": 10.0,
                            "total_body_water_in_kg": 30.0,
                            "fat_ratio": 20.0,
                            "water_ratio": 60.0,
                            "fat_free_mass_in_kg": 35.0,
                            "skeletal_mass_in_kg": 25.0,
                            "skeletal_muscle_quality_index_in_percentage": 30,
                            "muscle_rate_in_percentage": 30,
                            "protein_mass_in_kg": 6.0,
                            "protein_ratio_in_percentage": 15.0,
                        },
                        "fat_distribution": {
                            "visceral_fat": 3,
                            "left_arm_fat_rate_in_percentage": 30.9,
                            "right_arm_fat_rate_in_percentage": 30.9,
                            "left_arm_muscle_mass_in_kg": 1.5,
                            "right_arm_muscle_mass_in_kg": 1.5,
                            "left_leg_muscle_ratio_in_percentage": 15,
                            "right_leg_muscle_rate_in_percentage": 15,
                            "left_leg_muscle_mass_in_kg": 3,
                            "right_right_muscle_mass_in_kg": 3,
                            "trunk_muscle_rate_in_percentage": 34,
                            "trunk_muscle_mass_in_kg": 9.8,
                        },
                        "hydration_cellular_health": {
                            "intra_cellular_water_in_kg": 14.0,
                            "extra_cellular_water_in_kg": 14.0,
                            "body_cell_mass_in_kg": 14.0,
                        },
                        "metabolic_health_indicator": {
                            "health_score": 99,
                            "health_evolution_in_percentage": 45.0,
                            "body_age_in_percentage": 44.5,
                            "bmr_in_kg": 44.5,
                            "obesity_level": 1.6,
                            "adiposity_level_in_percentage": 34,
                            "body_type_in_percentage": 34,
                        },
                        "metabolic_fitness_indicator": {
                            "fat_control_in_kg": 2,
                            "muscle_control_in_kg": 2,
                            "weight_control_in_kg": 2,
                            "standard_weight_in_kg": 2,
                            "bone_mass_in_kg": 2,
                            "minerals_in_kg": 2,
                        },
                        "cardiovascular_circulatory_indicators": {
                            "heart_rate_in_bpm": 80,
                            "weight_hip_ration_in_percentage": 0.8,
                        },
                    },
                },
                {"screening_type": "dental_screening", "screening_data": {}},
            ],
        },
    }
    response_obj = StandardResponse(**data_dict)
    return response_obj, 200
