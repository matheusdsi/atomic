/**
 * DEVELOPER DOCUMENTATION
 *
 * Include your custom JavaScript here.
 *
 * The theme Focal has been developed to be easily extensible through the usage of a lot of different JavaScript
 * events, as well as the usage of custom elements (https://developers.google.com/web/fundamentals/web-components/customelements)
 * to easily extend the theme and re-use the theme infrastructure for your own code.
 *
 * The technical documentation is summarized here.
 */

/* Mega Menu with Images JavaScript */
document.addEventListener('DOMContentLoaded', function() {
  // Custom Element for Mega Menu Disclosure
  if (!customElements.get('mega-menu-disclosure')) {
    class MegaMenuDisclosure extends HTMLDetailsElement {
      constructor() {
        super();
        this.trigger = this.getAttribute('trigger') || 'click';
        this.summary = this.querySelector('summary');
        this.megaMenu = this.querySelector('.mega-menu');
        this.isTransitioning = false;
        this.transitionDuration = 300; // in ms
        
        this.addEventListener('toggle', this.onToggle.bind(this));
        
        if (this.trigger === 'hover' && window.matchMedia('(min-width: 1150px)').matches) {
          this.addEventListener('mouseenter', this.onMouseEnter.bind(this));
          this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
          
          // Handle click on summary for touch devices
          if (this.summary) {
            this.summary.addEventListener('click', this.onSummaryClick.bind(this));
          }
        }
        
        // Close when clicking outside
        document.addEventListener('click', this.onDocumentClick.bind(this));
        
        // Handle window resize
        this.mediaQueryList = window.matchMedia('(min-width: 1150px)');
        this.mediaQueryList.addEventListener('change', this.onMediaQueryChange.bind(this));
      }
      
      onToggle(event) {
        // Prevent default behavior for mobile
        if (window.innerWidth < 1150) {
          event.preventDefault();
        }
        
        // Animate the mega menu
        if (this.hasAttribute('open')) {
          this.animateOpen();
        } else {
          this.animateClose();
        }
      }
      
      animateOpen() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        if (this.megaMenu) {
          this.megaMenu.style.opacity = '0';
          this.megaMenu.style.display = 'block';
          
          // Trigger reflow
          this.megaMenu.offsetHeight;
          
          // Animate
          this.megaMenu.style.transition = `opacity ${this.transitionDuration}ms ease-out`;
          this.megaMenu.style.opacity = '1';
          
          setTimeout(() => {
            this.isTransitioning = false;
          }, this.transitionDuration);
        }
      }
      
      animateClose() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        if (this.megaMenu) {
          this.megaMenu.style.transition = `opacity ${this.transitionDuration}ms ease-out`;
          this.megaMenu.style.opacity = '0';
          
          setTimeout(() => {
            this.megaMenu.style.display = 'none';
            this.isTransitioning = false;
          }, this.transitionDuration);
        }
      }
      
      onMouseEnter() {
        if (window.innerWidth >= 1150) {
          this.setAttribute('open', '');
        }
      }
      
      onMouseLeave() {
        if (window.innerWidth >= 1150) {
          this.removeAttribute('open');
        }
      }
      
      onSummaryClick(event) {
        // For touch devices in desktop mode, first click opens menu, second click navigates
        if (window.innerWidth >= 1150 && this.hasAttribute('open')) {
          const url = this.summary.getAttribute('data-url');
          if (url) {
            window.location.href = url;
          }
        }
      }
      
      onDocumentClick(event) {
        if (!this.contains(event.target) && this.hasAttribute('open')) {
          this.removeAttribute('open');
        }
      }
      
      onMediaQueryChange(event) {
        // Reset state when switching between mobile and desktop
        if (this.hasAttribute('open')) {
          this.removeAttribute('open');
          
          if (this.megaMenu) {
            this.megaMenu.style.opacity = '0';
            this.megaMenu.style.display = 'none';
          }
        }
      }
      
      disconnectedCallback() {
        this.mediaQueryList.removeEventListener('change', this.onMediaQueryChange.bind(this));
      }
    }
    
    customElements.define('mega-menu-disclosure', MegaMenuDisclosure, { extends: 'details' });
  }
  
  // Custom Element for Mega Menu Promo Carousel
  if (!customElements.get('mega-menu-promo-carousel')) {
    class MegaMenuPromoCarousel extends HTMLElement {
      constructor() {
        super();
        this.slides = Array.from(this.querySelectorAll('.content-over-media'));
        this.currentIndex = 0;
        this.autoplayInterval = null;
        this.autoplayDelay = 5000; // 5 seconds
        this.isVisible = false;
        this.isPaused = false;
        
        // Find control buttons
        const prevButton = this.parentNode.querySelector('[is="prev-button"]');
        const nextButton = this.parentNode.querySelector('[is="next-button"]');
        
        if (prevButton) {
          prevButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.prev();
          });
        }
        
        if (nextButton) {
          nextButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.next();
          });
        }
        
        // Add support for initialize event
        this.addEventListener('initialize', this.initialize.bind(this));
        
        // Add intersection observer to pause when not visible
        this.setupIntersectionObserver();
        
        // Add touch support
        this.setupTouchSupport();
        
        // Initialize the carousel
        this.initialize();
      }
      
      setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.isVisible = true;
              if (!this.isPaused) {
                this.startAutoplay();
              }
            } else {
              this.isVisible = false;
              this.stopAutoplay();
            }
          });
        }, { threshold: 0.1 });
        
        this.observer.observe(this);
      }
      
      setupTouchSupport() {
        let startX, endX;
        const minSwipeDistance = 50;
        
        this.addEventListener('touchstart', (e) => {
          startX = e.touches[0].clientX;
          this.isPaused = true;
          this.stopAutoplay();
        }, { passive: true });
        
        this.addEventListener('touchmove', (e) => {
          if (!startX) return;
          endX = e.touches[0].clientX;
        }, { passive: true });
        
        this.addEventListener('touchend', () => {
          if (!startX || !endX) return;
          
          const distance = endX - startX;
          if (Math.abs(distance) >= minSwipeDistance) {
            if (distance > 0) {
              this.prev();
            } else {
              this.next();
            }
          }
          
          // Reset
          startX = null;
          endX = null;
          
          // Resume autoplay after a delay
          setTimeout(() => {
            this.isPaused = false;
            if (this.isVisible) {
              this.startAutoplay();
            }
          }, 1000);
        });
      }
      
      initialize() {
        // Reset carousel and update slides
        this.stopAutoplay();
        this.currentIndex = 0;
        this.updateSlides();
        
        if (this.slides.length > 1 && this.isVisible && !this.isPaused) {
          this.startAutoplay();
        }
      }
      
      startAutoplay() {
        if (this.slides.length > 1 && !this.autoplayInterval) {
          this.autoplayInterval = setInterval(() => {
            this.next();
          }, this.autoplayDelay);
        }
      }
      
      stopAutoplay() {
        if (this.autoplayInterval) {
          clearInterval(this.autoplayInterval);
          this.autoplayInterval = null;
        }
      }
      
      prev() {
        this.stopAutoplay();
        this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.updateSlides();
        
        if (this.isVisible && !this.isPaused) {
          this.startAutoplay();
        }
      }
      
      next() {
        this.stopAutoplay();
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this.updateSlides();
        
        if (this.isVisible && !this.isPaused) {
          this.startAutoplay();
        }
      }
      
      updateSlides() {
        this.slides.forEach((slide, index) => {
          if (index === this.currentIndex) {
            slide.classList.add('is-selected');
            slide.classList.remove('reveal-invisible');
            slide.setAttribute('aria-hidden', 'false');
          } else {
            slide.classList.remove('is-selected');
            slide.classList.add('reveal-invisible');
            slide.setAttribute('aria-hidden', 'true');
          }
        });
        
        // Update ARIA attributes for accessibility
        this.setAttribute('aria-roledescription', 'carousel');
        this.slides.forEach((slide, index) => {
          slide.setAttribute('role', 'group');
          slide.setAttribute('aria-roledescription', 'slide');
          slide.setAttribute('aria-label', `${index + 1} of ${this.slides.length}`);
        });
      }
      
      disconnectedCallback() {
        this.stopAutoplay();
        if (this.observer) {
          this.observer.disconnect();
        }
      }
    }
    
    customElements.define('mega-menu-promo-carousel', MegaMenuPromoCarousel);
  }
  
  // Custom Element for Height Observer
  if (!customElements.get('height-observer')) {
    class HeightObserver extends HTMLElement {
      constructor() {
        super();
        this.variableName = this.getAttribute('variable') || 'element';
        this.observer = new ResizeObserver(this.updateHeight.bind(this));
        this.observer.observe(this);
        
        // Initial height calculation
        this.updateHeight([{contentRect: {height: this.clientHeight}}]);
        
        // Update on window resize for better responsiveness
        window.addEventListener('resize', this.onWindowResize.bind(this));
      }
      
      updateHeight(entries) {
        for (const entry of entries) {
          const height = Math.round(entry.contentRect.height);
          document.documentElement.style.setProperty(`--${this.variableName}-height`, `${height}px`);
        }
      }
      
      onWindowResize() {
        this.updateHeight([{contentRect: {height: this.clientHeight}}]);
      }
      
      disconnectedCallback() {
        this.observer.disconnect();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
      }
    }
    
    customElements.define('height-observer', HeightObserver);
  }
  
  // Mobile Navigation Drawer
  const mobileMenuButton = document.querySelector('button[aria-controls="header-sidebar-menu"]');
  const mobileMenu = document.getElementById('header-sidebar-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        mobileMenu.removeAttribute('open');
        this.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
      } else {
        mobileMenu.setAttribute('open', '');
        this.setAttribute('aria-expanded', 'true');
        document.body.classList.add('overflow-hidden');
      }
    });
    
    // Close button in mobile menu
    const closeButton = mobileMenu.querySelector('button[is="close-button"]');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        mobileMenu.removeAttribute('open');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('overflow-hidden');
      });
    }
    
    // Panel navigation in mobile menu
    const panelButtons = mobileMenu.querySelectorAll('button[data-panel]');
    panelButtons.forEach(button => {
      button.addEventListener('click', function() {
        const panelId = this.getAttribute('data-panel');
        const panels = mobileMenu.querySelectorAll('.panel');
        
        panels.forEach((panel, index) => {
          if (index.toString() === panelId) {
            panel.style.transform = 'translateX(0%)';
            panel.style.opacity = '1';
            panel.style.visibility = 'visible';
          } else {
            panel.style.transform = index < parseInt(panelId) ? 'translateX(-100%)' : 'translateX(100%)';
            panel.style.opacity = '0';
            panel.style.visibility = 'hidden';
          }
        });
      });
    });
  }
});

