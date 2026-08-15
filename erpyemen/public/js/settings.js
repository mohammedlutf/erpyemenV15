/* AuTech Theme - Settings Manager */

class AuTechThemeSettings {
    constructor() {
        this.panel = null;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        // Add settings button to navbar
        this.addSettingsButton();
        this.initialized = true;
    }
    
    addSettingsButton() {
        const navbar = document.querySelector('.autech-navbar');
        if (!navbar) return;
        
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'navbar-btn settings-btn';
        settingsBtn.innerHTML = '<i class="fa fa-cog"></i>';
        settingsBtn.title = 'Theme Settings';
        settingsBtn.setAttribute('data-theme-settings', 'toggle');
        
        settingsBtn.addEventListener('click', () => {
            this.openSettingsPanel();
        });
        
        const navbarRight = navbar.querySelector('.autech-navbar-right') || 
                           navbar.querySelector('.navbar-right') ||
                           navbar;
        navbarRight.appendChild(settingsBtn);
    }
    
    openSettingsPanel() {
        // Check if settings dialog already exists
        if (this.panel) {
            this.panel.show();
            return;
        }
        
        // Create settings panel
        this.createSettingsPanel();
    }
    
    createSettingsPanel() {
        const theme = window._autechTheme;
        if (!theme) return;
        
        const settings = theme.settings;
        
        // Create dialog
        this.panel = new frappe.ui.Dialog({
            title: 'Theme Settings',
            fields: [
                {
                    fieldname: 'theme_section',
                    label: 'Theme Options',
                    fieldtype: 'Section Break'
                },
                {
                    fieldname: 'primary_color',
                    label: 'Primary Color',
                    fieldtype: 'Color',
                    default: settings.primary_color || '#1a73e8'
                },
                {
                    fieldname: 'secondary_color',
                    label: 'Secondary Color',
                    fieldtype: 'Color',
                    default: settings.secondary_color || '#6c757d'
                },
                {
                    fieldname: 'accent_color',
                    label: 'Accent Color',
                    fieldtype: 'Color',
                    default: settings.accent_color || '#28a745'
                },
                {
                    fieldname: 'sidebar_color',
                    label: 'Sidebar Color',
                    fieldtype: 'Color',
                    default: settings.sidebar_color || '#ffffff'
                },
                {
                    fieldname: 'navbar_color',
                    label: 'Navbar Color',
                    fieldtype: 'Color',
                    default: settings.navbar_color || '#ffffff'
                },
                {
                    fieldname: 'background_color',
                    label: 'Background Color',
                    fieldtype: 'Color',
                    default: settings.background_color || '#f8f9fa'
                },
                {
                    fieldname: 'font_section',
                    label: 'Typography',
                    fieldtype: 'Section Break'
                },
                {
                    fieldname: 'font_family_ar',
                    label: 'Arabic Font',
                    fieldtype: 'Select',
                    options: ['Cairo', 'Inter', 'Tajawal', 'System UI'],
                    default: settings.font_family_ar || 'Cairo'
                },
                {
                    fieldname: 'font_family_en',
                    label: 'English Font',
                    fieldtype: 'Select',
                    options: ['Inter', 'Cairo', 'Tajawal', 'System UI'],
                    default: settings.font_family_en || 'Inter'
                },
                {
                    fieldname: 'layout_section',
                    label: 'Layout',
                    fieldtype: 'Section Break'
                },
                {
                    fieldname: 'dark_mode',
                    label: 'Dark Mode',
                    fieldtype: 'Check',
                    default: settings.dark_mode || 0
                },
                {
                    fieldname: 'compact_mode',
                    label: 'Compact Mode',
                    fieldtype: 'Check',
                    default: settings.compact_mode || 0
                },
                {
                    fieldname: 'border_radius',
                    label: 'Border Radius',
                    fieldtype: 'Select',
                    options: ['0px', '4px', '8px', '12px', '16px', '20px'],
                    default: settings.border_radius || '8px'
                },
                {
                    fieldname: 'show_icons',
                    label: 'Show Icons in Menu',
                    fieldtype: 'Check',
                    default: settings.show_icons !== false
                },
                {
                    fieldname: 'show_labels',
                    label: 'Show Labels in Menu',
                    fieldtype: 'Check',
                    default: settings.show_labels !== false
                }
            ],
            primary_action: (data) => {
                this.saveSettings(data);
            },
            primary_action_label: 'Apply Settings'
        });
        
        // Show dialog
        this.panel.show();
    }
    
    saveSettings(data) {
        const theme = window._autechTheme;
        if (!theme) return;
        
        // Update theme settings
        const updates = {
            primary_color: data.primary_color,
            secondary_color: data.secondary_color,
            accent_color: data.accent_color,
            sidebar_color: data.sidebar_color,
            navbar_color: data.navbar_color,
            background_color: data.background_color,
            font_family_ar: data.font_family_ar,
            font_family_en: data.font_family_en,
            dark_mode: data.dark_mode,
            compact_mode: data.compact_mode,
            border_radius: data.border_radius,
            show_icons: data.show_icons,
            show_labels: data.show_labels
        };
        
        // Apply updates
        Object.assign(theme.settings, updates);
        theme.applyTheme();
        theme.updateUI();
        
        // Save preferences
        theme.savePreference('dark_mode', data.dark_mode);
        theme.savePreference('compact_mode', data.compact_mode);
        
        // Save to server
        frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'Autech Theme Settings',
                name: 'Autech Theme Settings',
                fieldname: updates,
                value: updates
            },
            callback: function(r) {
                frappe.msgprint('Theme settings applied successfully');
            },
            error: function(err) {
                frappe.msgprint('Error saving theme settings');
                console.error(err);
            }
        });
        
        // Close dialog
        if (this.panel) {
            this.panel.hide();
        }
    }
}

// Initialize settings when theme is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window._autechTheme) {
            const settings = new AuTechThemeSettings();
            window._autechThemeSettings = settings;
            settings.init();
        }
    }, 1000);
});