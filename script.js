/**
 * MEJA CAFE PALU - Main Application
 * Clean Code & OOP Architecture
 * @version 2.1
 * @author Development Team
 */

'use strict';

// ============================================
// CONFIGURATION
// ============================================
class AppConfig {
  static SCROLL_THRESHOLD = 8;
  static ANIMATION_THRESHOLD = 0.1;
  static WHATSAPP_NUMBER = '6285220888840';
  static DEBOUNCE_DELAY = 10;
}

// ============================================
// UTILITIES
// ============================================
class Utils {
  /**
   * Format number to Indonesian Rupiah
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount) {
    const numericAmount = Number(amount) || 0;
    return `Rp ${numericAmount.toLocaleString('id-ID')}`;
  }

  /**
   * Debounce function calls
   * @param {Function} callback - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(callback, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
  }

  /**
   * Check if element exists in DOM
   * @param {string} selector - CSS selector
   * @returns {boolean}
   */
  static elementExists(selector) {
    return document.querySelector(selector) !== null;
  }

  /**
   * Safe query selector with error handling
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null}
   */
  static safeQuerySelector(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.error(`Error selecting element: ${selector}`, error);
      return null;
    }
  }
}

// ============================================
// BASE MODULE CLASS
// ============================================
class BaseModule {
  constructor(name) {
    this.name = name;
    this.initialized = false;
  }

  /**
   * Initialize module
   * @abstract
   */
  init() {
    throw new Error('init() must be implemented by subclass');
  }

