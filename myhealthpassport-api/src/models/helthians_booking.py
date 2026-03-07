from tortoise import fields
from tortoise.models import Model
from decimal import Decimal
from typing import List
import json
from enum import Enum
from datetime import datetime
from src.models.user_models import ConsultantRoles,ConsultantTeam  # Import the existing ConsultantRoles enum

class HealthiansTest(Model):
    """Individual test or parameter"""
    test_id = fields.BigIntField(pk=True)
    code = fields.CharField(max_length=50, unique=True)  # e.g., parameter_625
    name = fields.CharField(max_length=200)
    mrp = fields.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "healthians_tests"


class HealthiansPackage(Model):
    """Package (group of tests)"""
    package_id = fields.BigIntField(pk=True)
    health_id = fields.BigIntField(null=True, unique=True, index=True)
    code = fields.CharField(max_length=50, unique=True)  # e.g., package_119
    name = fields.CharField(max_length=200)
    mrp = fields.DecimalField(max_digits=10, decimal_places=2)
    discounted_price = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    test_codes = fields.JSONField(default=list)  # List of test codes
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "healthians_packages"


class HealthiansBooking(Model):
    """Main booking record"""
    booking_id = fields.BigIntField(pk=True)
    vendor_booking_id = fields.CharField(max_length=100, unique=True)
    student = fields.ForeignKeyField("models.Students", related_name="healthians_bookings")
    transaction = fields.ForeignKeyField("models.Transactions", null=True, on_delete=fields.SET_NULL)

    # Location & Zone
    zone_id = fields.CharField(max_length=10)
    latitude = fields.CharField(max_length=30)
    longitude = fields.CharField(max_length=30)
    zipcode = fields.CharField(max_length=10)
    address = fields.TextField()
    landmark = fields.CharField(max_length=200, null=True)

    # Slot
    slot_id = fields.CharField(max_length=50)
    slot_date = fields.DateField()
    slot_time = fields.TimeField()
    freeze_time = fields.DatetimeField(null=True)

    # Customer
    customer_name = fields.CharField(max_length=200)
    customer_mobile = fields.CharField(max_length=15)
    customer_email = fields.CharField(max_length=200, null=True)
    customer_gender = fields.CharField(max_length=1)  # M/F
    customer_age = fields.IntField()
    customer_dob = fields.CharField(max_length=10)  # DD/MM/YYYY

    # Pricing & Payment
    total_mrp = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_discounted = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = fields.CharField(max_length=20, default="pending")  # pending, paid, failed
    payment_mode = fields.CharField(max_length=20, default="prepaid")

    # Status
    booking_status = fields.CharField(max_length=20, default="pending")  # pending, confirmed, collected, reported, cancelled
    phlebo_number = fields.CharField(max_length=15, null=True)
    phlebo_name = fields.CharField(max_length=100, null=True)
    report_url = fields.CharField(max_length=500, null=True)

    # Healthians Response
    healthians_response = fields.JSONField(null=True)
    healthians_booking_id = fields.CharField(max_length=50, null=True)
    
    vendor_billing_user_id = fields.CharField(max_length=100, null=True, description="Same as used in createBooking")
    vendor_customer_id = fields.CharField(max_length=100, null=True, description="CUxxx or mobile-based ID")
    
    # Audit
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    created_by = fields.BigIntField()
    created_user_role = fields.CharField(max_length=50)

    class Meta:
        table = "healthians_bookings"


class HealthiansBookingTest(Model):
    """Link booking ↔ tests/packages"""
    id = fields.BigIntField(pk=True)
    booking = fields.ForeignKeyField("models.HealthiansBooking", related_name="booking_tests")
    test = fields.ForeignKeyField("models.HealthiansTest", null=True, on_delete=fields.SET_NULL)
    package = fields.ForeignKeyField("models.HealthiansPackage", null=True, on_delete=fields.SET_NULL)
    code = fields.CharField(max_length=50)  # Redundant for search
    price_mrp = fields.DecimalField(max_digits=10, decimal_places=2)
    price_discounted = fields.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        table = "healthians_booking_tests"


class SchoolHealthiansPackage(Model):
    id = fields.BigIntField(pk=True)
    school = fields.ForeignKeyField("models.Schools", related_name="selected_packages")
    package = fields.ForeignKeyField("models.HealthiansPackage", related_name="selected_schools")
    # ← NEW FIELDS (safe to add)
    custom_name = fields.CharField(max_length=300, null=True)
    custom_price = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_active = fields.BooleanField(default=True)
    
    created_at = fields.DatetimeField(auto_now_add=True)
    created_by = fields.BigIntField(null=True)

    class Meta:
        table = "school_healthians_packages"
        unique_together = (("school", "package"),)
          