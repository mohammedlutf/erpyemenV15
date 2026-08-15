/* AuTech Theme - Core JavaScript */

class AuTechTheme {
    constructor() {
        this.settings = {};
        this.isRTL = false;
        this.language = 'en';
        this.initialized = false;
        this.DEBUG = false;
          console.log('🔵 AuTechTheme constructor called');
        // Bind methods
        this.init = this.init.bind(this);
        this.applyTheme = this.applyTheme.bind(this);
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.toggleDarkMode = this.toggleDarkMode.bind(this);
        this.switchLanguage = this.switchLanguage.bind(this);
        this.updateUI = this.updateUI.bind(this);
    }
    
    init() {
        if (this.initialized) return;
        
        this.log('Initializing AuTech Theme...');
        
        // Wait for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }
    
    _init() {
        this.log('DOM ready, loading theme...');
        
        // Load theme settings
        this.loadThemeSettings()
            .then(settings => {
                this.settings = settings;
                this.language = settings.language || 'en';
                this.isRTL = settings.is_rtl || false;
                
                // Apply theme
                this.applyTheme();
                
                // Setup UI
                this.setupUI();
                
                // Listen for language changes
                this.setupLanguageListener();
                
                this.initialized = true;
                this.log('Theme initialized successfully');
            })
            .catch(error => {
                this.error('Failed to load theme settings:', error);
                // Fallback to default
                this.applyDefaultTheme();
            });
    }
    
    log(...args) {
        if (this.DEBUG) {
            console.log('[AuTech Theme]', ...args);
        }
    }
    
    error(...args) {
        console.error('[AuTech Theme]', ...args);
    }
    
    loadThemeSettings() {
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'autech_theme.api.load_user_theme_settings',
                callback: function(r) {
                    if (r.message) {
                        resolve(r.message);
                    } else {
                        reject(new Error('No settings returned'));
                    }
                },
                error: function(err) {
                    reject(err);
                }
            });
        });
    }
    
    applyTheme() {
        const settings = this.settings;
        if (!settings.enabled) {
            this.log('Theme disabled, using default');
            return;
        }
        
        this.log('Applying theme...');
        
        // Set RTL/LTR
        this.setDirection();
        
        // Apply colors
        this.applyColors(settings);
        
        // Apply fonts
        this.applyFonts(settings);
        
        // Apply dark mode
        this.applyDarkMode(settings.dark_mode);
        
        // Apply layout
        this.applyLayout(settings);
        
        // Apply custom CSS
        this.applyCustomCSS(settings.custom_css);
        
        // Update UI
        this.updateUI();
    }
    
    setDirection() {
        const html = document.documentElement;
        const body = document.body;
        
        if (this.isRTL) {
            html.setAttribute('dir', 'rtl');
            body.setAttribute('dir', 'rtl');
            html.style.direction = 'rtl';
            body.style.direction = 'rtl';
        } else {
            html.setAttribute('dir', 'ltr');
            body.setAttribute('dir', 'ltr');
            html.style.direction = 'ltr';
            body.style.direction = 'ltr';
        }
        
        this.log('Direction set to:', this.isRTL ? 'RTL' : 'LTR');
    }
    
    applyColors(settings) {
        const root = document.documentElement;
        
        const colors = {
            '--primary': settings.primary_color || '#1a73e8',
            '--primary-hover': this.darkenColor(settings.primary_color || '#1a73e8', 20),
            '--secondary': settings.secondary_color || '#6c757d',
            '--accent': settings.accent_color || '#28a745',
            '--sidebar-bg': settings.sidebar_color || '#ffffff',
            '--sidebar-text': this.getTextColor(settings.sidebar_color || '#ffffff'),
            '--sidebar-active': settings.primary_color || '#1a73e8',
            '--navbar-bg': settings.navbar_color || '#ffffff',
            '--page-bg': settings.background_color || '#f8f9fa',
            '--card-bg': settings.navbar_color || '#ffffff',
            '--border-color': this.darkenColor(settings.background_color || '#f8f9fa', 15),
            '--text-color': this.getTextColor(settings.background_color || '#f8f9fa'),
            '--muted-text': this.darkenColor(this.getTextColor(settings.background_color || '#f8f9fa'), 30),
            '--border-radius': settings.border_radius || '8px'
        };
        
        Object.keys(colors).forEach(key => {
            root.style.setProperty(key, colors[key]);
        });
        
        this.log('Colors applied');
    }
    
    applyFonts(settings) {
        const root = document.documentElement;
        const isArabic = this.language === 'ar';
        
        let fontFamily = isArabic ? settings.font_family_ar : settings.font_family_en;
        
        // Map to Google Fonts
        let fontImport = '';
        let fontCSS = '';
        
        if (fontFamily === 'Cairo') {
            fontImport = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap';
            fontCSS = "'Cairo', 'Inter', sans-serif";
        } else if (fontFamily === 'Inter') {
            fontImport = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
            fontCSS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        } else if (fontFamily === 'Tajawal') {
            fontImport = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap';
            fontCSS = "'Tajawal', 'Inter', sans-serif";
        } else {
            fontCSS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        }
        
        // Load font if not already loaded
        if (fontImport) {
            this.loadFont(fontImport, fontFamily);
        }
        
        root.style.setProperty('--font-family', fontCSS);
        
        this.log('Font applied:', fontFamily);
    }
    
    loadFont(url, family) {
        // Check if already loaded
        const existing = document.querySelector(`link[href="${url}"]`);
        if (existing) return;
        
        // Add font link
        const link = document.createElement('link');
        link.href = url;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.media = 'all';
        document.head.appendChild(link);
        
        this.log('Font loaded:', family);
    }
    
    applyDarkMode(enabled) {
        const root = document.documentElement;
        
        if (enabled) {
            root.classList.add('dark-mode');
        } else {
            root.classList.remove('dark-mode');
        }
        
        this.log('Dark mode:', enabled ? 'ON' : 'OFF');
    }
    
    applyLayout(settings) {
        const sidebar = document.getElementById('autech-sidebar');
        if (!sidebar) return;
        
        // Apply collapsed state
        if (settings.sidebar_collapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        
        // Apply position (handled by RTL/LTR)
        // Compact mode
        if (settings.compact_mode) {
            document.body.classList.add('compact-mode');
        } else {
            document.body.classList.remove('compact-mode');
        }
        
        // Show/hide icons and labels
        if (!settings.show_icons) {
            document.body.classList.add('hide-menu-icons');
        } else {
            document.body.classList.remove('hide-menu-icons');
        }
        
        if (!settings.show_labels) {
            document.body.classList.add('hide-menu-labels');
        } else {
            document.body.classList.remove('hide-menu-labels');
        }
        
        this.log('Layout applied');
    }
    
    applyCustomCSS(css) {
        // Remove existing custom CSS
        const existing = document.getElementById('autech-custom-css');
        if (existing) {
            existing.remove();
        }
        
        if (css && css.trim()) {
            const style = document.createElement('style');
            style.id = 'autech-custom-css';
            style.textContent = css;
            document.head.appendChild(style);
            this.log('Custom CSS applied');
        }
    }
    
    setupUI() {
        // Build sidebar
        this.buildSidebar();
        
        // Build navbar
        this.buildNavbar();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    buildSidebar() {
        // Remove any existing sidebar
        const existing = document.getElementById('autech-sidebar');
        if (existing) existing.remove();
        
        // Remove overlay
        const existingOverlay = document.getElementById('autech-sidebar-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        // Get main content
        const mainContent = document.querySelector('.page-content') || 
                           document.querySelector('main') ||
                           document.querySelector('.desk-container') ||
                           document.body;
        
        if (!mainContent) {
            this.error('Main content container not found');
            return;
        }
        
        // Create sidebar
        const sidebar = document.createElement('aside');
        sidebar.id = 'autech-sidebar';
        sidebar.className = 'autech-sidebar';
        if (this.settings.sidebar_collapsed) {
            sidebar.classList.add('collapsed');
        }
        
        // Sidebar header
        const header = document.createElement('div');
        header.className = 'autech-sidebar-header';
        header.innerHTML = `
            <a href="/app" class="logo">
                <span>${this.getLogoText()}</span>
            </a>
            <button class="toggle-btn" id="sidebar-toggle" title="Toggle Sidebar">
                <i class="fa fa-bars"></i>
            </button>
        `;
        sidebar.appendChild(header);
        
        // Sidebar menu
        const menu = document.createElement('nav');
        menu.className = 'autech-sidebar-menu';
        menu.id = 'autech-sidebar-menu';
        
        // Build menu items
        const menuItems = this.settings.menu_items || [];
        if (menuItems.length > 0) {
            this.buildMenuItems(menu, menuItems);
        } else {
            menu.innerHTML = `<div class="menu-empty">No menu items available</div>`;
        }
        
        sidebar.appendChild(menu);
        
        // Sidebar footer (optional)
        const footer = document.createElement('div');
        footer.className = 'autech-sidebar-footer';
        footer.innerHTML = `
            <div class="sidebar-version">v${frappe.boot ? frappe.boot.version || '1.0' : '1.0'}</div>
        `;
        sidebar.appendChild(footer);
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'autech-sidebar-overlay';
        overlay.className = 'autech-sidebar-overlay';
        
        // Insert sidebar and overlay before main content
        mainContent.parentNode.insertBefore(sidebar, mainContent);
        mainContent.parentNode.insertBefore(overlay, mainContent);
        
        // Wrap main content
        if (!mainContent.classList.contains('autech-main-content')) {
            mainContent.classList.add('autech-main-content');
        }
        
        this.log('Sidebar built');
    }
    
    buildMenuItems(container, items, level = 0) {
        const ul = document.createElement('ul');
        ul.className = 'menu-list';
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        ul.style.margin = '0';
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'menu-item-wrapper';
            
            const hasChildren = item.children && item.children.length > 0;
            const isActive = this.isActiveRoute(item.route);
            
            const a = document.createElement('a');
            a.className = 'menu-item';
            if (isActive) a.classList.add('active');
            a.href = item.route || '#';
            
            // Icon
            if (this.settings.show_icons !== false) {
                const icon = document.createElement('span');
                icon.className = 'menu-icon';
                icon.innerHTML = item.icon ? `<i class="${item.icon}"></i>` : '<i class="fa fa-circle"></i>';
                a.appendChild(icon);
            }
            
            // Label
            if (this.settings.show_labels !== false) {
                const label = document.createElement('span');
                label.className = 'menu-label';
                label.textContent = item.label || 'Menu Item';
                a.appendChild(label);
            }
            
            // Chevron for submenu
            if (hasChildren) {
                const chevron = document.createElement('span');
                chevron.className = 'menu-chevron';
                chevron.innerHTML = '<i class="fa fa-chevron-right"></i>';
                a.appendChild(chevron);
            }
            
            li.appendChild(a);
            
            // Submenu
            if (hasChildren) {
                const submenu = document.createElement('div');
                submenu.className = 'sub-menu';
                this.buildMenuItems(submenu, item.children, level + 1);
                li.appendChild(submenu);
                
                // Toggle submenu
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const isOpen = submenu.classList.toggle('open');
                    const chevron = a.querySelector('.menu-chevron');
                    if (chevron) {
                        chevron.classList.toggle('open', isOpen);
                    }
                });
                
                // Open if active child
                if (this.hasActiveChild(item.children)) {
                    submenu.classList.add('open');
                    const chevron = a.querySelector('.menu-chevron');
                    if (chevron) {
                        chevron.classList.add('open');
                    }
                }
            } else {
                // Click handler for non-submenu items
                a.addEventListener('click', (e) => {
                    if (item.route && item.route !== '#') {
                        e.preventDefault();
                        if (item.open_in_new_tab) {
                            window.open(item.route, '_blank');
                        } else {
                            frappe.set_route(item.route);
                        }
                        this.closeMobileSidebar();
                    }
                });
            }
            
            ul.appendChild(li);
        });
        
        container.appendChild(ul);
    }
    
    buildNavbar() {
        // Find existing navbar
        const navbar = document.querySelector('.navbar') || 
                      document.querySelector('nav.navbar') ||
                      document.querySelector('.page-head')?.closest('.navbar');
        
        if (!navbar) {
            this.log('Navbar not found, skipping');
            return;
        }
        
        // Add theme class to navbar
        navbar.classList.add('autech-navbar');
        
        // Add mobile menu button if not exists
        let mobileBtn = navbar.querySelector('.mobile-menu-btn');
        if (!mobileBtn) {
            mobileBtn = document.createElement('button');
            mobileBtn.className = 'mobile-menu-btn';
            mobileBtn.innerHTML = '<i class="fa fa-bars"></i>';
            mobileBtn.setAttribute('aria-label', 'Toggle Menu');
            
            // Insert at beginning of navbar
            const firstChild = navbar.firstChild;
            navbar.insertBefore(mobileBtn, firstChild);
            
            // Event listener
            mobileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileSidebar();
            });
        }
        
        // Add theme to navbar items
        const navbarItems = navbar.querySelectorAll('.navbar-right, .navbar-nav, .nav-right');
        navbarItems.forEach(item => {
            if (!item.classList.contains('autech-navbar-right')) {
                item.classList.add('autech-navbar-right');
            }
        });
        
        this.log('Navbar enhanced');
    }
    
    setupEventListeners() {
        // Sidebar toggle
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSidebar();
            });
        }
        
        // Overlay click to close mobile
        const overlay = document.getElementById('autech-sidebar-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D for dark mode toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleDarkMode();
            }
            // Ctrl+Shift+B for sidebar toggle
            if (e.ctrlKey && e.shiftKey && e.key === 'B') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
        
        // Language selector
        this.setupLanguageSelector();
        
        this.log('Event listeners setup');
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('autech-sidebar');
        if (!sidebar) return;
        
        const isCollapsed = sidebar.classList.toggle('collapsed');
        
        // Save preference
        this.settings.sidebar_collapsed = isCollapsed;
        this.savePreference('sidebar_collapsed', isCollapsed);
        
        // Update main content margin
        const mainContent = document.querySelector('.autech-main-content');
        if (mainContent) {
            if (isCollapsed) {
                mainContent.style.setProperty('--sidebar-width', '64px');
            } else {
                mainContent.style.setProperty('--sidebar-width', '260px');
            }
        }
        
        this.log('Sidebar toggled:', isCollapsed ? 'collapsed' : 'expanded');
    }
    
    toggleMobileSidebar() {
        const sidebar = document.getElementById('autech-sidebar');
        const overlay = document.getElementById('autech-sidebar-overlay');
        
        if (!sidebar || !overlay) return;
        
        const isOpen = sidebar.classList.toggle('open');
        overlay.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
        
        this.log('Mobile sidebar:', isOpen ? 'opened' : 'closed');
    }
    
    closeMobileSidebar() {
        const sidebar = document.getElementById('autech-sidebar');
        const overlay = document.getElementById('autech-sidebar-overlay');
        
        if (!sidebar || !overlay) return;
        
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    toggleDarkMode() {
        const darkMode = !this.settings.dark_mode;
        this.settings.dark_mode = darkMode;
        
        this.applyDarkMode(darkMode);
        this.savePreference('dark_mode', darkMode);
        
        // Update UI
        const btn = document.querySelector('[data-theme-toggle]');
        if (btn) {
            btn.innerHTML = darkMode ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>';
            btn.title = darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
        
        this.log('Dark mode toggled:', darkMode ? 'ON' : 'OFF');
    }
    
    switchLanguage(lang) {
        if (lang === this.language) return;
        
        this.log('Switching language to:', lang);
        
        // Save preference
        this.savePreference('language', lang);
        
        // Reload to apply language
        frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'User',
                name: frappe.session.user,
                fieldname: 'language',
                value: lang
            },
            callback: function() {
                window.location.reload();
            }
        });
    }
    
    setupLanguageSelector() {
        // Find language selector in navbar
        const navbar = document.querySelector('.autech-navbar');
        if (!navbar) return;
        
        // Check if already exists
        if (navbar.querySelector('.language-selector')) return;
        
        // Create language selector
        const container = document.createElement('div');
        container.className = 'language-selector';
        
        const currentLang = document.createElement('button');
        currentLang.className = 'current-lang';
        currentLang.innerHTML = `
            <span>${this.language.toUpperCase()}</span>
            <i class="fa fa-chevron-down"></i>
        `;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'language-dropdown';
        
        // Language options
        const languages = [
            { code: 'en', label: 'English' },
            { code: 'ar', label: 'العربية' }
        ];
        
        languages.forEach(lang => {
            const btn = document.createElement('button');
            btn.textContent = lang.label;
            btn.dataset.lang = lang.code;
            if (lang.code === this.language) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                this.switchLanguage(lang.code);
            });
            dropdown.appendChild(btn);
        });
        
        currentLang.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        container.appendChild(currentLang);
        container.appendChild(dropdown);
        
        // Add to navbar right
        const navbarRight = navbar.querySelector('.autech-navbar-right') || 
                           navbar.querySelector('.navbar-right') ||
                           navbar.querySelector('.nav-right') ||
                           navbar;
        navbarRight.appendChild(container);
        
        this.log('Language selector setup');
    }
    
    setupLanguageListener() {
        // Listen for language change events
        document.addEventListener('frappe-language-change', (e) => {
            this.log('Language change detected:', e.detail);
            this.language = e.detail || 'en';
            this.isRTL = this.language === 'ar';
            
            // Update direction
            this.setDirection();
            this.updateUI();
        });
    }
    
    updateUI() {
        // Update sidebar position
        const sidebar = document.getElementById('autech-sidebar');
        if (sidebar) {
            if (this.isRTL) {
                sidebar.style.right = '0';
                sidebar.style.left = 'auto';
            } else {
                sidebar.style.left = '0';
                sidebar.style.right = 'auto';
            }
        }
        
        // Update main content margin
        const mainContent = document.querySelector('.autech-main-content');
        if (mainContent) {
            if (this.isRTL) {
                mainContent.style.marginLeft = '0';
                mainContent.style.marginRight = this.settings.sidebar_collapsed ? '64px' : '260px';
            } else {
                mainContent.style.marginLeft = this.settings.sidebar_collapsed ? '64px' : '260px';
                mainContent.style.marginRight = '0';
            }
        }
        
        this.log('UI updated');
    }
    
    savePreference(key, value) {
        // Get current preferences
        let prefs = {};
        try {
            const stored = localStorage.getItem('autech_theme_prefs');
            if (stored) {
                prefs = JSON.parse(stored);
            }
        } catch (e) {
            prefs = {};
        }
        
        prefs[key] = value;
        
        // Save to localStorage
        try {
            localStorage.setItem('autech_theme_prefs', JSON.stringify(prefs));
        } catch (e) {
            // Ignore
        }
        
        // Save to server
        frappe.call({
            method: 'autech_theme.api.save_user_preferences',
            args: {
                prefs: prefs
            },
            callback: function(r) {
                if (r.message && r.message.success) {
                    console.log('Preferences saved');
                }
            },
            error: function(err) {
                console.error('Error saving preferences:', err);
            }
        });
    }
    
    applyDefaultTheme() {
        this.settings = {
            enabled: 1,
            dark_mode: 0,
            primary_color: '#1a73e8',
            secondary_color: '#6c757d',
            accent_color: '#28a745',
            sidebar_color: '#ffffff',
            navbar_color: '#ffffff',
            background_color: '#f8f9fa',
            font_family_ar: 'Cairo',
            font_family_en: 'Inter',
            sidebar_collapsed: 0,
            sidebar_position: 'left',
            show_icons: 1,
            show_labels: 1,
            compact_mode: 0,
            border_radius: '8px',
            language: 'en',
            is_rtl: 0,
            custom_css: '',
            menu_items: []
        };
        
        this.applyTheme();
    }
    
    getLogoText() {
        // Get company name from settings
        try {
            const company = frappe.boot?.user?.company || 'AuTech';
            return company;
        } catch {
            return 'AuTech';
        }
    }
    
    isActiveRoute(route) {
        if (!route || route === '#') return false;
        
        const current = window.location.pathname;
        return current === route || current.startsWith(route);
    }
    
    hasActiveChild(children) {
        if (!children || children.length === 0) return false;
        
        for (const child of children) {
            if (this.isActiveRoute(child.route)) return true;
            if (child.children && this.hasActiveChild(child.children)) return true;
        }
        return false;
    }
    
    darkenColor(hex, percent) {
        if (!hex || !hex.startsWith('#')) return hex;
        
        let r, g, b;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        
        r = Math.max(0, r - (r * percent / 100));
        g = Math.max(0, g - (g * percent / 100));
        b = Math.max(0, b - (b * percent / 100));
        
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
    
    getTextColor(hex) {
        if (!hex || !hex.startsWith('#')) return '#212529';
        
        let r, g, b;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#212529' : '#e8e8e8';
    }
}

// Initialize theme when Frappe is ready
(function() {
    // Wait for Frappe to be ready
    function waitForFrappe() {
        if (typeof frappe !== 'undefined' && frappe.ready) {
            initTheme();
        } else {
            setTimeout(waitForFrappe, 100);
        }
    }
    
    function initTheme() {
        // Check if theme is already initialized
        if (window._autechTheme) return;
        
        const theme = new AuTechTheme();
        window._autechTheme = theme;
        theme.init();
    }
    
    waitForFrappe();
})();