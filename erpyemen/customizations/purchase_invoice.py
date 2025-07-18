import frappe

def update_item_expiry(doc, method):
    for row in doc.items:
        if row.expiry_date:
            frappe.db.set_value("Item", row.item_code, "end_of_life", row.expiry_date)

def update_item_prices(doc, method):
    for item in doc.items:
        if not item.item_code or not item.sales_price:
            continue

        price_list = "البيع القياسية"  # Change if you use a different price list

        existing_price = frappe.get_all("Item Price", filters={
            "item_code": item.item_code,
            "price_list": price_list,
            "selling": 1
        }, fields=["name"])

        if existing_price:
            # Update existing price
            ip_doc = frappe.get_doc("Item Price", existing_price[0].name)
            ip_doc.price_list_rate = item.sales_price
            ip_doc.save()
        else:
            # Create new selling price
            frappe.get_doc({
                "doctype": "Item Price",
                "item_code": item.item_code,
                "price_list": price_list,
                "price_list_rate": item.sales_price,
                "selling": 1
            }).insert()            