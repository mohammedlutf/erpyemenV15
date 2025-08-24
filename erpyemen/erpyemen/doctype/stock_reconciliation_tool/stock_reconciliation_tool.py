# Copyright (c) 2025, mohammed lutf and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe
from frappe import _, bold, json, msgprint
from frappe.query_builder.functions import CombineDatetime, Sum
from frappe.utils import add_to_date, cint, cstr, flt, get_datetime
from erpnext.stock.doctype.batch.batch import get_available_batches, get_batch_qty
import erpnext
from erpnext.stock.utils import get_incoming_rate, get_stock_balance
class StockReconciliationTool(Document):
	pass

@frappe.whitelist()
def get_stock_balance_for(
	item_code: str,
	warehouse: str,
	posting_date,
	posting_time,
	batch_no: str | None = None,
	with_valuation_rate: bool = True,
	inventory_dimensions_dict=None,
	row=None,
	company=None,
):
	frappe.has_permission("Stock Reconciliation", "write", throw=True)

	item_dict = frappe.get_cached_value("Item", item_code, ["has_serial_no", "has_batch_no"], as_dict=1)

	if isinstance(row, str):
		row = json.loads(row)

	if isinstance(row, dict):
		row = frappe._dict(row)

	if not item_dict:
		# In cases of data upload to Items table
		msg = _("Item {} does not exist.").format(item_code)
		frappe.throw(msg, title=_("Missing"))

	serial_nos = None
	has_serial_no = bool(item_dict.get("has_serial_no"))
	has_batch_no = bool(item_dict.get("has_batch_no"))

	use_serial_batch_fields = frappe.db.get_single_value("Stock Settings", "use_serial_batch_fields")

	if not batch_no and has_batch_no:
		# Not enough information to fetch data
		return {
			"qty": 0,
			"rate": 0,
			"serial_nos": None,
			"use_serial_batch_fields": row.use_serial_batch_fields if row else use_serial_batch_fields,
		}

	# TODO: fetch only selected batch's values
	data = get_stock_balance(
		item_code,
		warehouse,
		posting_date,
		posting_time,
		with_valuation_rate=with_valuation_rate,
		with_serial_no=has_serial_no,
		inventory_dimensions_dict=inventory_dimensions_dict,
	)

	if has_serial_no:
		qty, rate, serial_nos = data
	else:
		qty, rate = data

	if item_dict.get("has_batch_no"):
		qty = (
			get_batch_qty(
				batch_no,
				warehouse,
				posting_date=posting_date,
				posting_time=posting_time,
				for_stock_levels=True,
				consider_negative_batches=True,
			)
			or 0
		)
		if row.use_serial_batch_fields and row.batch_no and (qty or row.current_qty):
			rate = get_incoming_rate(
				frappe._dict(
					{
						"item_code": row.item_code,
						"warehouse": row.warehouse,
						"qty": flt(qty or row.current_qty) * -1,
						"batch_no": row.batch_no,
						"company": company,
						"posting_date": posting_date,
						"posting_time": posting_time,
					}
				)
			)
	stock_uom = frappe.db.get_value('Item', {'item_code':item_code}, 'stock_uom')

	return {
		"qty": qty,
		"rate": rate,
		"serial_nos": serial_nos,
		"use_serial_batch_fields": row.use_serial_batch_fields if row else use_serial_batch_fields,
		"stock_uom":stock_uom,
	}

@frappe.whitelist()
def get_items_conversion_factor(parent,uom):
	
	conversion_factor = frappe.get_value("UOM Conversion Detail",{"parent": parent,"uom":uom},'conversion_factor',)
	rate = frappe.get_value("Item", parent, "valuation_rate") or frappe.get_value("Item", parent, "last_purchase_rate") or 0
	print(rate)
	return {"conversion_factor":conversion_factor,"valuation_rate":rate}