  /**
   * Log initialization status
   * @param {boolean} success - Whether initialization was successful
   */
  logInitialization(success) {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${this.name} ${success ? 'initialized' : 'failed'}`);
    this.initialized = success;
  }
}

// ============================================
// ANIMATION MODULE
// ============================================
class AnimationController extends BaseModule {
  constructor() {
    super('AnimationController');
    this.observer = null;
    this.navElement = null;
  }

  init() {
    try {
      this.setupScrollAnimations();
      this.setupSmoothScroll();
      this.setupStickyNavigation();
      this.logInitialization(true);
    } catch (error) {
      console.error('Animation initialization failed:', error);
      this.logInitialization(false);
    }
  }

  setupScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (elements.length === 0) return;

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { threshold: AppConfig.ANIMATION_THRESHOLD }
    );

    elements.forEach((element, index) => {
      element.style.setProperty('--animation-order', index % 4);
      this.observer.observe(element);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }

  setupSmoothScroll() {
    const anchors = document.querySelectorAll('nav a[href^="#"]');
    anchors.forEach(anchor => {
      anchor.addEventListener('click', this.handleAnchorClick.bind(this));
    });
  }

  handleAnchorClick(event) {
    event.preventDefault();
    const targetId = event.currentTarget.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  setupStickyNavigation() {
    this.navElement = Utils.safeQuerySelector('nav');
    if (!this.navElement) return;

    const handleScroll = Utils.debounce(() => {
      this.updateNavigationState();
    }, AppConfig.DEBOUNCE_DELAY);

    this.updateNavigationState();
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  updateNavigationState() {
    if (!this.navElement) return;
    
    const shouldBeScrolled = window.scrollY > AppConfig.SCROLL_THRESHOLD;
    this.navElement.classList.toggle('scrolled', shouldBeScrolled);
  }
}

// ============================================
// FILTER MODULE
// ============================================
class ProductFilter extends BaseModule {
  constructor() {
    super('ProductFilter');
    this.filterButtons = [];
    this.productItems = [];
    this.activeFilter = 'all';
  }

  init() {
    try {
      this.cacheElements();
      this.attachEventListeners();
      this.logInitialization(true);
    } catch (error) {
      console.error('Filter initialization failed:', error);
      this.logInitialization(false);
    }
  }

  cacheElements() {
    this.filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    this.productItems = Array.from(document.querySelectorAll('.menu-item'));
  }

  attachEventListeners() {
    this.filterButtons.forEach(button => {
      button.addEventListener('click', () => this.handleFilterClick(button));
    });
  }

  handleFilterClick(selectedButton) {
    this.updateActiveButton(selectedButton);
    this.activeFilter = selectedButton.dataset.filter;
    this.filterProducts();
  }

  updateActiveButton(selectedButton) {
    this.filterButtons.forEach(button => {
      const isSelected = button === selectedButton;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-selected', isSelected.toString());
    });
  }

  filterProducts() {
    this.productItems.forEach(item => {
      const category = item.dataset.category;
      const shouldDisplay = this.shouldDisplayItem(category);
      item.style.display = shouldDisplay ? 'flex' : 'none';
    });
  }

  shouldDisplayItem(category) {
    return this.activeFilter === 'all' || category === this.activeFilter;
  }
}

// ============================================
// CART MODULE
// ============================================
class ShoppingCart extends BaseModule {
  constructor() {
    super('ShoppingCart');
    this.items = [];
    this.elements = {};
  }

  init() {
    try {
      this.cacheElements();
      this.attachEventListeners();
      this.render();
      this.logInitialization(true);
    } catch (error) {
      console.error('Cart initialization failed:', error);
      this.logInitialization(false);
    }
  }

  cacheElements() {
    this.elements = {
      toggle: document.getElementById('cart-toggle'),
      dropdown: Utils.safeQuerySelector('.cart-dropdown'),
      list: Utils.safeQuerySelector('.cart-list'),
      total: Utils.safeQuerySelector('.cart-total'),
      empty: Utils.safeQuerySelector('.cart-empty'),
      badge: Utils.safeQuerySelector('.cart-count'),
      clearBtn: Utils.safeQuerySelector('.cart-clear'),
      checkoutBtn: Utils.safeQuerySelector('.cart-checkout')
    };
  }

  attachEventListeners() {
    // Toggle cart dropdown
    this.elements.toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close cart on outside click
    document.addEventListener('click', (e) => {
      this.handleOutsideClick(e);
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addItemFromButton(button);
      });
    });

    // Cart actions
    this.elements.clearBtn?.addEventListener('click', () => this.clear());
    this.elements.checkoutBtn?.addEventListener('click', () => this.checkout());
  }

  toggleDropdown() {
    const isExpanded = this.elements.toggle.getAttribute('aria-expanded') === 'true';
    this.elements.toggle.setAttribute('aria-expanded', (!isExpanded).toString());
    this.elements.dropdown?.classList.toggle('show');
  }

  handleOutsideClick(event) {
    const isInsideCart = this.elements.toggle?.contains(event.target) ||
                        this.elements.dropdown?.contains(event.target);
    
    if (!isInsideCart) {
      this.elements.toggle?.setAttribute('aria-expanded', 'false');
      this.elements.dropdown?.classList.remove('show');
    }
  }

  addItemFromButton(button) {
    const productElement = button.closest('.menu-item');
    if (!productElement) return;

    const product = this.extractProductData(productElement);
    this.addItem(product);
  }

  extractProductData(productElement) {
    return {
      name: productElement.querySelector('h3')?.textContent || 'Unknown',
      price: 0,
      image: productElement.querySelector('img')?.src || '',
      quantity: 1
    };
  }

  addItem(product) {
    const existingItem = this.findItemByName(product.name);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.items.push({ ...product });
    }

    this.render();
  }

  findItemByName(name) {
    return this.items.find(item => item.name === name);
  }

  updateQuantity(index, delta) {
    if (!this.items[index]) return;

    this.items[index].quantity += delta;

    if (this.items[index].quantity <= 0) {
      this.removeItem(index);
    } else {
      this.render();
    }
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.render();
  }

  clear() {
    if (confirm('Hapus semua item dari keranjang?')) {
      this.items = [];
      this.render();
    }
  }

  checkout() {
    if (this.isEmpty()) {
      alert('Keranjang masih kosong!');
      return;
    }

    const message = this.generateWhatsAppMessage();
    const url = this.buildWhatsAppUrl(message);
    window.open(url, '_blank');
  }

  isEmpty() {
    return this.items.length === 0;
  }

  generateWhatsAppMessage() {
    let message = '*PESANAN FURNITURE CAFE*\n\n';

    this.items.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   Jumlah: ${item.quantity} unit\n\n`;
    });

    message += '\nMohon info harga dan ketersediaan produk. Terima kasih!';
    return message;
  }

  buildWhatsAppUrl(message) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${AppConfig.WHATSAPP_NUMBER}?text=${encodedMessage}`;
  }

  render() {
    this.renderCartList();
    this.updateBadge();
    this.updateEmptyState();
  }

  renderCartList() {
    if (!this.elements.list) return;

    this.elements.list.innerHTML = '';

    this.items.forEach((item, index) => {
      const itemElement = this.createCartItemElement(item, index);
      this.elements.list.appendChild(itemElement);
    });
  }

  createCartItemElement(item, index) {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-thumb" />
      <span class="cart-item-name" title="Lihat detail">${item.name}</span>
      <div class="cart-item-controls">
        <button class="decrease" aria-label="Kurangi jumlah">-</button>
        <span class="cart-item-qty">${item.quantity}</span>
        <button class="increase" aria-label="Tambah jumlah">+</button>
      </div>
      <span class="cart-item-price">${item.quantity} unit</span>
    `;

    this.attachItemEventListeners(li, item, index);
    return li;
  }

  attachItemEventListeners(element, item, index) {
    element.querySelector('.increase')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.updateQuantity(index, 1);
    });

    element.querySelector('.decrease')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.updateQuantity(index, -1);
    });

    element.querySelector('.cart-item-name')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showItemDetails(item);
    });
  }

  showItemDetails(item) {
    const message = `Detail Produk:\n\n${item.name}\nJumlah: ${item.quantity} unit\n\nHubungi kami untuk info harga!`;
    alert(message);
  }

  updateBadge() {
    if (!this.elements.badge) return;

    const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.elements.badge.textContent = totalQuantity.toString();
  }

  updateEmptyState() {
    if (!this.elements.empty) return;

    this.elements.empty.style.display = this.isEmpty() ? 'block' : 'none';
  }
}

