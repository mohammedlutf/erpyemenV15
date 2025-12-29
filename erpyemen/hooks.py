app_name = "erpyemen"
app_title = "erpyemen"
app_publisher = "mohammed lutf"
app_description = "add my customization"
app_email = "m.lutfdalal@gmail.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "erpyemen",
# 		"logo": "/assets/erpyemen/logo.png",
# 		"title": "erpyemen",
# 		"route": "/erpyemen",
# 		"has_permission": "erpyemen.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/erpyemen/css/erpyemen.css"
# app_include_js = "/assets/erpyemen/js/erpyemen.js"

# include js, css files in header of web template
# web_include_css = "/assets/erpyemen/css/erpyemen.css"
# web_include_js = "/assets/erpyemen/js/erpyemen.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "erpyemen/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Sales Invoice": "customizations/sales_invoice.js",
    "Purchase Invoice": "customizations/purchase_invoice.js",
    "Item": "customizations/item.js",
    "Payment Entry": "customizations/payment_entry.js",
    "Stock Reconciliation": "customizations/stock_reconciliation.js",
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "erpyemen/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "erpyemen.utils.jinja_methods",
# 	"filters": "erpyemen.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "erpyemen.install.before_install"
# after_install = "erpyemen.install.after_install"
after_install = "erpyemen.setup.setup_party_type.add_account_party_type"

# Uninstallation
# ------------

# before_uninstall = "erpyemen.uninstall.before_uninstall"
# after_uninstall = "erpyemen.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "erpyemen.utils.before_app_install"
# after_app_install = "erpyemen.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "erpyemen.utils.before_app_uninstall"
# after_app_uninstall = "erpyemen.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "erpyemen.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }
override_report = {
    "General Ledger": "erpyemen.customizations.general_ledger"
}
doc_events = {
    "Purchase Invoice": {
        "on_submit": ["erpyemen.customizations.purchase_invoice.update_item_expiry",
                        "erpyemen.customizations.purchase_invoice.update_item_prices",
                        
        ],
    },
    "Sales Invoice": {
        "validate": "erpyemen.customizations.sales_invoice.validate_selling_price"
    },
    "Serial and Batch Bundle":{
        "after_insert":"erpyemen.customizations.serial_and_batch_bundle.after_insert"
    },
}
# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"erpyemen.tasks.all"
# 	],
# 	"daily": [
# 		"erpyemen.tasks.daily"
# 	],
# 	"hourly": [
# 		"erpyemen.tasks.hourly"
# 	],
# 	"weekly": [
# 		"erpyemen.tasks.weekly"
# 	],
# 	"monthly": [
# 		"erpyemen.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "erpyemen.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "erpyemen.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "erpyemen.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["erpyemen.utils.before_request"]
# after_request = ["erpyemen.utils.after_request"]

# Job Events
# ----------
# before_job = ["erpyemen.utils.before_job"]
# after_job = ["erpyemen.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"erpyemen.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

fixtures = [
    {
        "dt": "Custom Field",
        "filters": [["fieldname",
         "in", (
            "expiry_date",
            "sales_price",
         )]]
    },
    {"dt": "Property Setter", "filters": [["doc_type", 
    "in", (
        "Purchase Invoice Item",
        "Purchase Invoice",
        "Sales Invoice",
    
    
    )]]},
    
]
