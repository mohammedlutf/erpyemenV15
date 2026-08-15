/* AuTech Theme - Sidebar Manager */

class AuTechSidebarManager {
    constructor(theme) {
        this.theme = theme;
        this.sidebar = null;
        this.menuItems = [];
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.sidebar = document.getElementById('autech-sidebar');
        if (!this.sidebar) {
            console.warn('Sidebar element not found');
            return;
        }
        
        this.loadMenuItems();
        this.setupDragResize();
        this.initialized = true;
    }
    
    loadMenuItems() {
        // Get menu items from theme settings
        this.menuItems = this.theme.settings.menu_items || [];
        this.renderMenu();
    }
    
    renderMenu() {
        const menuContainer = document.getElementById('autech-sidebar-menu');
        if (!menuContainer) return;
        
        // Clear existing menu
        menuContainer.innerHTML = '';
        
        if (this.menuItems.length === 0) {
            menuContainer.innerHTML = `
                <div class="menu-empty">
                    <i class="fa fa-list"></i>
                    <p>No menu items available</p>
                </div>
            `;
            return;
        }
        
        // Build menu
        this.buildMenuTree(menuContainer, this.menuItems);
    }
    
    buildMenuTree(container, items, level = 0) {
        const ul = document.createElement('ul');
        ul.className = `menu-level-${level}`;
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
            if (this.theme.settings.show_icons !== false) {
                const icon = document.createElement('span');
                icon.className = 'menu-icon';
                icon.innerHTML = item.icon ? `<i class="${item.icon}"></i>` : '<i class="fa fa-circle"></i>';
                a.appendChild(icon);
            }
            
            // Label
            if (this.theme.settings.show_labels !== false) {
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
                this.buildMenuTree(submenu, item.children, level + 1);
                li.appendChild(submenu);
                
                // Toggle submenu
                a.addEventListener('click', (e) => {
                    if (!e.target.closest('.menu-chevron')) {
                        // Only toggle if not clicking chevron
                        const isOpen = submenu.classList.toggle('open');
                        const chevron = a.querySelector('.menu-chevron');
                        if (chevron) {
                            chevron.classList.toggle('open', isOpen);
                        }
                    }
                });
                
                // Click on chevron
                const chevron = a.querySelector('.menu-chevron');
                if (chevron) {
                    chevron.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const isOpen = submenu.classList.toggle('open');
                        chevron.classList.toggle('open', isOpen);
                    });
                }
                
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
                            this.theme.closeMobileSidebar();
                        }
                    }
                });
            }
            
            ul.appendChild(li);
        });
        
        container.appendChild(ul);
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
    
    setupDragResize() {
        // Add resize handle for sidebar
        const handle = document.createElement('div');
        handle.className = 'sidebar-resize-handle';
        handle.style.cssText = `
            position: absolute;
            right: -4px;
            top: 0;
            bottom: 0;
            width: 8px;
            cursor: col-resize;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.2s;
        `;
        
        // Only on desktop
        if (window.innerWidth > 768) {
            this.sidebar.appendChild(handle);
            
            this.sidebar.addEventListener('mouseenter', () => {
                handle.style.opacity = '1';
            });
            
            this.sidebar.addEventListener('mouseleave', () => {
                handle.style.opacity = '0';
            });
            
            let isResizing = false;
            let startX, startWidth;
            
            handle.addEventListener('mousedown', (e) => {
                if (this.theme.settings.sidebar_collapsed) return;
                
                isResizing = true;
                startX = e.clientX;
                startWidth = this.sidebar.offsetWidth;
                
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                let newWidth = startWidth + (e.clientX - startX);
                newWidth = Math.max(200, Math.min(400, newWidth));
                
                this.sidebar.style.width = newWidth + 'px';
                document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
            });
        }
    }
}

// Export for use
window.AuTechSidebarManager = AuTechSidebarManager;