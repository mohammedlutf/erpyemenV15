// Copyright (c) 2025, mohammed lutf and contributors
// For license information, please see license.txt

frappe.query_reports["Shareholder Report"] = {
	"filters": [
			{
            "fieldname": "shareholder",
            "label": __("Shareholder"),
            "fieldtype": "Link",
            "options": "Shareholder",
        	}
	]
};