// ============================================
// IMAGE ZOOM MODULE
// ============================================
class ImageZoom extends BaseModule {
  constructor() {
    super('ImageZoom');
    this.elements = {};
    this.isOpen = false;
  }

  init() {
    try {
      this.cacheElements();
      if (!this.elements.modal) {
        console.warn('Image zoom modal not found');
        return;
      }
      this.attachEventListeners();
      this.logInitialization(true);
    } catch (error) {
      console.error('ImageZoom initialization failed:', error);
      this.logInitialization(false);
    }
  }

  cacheElements() {
    this.elements = {
      modal: document.getElementById('image-modal'),
      image: document.getElementById('modal-img'),
      caption: Utils.safeQuerySelector('.modal-caption'),
      closeBtn: Utils.safeQuerySelector('.modal-close')
    };
  }

  attachEventListeners() {
    // Click on product images
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('menu-item-img')) {
        this.open(e.target);
      }
    });

    // Close button
    this.elements.closeBtn?.addEventListener('click', () => this.close());

    // Click outside
    this.elements.modal?.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.close();
      }
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(imageElement) {
    if (!this.elements.modal) return;

    this.elements.modal.classList.add('show');
    this.elements.image.src = imageElement.src;
    this.elements.caption.textContent = imageElement.alt;
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
  }

  close() {
    if (!this.elements.modal) return;

    this.elements.modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    this.isOpen = false;
  }
}

// ============================================
// FAQ MODULE
// ============================================
class FAQAccordion extends BaseModule {
  constructor() {
    super('FAQAccordion');
    this.faqItems = [];
  }

  init() {
    try {
      this.cacheFAQItems();
      this.attachEventListeners();
      this.logInitialization(true);
    } catch (error) {
      console.error('FAQ initialization failed:', error);
      this.logInitialization(false);
    }
  }

  cacheFAQItems() {
    this.faqItems = Array.from(document.querySelectorAll('.faq-item'));
  }

  attachEventListeners() {
    this.faqItems.forEach(item => {
      item.addEventListener('toggle', () => this.handleToggle(item));
    });
  }

  handleToggle(item) {
    const icon = item.querySelector('i.fa-chevron-down');
    if (!icon) return;

    const rotation = item.open ? '180deg' : '0deg';
    icon.style.transform = `rotate(${rotation})`;
  }
}

// ============================================
// SMOOTH SCROLL MODULE
// ============================================
class SmoothScrollController extends BaseModule {
  constructor() {
    super('SmoothScrollController');
    this.lenis = null;
  }

  init() {
    try {
      if (typeof Lenis === 'undefined') {
        console.warn('Lenis library not loaded');
        return;
      }

      this.initializeLenis();
      this.logInitialization(true);
    } catch (error) {
      console.error('SmoothScroll initialization failed:', error);
      this.logInitialization(false);
    }
  }

  initializeLenis() {
    this.lenis = new Lenis({
      lerp: 0.070,
      smoothWheel: true,
    });

    this.startAnimationLoop();
  }

  startAnimationLoop() {
    const animate = (time) => {
      this.lenis.raf(time);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

// ============================================
// APPLICATION CONTROLLER
// ============================================
class Application {
  constructor() {
    this.modules = [];
    this.initialized = false;
  }

  /**
   * Register module for initialization
   * @param {BaseModule} module - Module instance to register
   */
  registerModule(module) {
    if (!(module instanceof BaseModule)) {
      console.error('Module must extend BaseModule');
      return;
    }
    this.modules.push(module);
  }

  /**
   * Initialize all registered modules
   */
  async init() {
    console.log('🪑 MEJA CAFE PALU - Starting initialization...');
    console.log('━'.repeat(50));

    try {
      this.modules.forEach(module => {
        module.init();
      });

      this.initialized = true;
      console.log('━'.repeat(50));
      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
    }
  }

  /**
   * Get initialization status
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }
}

// ============================================
// APPLICATION BOOTSTRAP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();

  // Register all modules
  app.registerModule(new AnimationController());
  app.registerModule(new ProductFilter());
  app.registerModule(new ShoppingCart());
  app.registerModule(new ImageZoom());
  app.registerModule(new FAQAccordion());
  app.registerModule(new SmoothScrollController());

  // Initialize application
  app.init();

  // Make app globally accessible for debugging
  window.MejaCafePalu = app;
});
