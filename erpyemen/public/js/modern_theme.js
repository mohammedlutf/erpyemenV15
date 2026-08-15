/**
 * MODERN THEME — client-side enhancements
 * - Applies dark/light mode (persisted in localStorage) via [data-mt-theme]
 * - Injects a theme toggle button into the navbar
 * - Confirms RTL/Arabic direction + font class as early as possible
 * - Adds a smooth collapse/expand affordance to the desk sidebar
 */

(function () {
	"use strict";

	const STORAGE_KEY = "modern_theme_mode"; // "light" | "dark"
	const SIDEBAR_COLLAPSE_KEY = "modern_theme_sidebar_collapsed";

	const ICONS = {
		sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>`,
		moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
		chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
	};

	function getStoredMode() {
		try {
			return localStorage.getItem(STORAGE_KEY);
		} catch (e) {
			return null;
		}
	}

	function setStoredMode(mode) {
		try {
			localStorage.setItem(STORAGE_KEY, mode);
		} catch (e) {
			/* ignore (private browsing etc.) */
		}
	}

	function applyMode(mode) {
		document.documentElement.setAttribute("data-mt-theme", mode);
		const toggle = document.querySelector(".mt-theme-toggle");
		if (toggle) {
			toggle.innerHTML = mode === "dark" ? ICONS.sun : ICONS.moon;
			toggle.setAttribute(
				"title",
				mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
			);
		}
	}

	function initMode() {
		const stored = getStoredMode();
		if (stored) {
			applyMode(stored);
			return;
		}
		const prefersDark =
			window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches;
		applyMode(prefersDark ? "dark" : "light");
	}

	function toggleMode() {
		const current =
			document.documentElement.getAttribute("data-mt-theme") || "light";
		const next = current === "dark" ? "light" : "dark";
		applyMode(next);
		setStoredMode(next);
	}

	function injectThemeToggle() {
		if (document.querySelector(".mt-theme-toggle")) return;

		const navbarRight =
			document.querySelector(".navbar .dropdown-help")?.parentElement ||
			document.querySelector(".navbar-nav.ml-auto") ||
			document.querySelector(".navbar-nav");

		if (!navbarRight) return;

		const btn = document.createElement("div");
		btn.className = "mt-theme-toggle";
		btn.setAttribute("role", "button");
		btn.setAttribute("title", "Toggle dark mode");
		btn.innerHTML =
			(document.documentElement.getAttribute("data-mt-theme") || "light") ===
			"dark"
				? ICONS.sun
				: ICONS.moon;
		btn.addEventListener("click", toggleMode);

		navbarRight.parentElement
			? navbarRight.parentElement.insertBefore(btn, navbarRight)
			: navbarRight.prepend(btn);
	}

	/**
	 * Direction/font handling. Frappe already sets `dir="rtl"` on <html> when
	 * the user's language is Arabic/Hebrew/etc — we read frappe.boot (via the
	 * boot_session hook) as a fast, reliable signal and make sure the
	 * attribute is set even before Frappe's own logic runs.
	 */
	function initDirection() {
		try {
			const boot = window.frappe && frappe.boot;
			const mt = boot && boot.modern_theme;
			if (mt && mt.is_rtl) {
				document.documentElement.setAttribute("dir", "rtl");
				document.documentElement.setAttribute("lang", mt.lang || "ar");
			}
		} catch (e) {
			/* frappe.boot not ready yet — Frappe's own RTL handling will still apply */
		}
	}

	/**
	 * Sidebar collapse toggle — adds a small chevron control that shrinks
	 * the desk sidebar to icon-only width, persisted across sessions.
	 */
	function injectSidebarToggle() {
		const sidebar = document.querySelector(".desk-sidebar, .body-sidebar");
		const container = document.querySelector(".content, .main-section");
		if (!sidebar || document.querySelector(".mt-sidebar-toggle")) return;

		const toggle = document.createElement("div");
		toggle.className = "mt-sidebar-toggle";
		toggle.innerHTML = ICONS.chevron;
		toggle.setAttribute("title", "Collapse sidebar");

		let collapsed = false;
		try {
			collapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
		} catch (e) {}

		function apply() {
			sidebar.classList.toggle("mt-sidebar-collapsed", collapsed);
			toggle.style.transform = collapsed ? "rotate(180deg)" : "rotate(0deg)";
		}
		apply();

		toggle.addEventListener("click", function () {
			collapsed = !collapsed;
			try {
				localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
			} catch (e) {}
			apply();
		});

		sidebar.appendChild(toggle);
	}

	function boot() {
		initDirection();
		initMode();
		injectThemeToggle();
		injectSidebarToggle();
	}

	// Run as soon as possible, then again once Frappe's desk app is fully
	// ready (navbar/sidebar are rendered dynamically).
	document.addEventListener("DOMContentLoaded", boot);
	if (window.frappe && frappe.after_ajax) {
		frappe.after_ajax(boot);
	} else {
		document.addEventListener("DOMContentLoaded", function () {
			if (window.frappe && frappe.after_ajax) frappe.after_ajax(boot);
		});
	}
	// Re-run on route change since Frappe re-renders parts of the sidebar/navbar
	if (window.frappe && frappe.router && frappe.router.on) {
		frappe.router.on("change", function () {
			setTimeout(boot, 300);
		});
	}
})();