@frappe.whitelist()
def print_items_by_warehouse(options):
	if isinstance(options, str):
		options = json.loads(options)

	options = frappe._dict(options)

	warehouse = options.get("warehouse")
	with_stock_only = options.get("with_stock_only")
	show_item_name = options.get("show_item_name")
	show_stock_qty = options.get("show_stock_qty")
	show_valuation_rate = options.get("show_valuation_rate")
	note = options.get("note")

	item_codes = []
	item_map = {}

	if with_stock_only:
		# Get only items with stock in selected warehouse
		bin_data = frappe.get_all("Bin",
			filters={"warehouse": warehouse, "actual_qty": ["!=", 0]},
			fields=["item_code", "actual_qty"]
		)
		item_codes = [row.item_code for row in bin_data]
		item_map = {row.item_code: row.actual_qty for row in bin_data}

	else:
		# Get all enabled items
		all_items = frappe.get_all("Item",
			filters={"disabled": 0},
			fields=["item_code"]
		)
		item_codes = [item.item_code for item in all_items]

		if show_stock_qty:
			# Get stock qty for these items in the selected warehouse (if available)
			bin_data = frappe.get_all("Bin",
				filters={"warehouse": warehouse, "item_code": ["in", item_codes]},
				fields=["item_code", "actual_qty"]
			)
			item_map = {row.item_code: row.actual_qty for row in bin_data}

	# Build headers
	headers = "<th>{}</th>".format(_("Item Code"))
	headers += "<th>{}</th>".format(_("Item Name"))
	headers += "<th>{}</th>".format(_("Stock Qty"))
	headers += "<th>{}</th>".format(_("Valuation Rate"))
	headers += "<th>{}</th>".format(_("Notes"))

	# Table rows
	table_rows = ""
	for item_code in item_codes:
		item_doc = frappe.get_doc("Item", item_code)

		item_name = item_doc.item_name if show_item_name else ""
		stock_qty = item_map.get(item_code, "") if show_stock_qty else ""
		valuation_rate = frappe.get_value("Item", item_code, "last_purchase_rate") if show_valuation_rate else ""

		row = f"<tr><td>{item_code}</td>"
		row += f"<td>{item_name}</td>"
		row += f"<td>{stock_qty}</td>"
		row += f"<td>{valuation_rate}</td>"
		row += "<td></td></tr>"  # Notes column blank
		table_rows += row

	# Final HTML
	html = f"""
	<div style="text-align:center;">
		<h2>{_('Stock Report')}</h2>
		<p>{frappe.utils.escape_html(note or '')}</p>
	</div>
	<table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
		<thead><tr>{headers}</tr></thead>
		<tbody>{table_rows}</tbody>
	</table>
	"""

	return html



# #this funchion for the original stock reconciliation
# @frappe.whitelist()
# def get_tool_items(tool_name,get_all_other_items):
# 	get_all_other_items = frappe.utils.cint(get_all_other_items)
# 	tool = frappe.get_doc("Stock Reconciliation Tool", tool_name)
# 	combined_items = {}
# 	for row in tool.items:
# 		item = frappe.get_doc("Item", row.item_code)
# 		stock_uom = item.stock_uom

# 		if row.uom != stock_uom:
# 			conversion = frappe.db.get_value(
# 				"UOM Conversion Detail",
# 				{"parent": row.item_code, "uom": row.uom},
# 				"conversion_factor"
# 			) or 1
# 		else:
# 			conversion = 1

