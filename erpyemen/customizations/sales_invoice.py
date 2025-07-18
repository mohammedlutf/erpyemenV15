import frappe
from frappe import _

@frappe.whitelist()
def get_items_uoms(doctype, txt, searchfield, start, page_len, filters):
	  uoms = frappe.get_all(
				"UOM Conversion Detail",
				fields='uom',
				filters={"parent": filters['parent']},
				limit_start=start,
				limit_page_length=page_len,
				as_list=True
			)
	  return uoms

def validate_selling_price(doc, method):
    for row in doc.items:
        if not row.item_code or not row.rate:
            continue

        item = frappe.get_cached_doc("Item", row.item_code)
        last_purchase_rate = item.get("last_purchase_rate") or 0

        # Get conversion factor from stock UOM to row.uom
        try:
            conversion_data = frappe.get_cached_value(
                "UOM Conversion Detail",
                {
                    "parent": row.item_code,
                    "uom": row.uom
                },
                "conversion_factor"
            )
            conversion_factor = float(conversion_data)
        except Exception:
            # fallback: if no conversion defined, assume 1.0
            conversion_factor = 1.0

        # Adjust last_purchase_rate to match invoice UOM
        adjusted_last_purchase_rate = last_purchase_rate * conversion_factor

        if row.rate < adjusted_last_purchase_rate:
            frappe.msgprint(
                title=_("Selling Price Notice"),
                msg=_(
                    "Row #{0}: Selling rate for item <b>{1}</b> is lower than its last purchase rate. "
                    "Selling net rate should be at least {2} (in UOM <b>{3}</b>)."
                ).format(
                    row.idx,
                    row.item_code,
                    frappe.utils.fmt_money(adjusted_last_purchase_rate),
                    row.uom
                ),
                indicator="orange"
            )
