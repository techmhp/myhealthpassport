from datetime import date as py_date  # For age calculation


def calculate_age_string(born_date: py_date) -> str:
    """Helper function to calculate age as a string from a birth date."""
    if not born_date:
        return "" # Or some other placeholder if dob is not set
    today = py_date.today()
    age = today.year - born_date.year - ((today.month, today.day) < (born_date.month, born_date.day))
    return str(age)
