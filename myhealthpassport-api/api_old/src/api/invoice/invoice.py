from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.templating import Jinja2Templates
from weasyprint import HTML
from pathlib import Path
from . import router
from num2words import num2words 


# Path to your templates folder
templates = Jinja2Templates(directory="templates")

@router.get("/download-invoice")
async def generate_invoice(request: Request):
    # Sample data
    company = {
        "address_line": "MG Road",
        "city": "Mumbai",
        "country": "India",
        "postal_code": "400001",
        "tax_id": "GST12345",
        "phone": "+91 9876543210",
        "email": "info@company.com",
    }

    billing_to = {
        "name": "Ravi Kumar",
        "address_line": "HSR Layout",
        "city": "Bangalore",
        "country": "India",
        "postal_code": "560102",
        "phone": "+91 9999999999",
    }

    items = [
        {"description": "Consultation", "qty": 2, "rate": 500, "amount": 1000},
        {"description": "Report Charge", "qty": 1, "rate": 2000, "amount": 2000},
    ]

    subtotal = sum(item["amount"] for item in items)
    tax = subtotal * 0.10  # 10%
    total = subtotal + tax

    # Convert total to words
    amount_words = num2words(total, lang="en_IN")
    amount_words = amount_words.replace(",", "")  # ✅ remove comma
    amount_words = amount_words.title()
    amount_words = amount_words.replace("rupees", "Rupees").replace("paise", "Paise")

    context = {
            "request": request,
            "company": company,
            "billing_to": billing_to,
            "due_date": "2025-01-20",
            "invoice_date": "2025-01-19",
            "invoice_number": "INV-0045",
            "reference": "Health-Report",
            "items": items,
            "subtotal": subtotal,
            "tax": tax,
            "total": round(total, 2),
            "amount_words": amount_words,  # ✅ PASS THIS
        }
    
    html_content = templates.get_template("invoice.html").render(context)

    # Generate PDF using WeasyPrint
    output_pdf = Path("invoice.pdf")
    HTML(string=html_content, base_url=".").write_pdf(output_pdf)

    return FileResponse(output_pdf, media_type="application/pdf", filename="invoice.pdf")