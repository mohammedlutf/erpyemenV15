import frappe
from frappe.utils import flt, getdate

def execute(filters=None):
	# Define columns with their labels, fieldtypes, and widths as per the user's SQL query
	columns = [
		{"fieldname": "posting_date", "label": "Posting Date", "fieldtype": "Date", "width": 120},
		{"fieldname": "name", "label": "ID", "fieldtype": "Link", "options": "Share Transfer", "width": 150},
		{"fieldname": "to_shareholder", "label": "Shareholder", "fieldtype": "Link", "options": "Shareholder", "width": 150},
		{"fieldname": "shareholder_title", "label": "Shareholder Title", "fieldtype": "Data", "width": 150},
		{"fieldname": "transfer_type", "label": "Transfer Type", "fieldtype": "Data", "width": 120},
		{"fieldname": "no_of_shares", "label": "No of Shares", "fieldtype": "Int", "width": 120},
		{"fieldname": "rate", "label": "Rate", "fieldtype": "Currency", "width": 100},
		{"fieldname": "amount", "label": "Amount", "fieldtype": "Currency", "width": 100},
	]

	# Build the SQL query
	conditions = ["st.docstatus = 1"]
	if filters and filters.get("shareholder"):
		conditions.append("st.to_shareholder = %(shareholder)s")
	
	# Combine conditions with AND
	where_clause = "WHERE " + " AND ".join(conditions)

	# The main SQL query
	sql_query = f"""
		SELECT
			st.date AS posting_date,
			st.name AS name,
			st.to_shareholder AS to_shareholder,
			sh.title AS shareholder_title,
			st.transfer_type AS transfer_type,
			st.no_of_shares AS no_of_shares,
			st.rate AS rate,
			st.amount AS amount
		FROM
			`tabShare Transfer` st
		LEFT JOIN
			`tabShareholder` sh ON sh.name = st.to_shareholder
		{where_clause}
		ORDER BY
			st.creation DESC
	"""
	
	# Execute the query with filters passed as arguments
	data = frappe.db.sql(sql_query, filters, as_dict=True)
	
	# Return columns and data for the report
	return columns, data