# 		qty_in_stock_uom = row.qty if row.uom == stock_uom else row.qty * conversion
# 		valuation_rate_in_stock_uom = row.valuation_rate if row.uom == stock_uom else row.valuation_rate / conversion
# 		# If batch_no and serial_no are empty → combine
# 		print(row.batch_no)
# 		if not row.batch_no and not row.serial_no:
# 			if row.item_code not in combined_items:
# 				combined_items[row.item_code] = {
# 					"item_code": row.item_code,
# 					"qty": 0,
# 					"uom": stock_uom,
# 					"warehouse": row.warehouse,
# 					"valuation_rate": valuation_rate_in_stock_uom
# 				}
# 			combined_items[row.item_code]["qty"] += qty_in_stock_uom
# 		else:
# 			# Keep batch/serial items separate
# 			combined_items[f"{row.item_code}_{row.batch_no or row.serial_no}"] = {
# 				"item_code": row.item_code,
# 				"qty": qty_in_stock_uom,
# 				"uom": stock_uom,
# 				"warehouse": row.warehouse,
# 				"batch_no": row.batch_no or '',
# 				"serial_no": row.serial_no or '',
# 				"valuation_rate": valuation_rate_in_stock_uom
# 			}
# 		print(combined_items)	
# 		# Step 2: Get other stock items if requested
# 	if get_all_other_items:
# 		existing_item_codes = {v["item_code"] for v in combined_items.values()}

# 		bins = frappe.get_all(
# 			"Bin",
# 			filters={"actual_qty": ("!=", 0)},
# 			fields=["item_code", "warehouse", "actual_qty"]
# 		)

# 		for b in bins:
# 			if b.item_code not in existing_item_codes:
# 				stock_uom = frappe.db.get_value("Item", b.item_code, "stock_uom")
# 				valuation_rate = frappe.db.get_value(
# 					"Bin",
# 					{"item_code": b.item_code, "warehouse": b.warehouse},
# 					"valuation_rate"
# 				) or 0

# 				combined_items[b.item_code] = {
# 					"item_code": b.item_code,
# 					"qty": b.actual_qty,
# 					"uom": stock_uom,
# 					"warehouse": b.warehouse,
# 					"use_serial_batch_fields": True,
# 					"valuation_rate": valuation_rate
# 				}
# 	return list(combined_items.values())

# @frappe.whitelist()
# def get_tool_items(tool_name, get_all_other_items):
# 	get_all_other_items = frappe.utils.cint(get_all_other_items)
# 	tool = frappe.get_doc("Stock Reconciliation Tool", tool_name)
# 	combined_items = {}

# 	for row in tool.items:
# 		item = frappe.get_doc("Item", row.item_code)
# 		stock_uom = item.stock_uom

# 		# Conversion factor handling
# 		if row.uom != stock_uom:
# 			conversion = frappe.db.get_value(
# 				"UOM Conversion Detail",
# 				{"parent": row.item_code, "uom": row.uom},
# 				"conversion_factor"
# 			) or 1
# 		else:
# 			conversion = 1

# 		qty_in_stock_uom = row.qty if row.uom == stock_uom else row.qty * conversion
# 		valuation_rate_in_stock_uom = (
# 			row.valuation_rate if row.uom == stock_uom else row.valuation_rate / conversion
# 		)

# 		# Unique key: consider batch_no, serial_no, warehouse
# 		if not row.batch_no and not row.serial_no:
# 			key = f"{row.item_code}_{row.warehouse}"
# 		else:
# 			key = f"{row.item_code}_{row.batch_no or row.serial_no}_{row.warehouse}"

# 		if key not in combined_items:
# 			combined_items[key] = {
# 				"item_code": row.item_code,
# 				"qty": 0,
# 				"uom": stock_uom,
# 				"warehouse": row.warehouse,
# 				"batch_no": row.batch_no or '',
# 				"serial_no": row.serial_no or '',
# 				"valuation_rate": valuation_rate_in_stock_uom
# 			}

# 		# Add up qty
# 		combined_items[key]["qty"] += qty_in_stock_uom

# 	# Step 2: Get other stock items if requested
# 	if get_all_other_items:
# 		existing_item_codes = {v["item_code"] for v in combined_items.values()}

# 		bins = frappe.get_all(
# 			"Bin",
# 			filters={"actual_qty": (">", 0)},
# 			fields=["item_code", "warehouse", "actual_qty", "valuation_rate"]
# 		)

# 		for b in bins:
# 			if b.item_code not in existing_item_codes:
# 				stock_uom = frappe.db.get_value("Item", b.item_code, "stock_uom")

