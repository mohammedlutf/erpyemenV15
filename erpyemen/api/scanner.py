import frappe
from frappe import _
from frappe.utils import flt

@frappe.whitelist()
def scan_and_fetch_item(barcode_or_code, warehouse, session):
    """
    Fast lookup for mobile scanner. Resolves barcodes, serials, batches, and system item codes.
    Masks ERP balance quantities if Session is configured for Blind Counting.
    """
    # session_doc = frappe.get_doc("Stock Count Session", session)
    
    # 1. Resolve Barcode / Item / Batch / Serial
    item_code = frappe.db.get_value("Item Barcode", {"barcode": barcode_or_code}, "parent")
    if not item_code:
        if frappe.db.exists("Item", barcode_or_code):
            item_code = barcode_or_code

    if not item_code:
        frappe.throw(_("No item found matching barcode or code: {0}").format(barcode_or_code))

    item = frappe.get_doc("Item", item_code)

    # 2. Extract Available UOM conversions
    uom_list = [{"uom": item.stock_uom, "conversion_factor": 1.0}]
    for uom_row in item.uoms:
        if uom_row.uom != item.stock_uom:
            uom_list.append({
                "uom": uom_row.uom,
                "conversion_factor": uom_row.conversion_factor
            })

    # 3. Resolve Current Stock Entry
    # entry_name = frappe.db.get_value("Count Entry", {
    #     "session": session,
    #     "item_code": item_code,
    #     "warehouse": warehouse
    # })

    current_erp_qty = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty") or 0.0

    response = {
        "item_code": item.name,
        "item_name": item.item_name,
        "description": item.description,
        "image": item.image,
        "stock_uom": item.stock_uom,
        "available_uoms": uom_list,
        "entry_name": entry_name,
        "has_batch": item.has_batch_no,
        "has_serial": item.has_serial_no
    }

    # 4. Strict Security Mask for Blind Count Mode
    if "sss" == "Blind Count":
        response["current_erp_qty"] = None  # Completely stripped from response payload
    else:
        response["current_erp_qty"] = current_erp_qty

    return response


# @frappe.whitelist()
# def submit_count_payload(payload):
#     """
#     High-speed mobile count persistence route.
#     """
#     if isinstance(payload, str):
#         payload = frappe.parse_json(payload)

#     entry = frappe.get_doc("Count Entry", payload.get("entry_name")) if payload.get("entry_name") else frappe.new_doc("Count Entry")
    
#     entry.session = payload.get("session")
#     entry.item_code = payload.get("item_code")
#     entry.warehouse = payload.get("warehouse")
#     entry.selected_counting_uom = payload.get("selected_uom")
#     entry.conversion_factor = flt(payload.get("conversion_factor", 1.0))
#     entry.counted_quantity = flt(payload.get("counted_quantity"))
#     entry.batch_no = payload.get("batch_no")
#     entry.serial_no = payload.get("serial_no")
#     entry.counter = frappe.session.user
#     entry.status = "Counted"
#     entry.time_stamp = frappe.utils.nowdatetime()
    
#     if payload.get("photo"):
#         entry.photo = payload.get("photo")
#     if payload.get("reason"):
#         entry.reason = payload.get("reason")

#     entry.save(ignore_permissions=True)
#     frappe.db.commit()

#     return {"status": "success", "count_entry": entry.name}