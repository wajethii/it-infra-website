/**
 * Network Solutions Calculator - Main Application Script
 * Handles portfolio filtering and WiFi coverage calculations
 */

class NetworkSolutionsApp {
  constructor() {
    this.elements = {
      filterButtons: document.querySelectorAll('.filter-btn'),
      portfolioItems: document.querySelectorAll('.portfolio-item'),
      coverageForm: document.getElementById('coverageForm'),
      areaInput: document.getElementById('area'),
      buildingTypeSelect: document.getElementById('buildingType'),
      resultText: document.getElementById('resultText'),
      deviceCount: document.getElementById('deviceCount'),
      additionalServicesText: document.getElementById('additionalServicesText'),
      estimateResult: document.getElementById('estimateResult'),
      ctaButton: document.getElementById('ctaButton'),
      yearElement: document.getElementById('year')
    };

    this.constants = {
      BASE_COVERAGE: 1500,
      DEVICE_FACTOR: 2,
      MIN_AREA: 100,
      MAX_AREA: 100000
    };

    this.init();
  }

  init() {
    this.initEventListeners();
    this.setCopyrightYear();
  }

  initEventListeners() {
    // Portfolio filter functionality
    if (this.elements.filterButtons.length) {
      this.elements.filterButtons.forEach(button => {
        button.addEventListener('click', (e) => this.handleFilterClick(e));
      });
    }

    // Coverage form submission
    if (this.elements.coverageForm) {
      this.elements.coverageForm.addEventListener('submit', (e) => this.handleCoverageFormSubmit(e));
    }

    // Input validation
    if (this.elements.areaInput) {
      this.elements.areaInput.addEventListener('input', () => this.validateAreaInput());
    }
  }

  setCopyrightYear() {
    if (this.elements.yearElement) {
      this.elements.yearElement.textContent = new Date().getFullYear();
    }
  }

  validateAreaInput() {
    const value = parseFloat(this.elements.areaInput.value);
    if (isNaN(value) || value < this.constants.MIN_AREA) {
      this.elements.areaInput.setCustomValidity(`Please enter an area of at least ${this.constants.MIN_AREA} sq. ft`);
    } else if (value > this.constants.MAX_AREA) {
      this.elements.areaInput.setCustomValidity(`Maximum area is ${this.constants.MAX_AREA} sq. ft`);
    } else {
      this.elements.areaInput.setCustomValidity('');
    }
  }

  handleFilterClick(event) {
    // Update active button state
    this.elements.filterButtons.forEach(btn => {
      btn.classList.remove('bg-blue-700', 'text-white');
      btn.classList.add('border', 'border-gray-300', 'hover:bg-gray-100');
    });

    const clickedButton = event.currentTarget;
    clickedButton.classList.add('bg-blue-700', 'text-white');
    clickedButton.classList.remove('border', 'border-gray-300', 'hover:bg-gray-100');

    // Filter portfolio items
    const filterValue = clickedButton.dataset.filter;
    this.filterPortfolioItems(filterValue);
  }

  filterPortfolioItems(filter) {
    this.elements.portfolioItems.forEach(item => {
      const shouldShow = filter === 'all' || item.dataset.category.includes(filter);
      item.style.display = shouldShow ? 'block' : 'none';
      
      // Add animation when showing items
      if (shouldShow) {
        item.style.animation = 'fadeIn 0.3s ease-out';
      }
    });
  }

  handleCoverageFormSubmit(event) {
    event.preventDefault();

    try {
      if (!this.elements.areaInput.checkValidity()) {
        this.elements.areaInput.reportValidity();
        return;
      }

      const formData = this.getFormData();
      const calculationResults = this.calculateCoverageNeeds(formData);
      this.displayResults(formData, calculationResults);
      
      // Track form submission in analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'calculation', {
          'event_category': 'engagement',
          'event_label': 'WiFi Coverage Calculation'
        });
      }
    } catch (error) {
      console.error('Error processing form:', error);
      this.showErrorToast("An error occurred while processing your request. Please try again.");
    }
  }

  getFormData() {
    return {
      area: parseFloat(this.elements.areaInput.value),
      buildingFactor: parseFloat(this.elements.buildingTypeSelect.value),
      usageFactor: parseFloat(document.querySelector('input[name="usage"]:checked').value),
      needsCabling: document.querySelector('input[name="structuredCabling"]').checked,
      needsCCTV: document.querySelector('input[name="cctv"]').checked,
      needsSecurity: document.querySelector('input[name="networkSecurity"]').checked,
      buildingType: this.elements.buildingTypeSelect.options[this.elements.buildingTypeSelect.selectedIndex].text
    };
  }

  calculateCoverageNeeds(data) {
    const { area, buildingFactor, usageFactor } = data;
    const { BASE_COVERAGE, DEVICE_FACTOR } = this.constants;

    return {
      accessPoints: Math.max(1, Math.ceil((area * buildingFactor * usageFactor) / BASE_COVERAGE)),
      devices: Math.max(1, Math.floor(area / 100 * usageFactor * DEVICE_FACTOR))
    };
  }

  displayResults(formData, results) {
    const { area, buildingType, needsCabling, needsCCTV, needsSecurity } = formData;
    const { accessPoints, devices } = results;

    // Build base recommendation
    let html = `
      <div class="space-y-3">
        <p>For your <strong>${area.toLocaleString()} sq. ft ${buildingType}</strong>, we recommend:</p>
        <p class="flex items-center">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <strong>${accessPoints <= 1 ? '1 high-performance WiFi system' : `${accessPoints} WiFi access points`}</strong>
        </p>
    `;

    // Add additional services if selected
    const services = [];
    if (needsCabling) services.push("structured cabling");
    if (needsCCTV) services.push("CCTV installation");
    if (needsSecurity) services.push("network security");

    if (services.length > 0) {
      html += `
        <p class="flex items-center">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <strong>${services.join(", ")}</strong> services requested
        </p>
      `;
      this.elements.additionalServicesText.textContent = `Includes ${services.join(", ")} assessment`;
      this.elements.ctaButton.textContent = "Get Complete Solution Quote";
    } else {
      this.elements.additionalServicesText.textContent = "Basic WiFi assessment only";
      this.elements.ctaButton.textContent = "Get Free Professional Quote";
    }

    html += `</div>`;

    // Update DOM
    this.elements.resultText.innerHTML = html;
    this.elements.deviceCount.textContent = devices.toLocaleString();
    this.elements.estimateResult.classList.remove('hidden');
    
    // Smooth scroll to results
    setTimeout(() => {
      this.elements.estimateResult.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }

  showErrorToast(message) {
    // Implement a toast notification system or use browser alert
    alert(message); // Replace with your preferred notification system
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NetworkSolutionsApp();
});