# 				key = f"{b.item_code}_{b.warehouse}"
# 				if key not in combined_items:
# 					combined_items[key] = {
# 						"item_code": b.item_code,
# 						"qty": b.actual_qty,
# 						"uom": stock_uom,
# 						"warehouse": b.warehouse,
# 						"use_serial_batch_fields": True,
# 						"valuation_rate": b.valuation_rate or 0
# 					}
# 				else:
# 					# If same item & warehouse exists → add up qty
# 					combined_items[key]["qty"] += b.actual_qty

# 	return list(combined_items.values())


# This function for the original stock reconciliation
@frappe.whitelist()
def get_tool_items(tool_name, get_all_other_items,get_all_other_items_with_zero_qty):
	get_all_other_items = frappe.utils.cint(get_all_other_items)
	get_all_other_items_with_zero_qty = frappe.utils.cint(get_all_other_items_with_zero_qty)
	tool = frappe.get_doc("Stock Reconciliation Tool", tool_name)
	combined_items = {}

	for row in tool.items:
		# Conversion factor handling
		if row.uom != row.stock_uom:
			conversion = row.conversion_factor
		else:
			conversion = 1

		qty_in_stock_uom = row.qty if row.uom == row.stock_uom else row.qty * conversion
		valuation_rate_in_stock_uom = (
			row.valuation_rate if row.uom == row.stock_uom else row.valuation_rate / conversion
		)

		# Unique key: consider batch_no, serial_no, warehouse
		if not row.batch_no and not row.serial_no:
			key = f"{row.item_code}_{row.warehouse}"
		else:
			key = f"{row.item_code}_{row.batch_no or row.serial_no}_{row.warehouse}"

		if key not in combined_items:
			combined_items[key] = {
				"item_code": row.item_code,
				"qty": 0,
				"uom": row.stock_uom,
				"warehouse": row.warehouse,
				"batch_no": row.batch_no or '',
				"serial_no": row.serial_no or '',
				"valuation_rate": valuation_rate_in_stock_uom
			}

		# Add up qty
		combined_items[key]["qty"] += qty_in_stock_uom

	# Step 2: Get other stock items if requested
	if get_all_other_items:
		existing_item_codes = {v["item_code"] for v in combined_items.values()}
		existing_item_batches = {
			(v["item_code"], v.get("batch_no", ""), v["warehouse"])
			for v in combined_items.values()
		}

		bins = frappe.get_all(
			"Bin",
			filters={"actual_qty": ("!=", 0)},
			fields=["item_code", "warehouse", "actual_qty", "valuation_rate"]
		)

		for b in bins:
			item = frappe.get_doc("Item", b.item_code)
			stock_uom = item.stock_uom

			if item.has_batch_no:
				# Get all batches separately
				batches = frappe.get_all(
					"Batch",
					filters={"item": b.item_code},
					fields=["name","batch_qty"]
				)
				for batch in batches:
					batch_qty = batch['batch_qty']

					if batch_qty != 0:
						key = f"{b.item_code}_{batch.name}_{b.warehouse}"
						# Only add if this batch is not already in combined_items
						if (b.item_code, batch.name, b.warehouse) not in existing_item_batches:
							if get_all_other_items_with_zero_qty:
								qtyy = 0
							else:
								qtyy = batch_qty
							combined_items[key] = {
								"item_code": b.item_code,
								"qty": qtyy,
								"uom": stock_uom,
								"warehouse": b.warehouse,
								"batch_no": batch.name,
								"valuation_rate": b.valuation_rate or 0
							}

			else:
				# Normal item (non-batch)
				key = f"{b.item_code}_{b.warehouse}"
				if get_all_other_items_with_zero_qty:
					qty = 0
				else:
					qty = b.actual_qty	
				if key not in combined_items:
					combined_items[key] = {
						"item_code": b.item_code,
						"qty": qty,
						"uom": stock_uom,
						"warehouse": b.warehouse,
						"use_serial_batch_fields": True,
						"valuation_rate": b.valuation_rate or 0
					}
				

	return list(combined_items.values())