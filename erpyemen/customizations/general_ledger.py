from erpnext.accounts.report.general_ledger.general_ledger import execute as gl_execute
from frappe import _

def execute(filters=None):
    columns, data, message, chart = gl_execute(filters)
    
    translations = {
        "Sales Invoice": _("فاتورة مبيعات"),
        "Purchase Invoice": _("فاتورة مشتريات"),
        "Journal Entry": _("قيد يومية"),
        "Payment Entry": _("سند صرف / قبض"),
        "Stock Entry": _("قيد مخزون"),
        "Delivery Note": _("إشعار تسليم"),
        "Purchase Receipt": _("إشعار استلام"),
        "Expense Claim": _("مصاريف"),
    }

    for row in data:
        print("=========================================")
        print(row)
        if row.get("voucher_type") in translations:
            row["voucher_type"] = translations[row["voucher_type"]]
        
        if row.get("voucher_subtype") in translations:
            row["voucher_subtype"] = translations[row["voucher_subtype"]]

    return columns, data, message, chart