/**
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A VARIANT HAS CHANGED
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a the user has changed the variant in a selector. The target get you the form
 * that triggered this event.
 *
 * Example:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   let variant = event.detail.variant; // Gives you access to the whole variant details
 *   let form = event.target;
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * MANUALLY CHANGE A VARIANT
 * ------------------------------------------------------------------------------------------------------------
 *
 * You may want to manually change the variant, and let the theme automatically adjust all the selectors. To do
 * that, you can get the DOM element of type "<product-variants>", and call the selectVariant method on it with
 * the variant ID.
 *
 * Example:
 *
 * const productVariantElement = document.querySelector('product-variants');
 * productVariantElement.selectVariant(12345);
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A NEW VARIANT IS ADDED TO THE CART
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a variant is added to the cart through a form selector (product page, quick
 * view...). This event DOES NOT include any change done through the cart on an existing variant. For that,
 * please refer to the "cart:updated" event.
 *
 * Example:
 *
 * document.addEventListener('variant:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 * });

 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A VARIANT HAS CHANGED
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a the user has changed the variant in a selector. The target get you the form
 * that triggered this event.
 *
 * Example:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   let variant = event.detail.variant; // Gives you access to the whole variant details
 *   let form = event.target;
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * MANUALLY CHANGE A VARIANT
 * ------------------------------------------------------------------------------------------------------------
 *
 * You may want to manually change the variant, and let the theme automatically adjust all the selectors. To do
 * that, you can get the DOM element of type "<product-variants>", and call the selectVariant method on it with
 * the variant ID.
 *
 * Example:
 *
 * const productVariantElement = document.querySelector('product-variants');
 * productVariantElement.selectVariant(12345);
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A NEW VARIANT IS ADDED TO THE CART
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a variant is added to the cart through a form selector (product page, quick
 * view...). This event DOES NOT include any change done through the cart on an existing variant. For that,
 * please refer to the "cart:updated" event.
 *
 * Example:
 *
 * document.addEventListener('variant:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN THE CART CONTENT HAS CHANGED
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever the cart content has changed (if the quantity of a variant has changed, if a variant
 * has been removed, if the note has changed...). This event will also be emitted when a new variant has been
 * added (so you will receive both "variant:added" and "cart:updated"). Contrary to the variant:added event,
 * this event will give you the complete details of the cart.
 *
 * Example:
 *
 * document.addEventListener('cart:updated', function(event) {
 *   var cart = event.detail.cart; // Get the updated content of the cart
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * REFRESH THE CART/MINI-CART
 * ------------------------------------------------------------------------------------------------------------
 *
 * If you are adding variants to the cart and would like to instruct the theme to re-render the cart, you cart
 * send the cart:refresh event, as shown below:
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 *
 * ------------------------------------------------------------------------------------------------------------
 * USAGE OF CUSTOM ELEMENTS
 * ------------------------------------------------------------------------------------------------------------
 *
 * Our theme makes extensive use of HTML custom elements. Custom elements are an awesome way to extend HTML
 * by creating new elements that carry their own JavaScript for adding new behavior. The theme uses a large
 * number of custom elements, but the two most useful are drawer and popover. Each of those components add
 * a "open" attribute that you can toggle on and off. For instance, let's say you would like to open the cart
 * drawer, whose id is "mini-cart", you simply need to retrieve it and set its "open" attribute to true (or
 * false to close it):
 *
 * document.getElementById('mini-cart').open = true;
 *
 * Thanks to the power of custom elements, the theme will take care automagically of trapping focus, maintaining
 * proper accessibility attributes...
 *
 * If you would like to create your own drawer, you can re-use the <drawer-content> content. Here is a simple
 * example:
 *
 * // Make sure you add "aria-controls", "aria-expanded" and "is" HTML attributes to your button:
 * <button type="button" is="toggle-button" aria-controls="id-of-drawer" aria-expanded="false">Open drawer</button>
 *
 * <drawer-content id="id-of-drawer">
 *   Your content
 * </drawer-content>
 *
 * The nice thing with custom elements is that you do not actually need to instantiate JavaScript yourself: this
 * is done automatically as soon as the element is inserted to the DOM.
 *
 * ------------------------------------------------------------------------------------------------------------
 * THEME DEPENDENCIES
 * ------------------------------------------------------------------------------------------------------------
 *
 * While the theme tries to keep outside dependencies as small as possible, the theme still uses third-party code
 * to power some of its features. Here is the list of all dependencies:
 *
 * "vendor.js":
 *
 * The vendor.js contains required dependencies. This file is loaded in parallel of the theme file.
 *
 * - custom-elements polyfill (used for built-in elements on Safari - v1.0.0): https://github.com/ungap/custom-elements
 * - web-animations-polyfill (used for polyfilling WebAnimations on Safari 12, this polyfill will be removed in 1 year - v2.3.2): https://github.com/web-animations/web-animations-js
 * - instant-page (v5.1.0): https://github.com/instantpage/instant.page
 * - tocca (v2.0.9); https://github.com/GianlucaGuarini/Tocca.js/
 * - seamless-scroll-polyfill (v2.0.0): https://github.com/magic-akari/seamless-scroll-polyfill
 *
 * "flickity.js": v2.2.0 (with the "fade" package). Flickity is only loaded on demand if there is a product image
 * carousel on the page. Otherwise it is not loaded.
 *
 * "photoswipe": v4.1.3. PhotoSwipe is only loaded on demand to power the zoom feature on product page. If the zoom
 * feature is disabled, then this script is never loaded.
 */



function exibir(){
  if($('#campo-cep').val().length > 7){
    $(".frete-resultado").hide()
    setTimeout(() => {  $(".frete-resultado").show()}, 500);
    
  }else{ 
    alert('Insira um cep valido')
  }  
}

$(".flutuante").on( "click", function() {
  $('button#AddToCart').trigger('click')
});

$( document ).ready(function() {
  $('.owl-carousel').owlCarousel({
    loop:true,
    margin:20,
    nav: false,
    dots: true,
     responsive:{
        0:{
            items:2
        },
        600:{
            items:3
        },
        1000:{
            items:3
        }
    }
  })
});
