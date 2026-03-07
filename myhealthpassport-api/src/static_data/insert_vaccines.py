from src.models.other_models import Vaccinations


# -------------------- Vaccination Data --------------------
vaccination_list = [
    {"vaccine_name": "BCG", "age": "At Birth"},
    {"vaccine_name": "Hepatitis B (1st dose)", "age": "At Birth"},
    {"vaccine_name": "OPV (Oral Polio)", "age": "At Birth"},
    {"vaccine_name": "DTP (1st dose)", "age": "6 Weeks"},
    {"vaccine_name": "IPV (1st dose)", "age": "6 Weeks"},
    {"vaccine_name": "Hepatitis B (2nd dose)", "age": "6 Weeks"},
    {"vaccine_name": "Hib (1st dose)", "age": "6 Weeks"},
    {"vaccine_name": "Rotavirus (1st dose)", "age": "6 Weeks"},
    {"vaccine_name": "PCV (1st dose)", "age": "6 Weeks"},
    {"vaccine_name": "DTP (2nd dose)", "age": "10 Weeks"},
    {"vaccine_name": "IPV (2nd dose)", "age": "10 Weeks"},
    {"vaccine_name": "Hib (2nd dose)", "age": "10 Weeks"},
    {"vaccine_name": "Rotavirus (2nd dose)", "age": "10 Weeks"},
    {"vaccine_name": "PCV (2nd dose)", "age": "10 Weeks"},
    {"vaccine_name": "DTP (3rd dose)", "age": "14 Weeks"},
    {"vaccine_name": "IPV (3rd dose)", "age": "14 Weeks"},
    {"vaccine_name": "Hib (3rd dose)", "age": "14 Weeks"},
    {"vaccine_name": "Rotavirus (3rd dose)", "age": "14 Weeks"},
    {"vaccine_name": "PCV (3rd dose)", "age": "14 Weeks"},
    {"vaccine_name": "Hepatitis B (3rd dose)", "age": "6 Months"},
    {"vaccine_name": "Influenza (1st dose)", "age": "6 Months"},
    {"vaccine_name": "Influenza (2nd dose)", "age": "7-9 Months"},
    {"vaccine_name": "MMR (1st dose)", "age": "9 Months"},
    {"vaccine_name": "Typhoid Conjugate Vaccine (TCV)", "age": "9 Months"},
    {"vaccine_name": "Hepatitis A (1st dose)", "age": "12 Months"},
    {"vaccine_name": "MMR (2nd dose)", "age": "15 Months"},
    {"vaccine_name": "Varicella (1st dose)", "age": "15 Months"},
    {"vaccine_name": "PCV booster", "age": "15 Months"},
    {"vaccine_name": "DTP booster-1", "age": "18 Months"},
    {"vaccine_name": "Hib booster", "age": "18 Months"},
    {"vaccine_name": "Hepatitis A (2nd dose)", "age": "18 Months"},
    {"vaccine_name": "Typhoid Booster", "age": "2 Years"},
    {"vaccine_name": "DTP booster-2", "age": "4-6 Years"},
    {"vaccine_name": "IPV booster-2", "age": "4-6 Years"},
    {"vaccine_name": "Varicella (2nd dose)", "age": "4-6 Years"},
    {"vaccine_name": "MMR (3rd dose)", "age": "4-6 Years"},
    {"vaccine_name": "HPV (1st dose)", "age": "9-14 Years"},
    {"vaccine_name": "HPV (2nd dose)", "age": "9-14 Years"},
    {"vaccine_name": "Tdap/Td booster", "age": "10-12 Years"},
    {"vaccine_name": "Tdap/Td booster", "age": "16-18 Years"}
]


async def populate_vaccinations():
    for item in vaccination_list:
        # Create an instance of the Vaccinations model
        # The vaccine_id, created_at, and updated_at fields will be handled automatically
        try:
            # Check if a vaccination with the same vaccine_name already exists
            existing_vaccination = await Vaccinations.filter(
                vaccine_name=item["vaccine_name"]
            ).first()

            if existing_vaccination:
                print(f"Skipped (already exists): {item['vaccine_name']}")
            else:
                # Create an instance of the Vaccinations model
                vaccination_entry = Vaccinations(
                    vaccine_name=item["vaccine_name"],
                    age=item["age"]
                )
                # Save the instance to the database
                await vaccination_entry.save()
                print(f"Inserted: {item['vaccine_name']}")
        except Exception as e:  # It's better to catch specific exceptions if possible
            print(f"Error processing vaccination '{item.get('vaccine_name', 'Unknown')}': {e}")
            pass

    print("Vaccination data population complete.")


