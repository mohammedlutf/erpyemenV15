import frappe

def after_insert(doc,method):
    if doc.has_batch_no and doc.voucher_type == "Purchase Invoice":
        item = frappe.get_doc(
            "Purchase Invoice Item",
            doc.voucher_detail_no,
            )   
        if item.expiry_date:
            for entry in doc.entries:
                frappe.db.set_value("Batch",entry.batch_no,"expiry_date",item.expiry_date)
    
             
            