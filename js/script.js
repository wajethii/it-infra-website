/**
 * Digital Solutions App - Main Application Script
 * Handles portfolio filtering, IT infrastructure assessment, and general application functionality
 */

class DigitalSolutionsApp {
    constructor() {
        this.elements = {
            filterButtons: document.querySelectorAll('.filter-btn'),
            portfolioItems: document.querySelectorAll('.portfolio-item'),
            connectivityForm: document.getElementById('connectivityForm'), // Updated ID to match HTML
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
            BASE_COVERAGE: 1500, // For WiFi AP calculation
            DEVICE_FACTOR: 2,    // For estimated devices
            SERVER_FACTOR_SQFT: 5000, // One server per this many sq ft for general purpose
            WORKSTATION_FACTOR_SQFT: 200, // One workstation per this many sq ft
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

        // IT Infrastructure Assessment form submission
        if (this.elements.connectivityForm) {
            this.elements.connectivityForm.addEventListener('submit', (e) => this.handleServiceFormSubmit(e));
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

    handleServiceFormSubmit(event) {
        event.preventDefault();

        try {
            if (!this.elements.areaInput.checkValidity()) {
                this.elements.areaInput.reportValidity();
                return;
            }

            const formData = this.getITFormData(); // Get data for the IT assessment form
            const calculationResults = this.calculateITNeeds(formData);
            this.displayITResults(formData, calculationResults); // Display IT specific results

            // Track form submission in analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'it_assessment_submission', {
                    'event_category': 'engagement',
                    'event_label': 'IT Infrastructure Assessment'
                });
            }
        } catch (error) {
            console.error('Error processing IT assessment form:', error);
            this.showErrorToast("An error occurred while processing your request. Please try again.");
        }
    }

    getITFormData() {
        return {
            area: parseFloat(this.elements.areaInput.value),
            buildingFactor: parseFloat(this.elements.buildingTypeSelect.value),
            usageFactor: parseFloat(document.querySelector('input[name="usage"]:checked').value),
            needsCabling: document.querySelector('input[name="structuredCabling"]').checked,
            needsCCTV: document.querySelector('input[name="cctv"]').checked,
            needsAccessControl: document.querySelector('input[name="accessControl"]').checked, // New checkbox
            needsTelephony: document.querySelector('input[name="telephony"]').checked,         // New checkbox
            buildingType: this.elements.buildingTypeSelect.options[this.elements.buildingTypeSelect.selectedIndex].text
        };
    }

    calculateCoverageNeeds(area, buildingFactor, usageFactor) {
        // Re-using existing WiFi calculation logic
        const { BASE_COVERAGE } = this.constants;
        return Math.max(1, Math.ceil((area * buildingFactor * usageFactor) / BASE_COVERAGE));
    }

    calculateITNeeds(data) {
        const { area, buildingFactor, usageFactor } = data;
        const { DEVICE_FACTOR, SERVER_FACTOR_SQFT, WORKSTATION_FACTOR_SQFT } = this.constants;

        const accessPoints = this.calculateCoverageNeeds(area, buildingFactor, usageFactor);
        const estimatedDevices = Math.max(1, Math.floor(area / 100 * usageFactor * DEVICE_FACTOR));
        const recommendedServers = Math.max(1, Math.ceil(area / SERVER_FACTOR_SQFT));
        const recommendedWorkstations = Math.max(1, Math.ceil(area / WORKSTATION_FACTOR_SQFT));

        return {
            accessPoints,
            estimatedDevices,
            recommendedServers,
            recommendedWorkstations
        };
    }

    displayITResults(formData, results) {
        const { area, buildingType, needsCabling, needsCCTV, needsAccessControl, needsTelephony } = formData;
        const { accessPoints, estimatedDevices, recommendedServers, recommendedWorkstations } = results;

        let html = `
            <div class="space-y-3">
                <p>For your <strong>${area.toLocaleString()} sq. ft ${buildingType}</strong>, based on your primary usage, we recommend:</p>
                <p class="flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <strong>${accessPoints <= 1 ? '1 high-performance WiFi system' : `${accessPoints} WiFi access points`}</strong> for optimal coverage.
                </p>
                <p class="flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    An estimated <strong>${recommendedWorkstations} workstations</strong> and <strong>${recommendedServers} server${recommendedServers > 1 ? 's' : ''}</strong> to support your operations.
                </p>
        `;

        const services = [];
        if (needsCabling) services.push("structured cabling");
        if (needsCCTV) services.push("CCTV installation");
        if (needsAccessControl) services.push("access control systems"); // New service
        if (needsTelephony) services.push("telephony systems");         // New service

        if (services.length > 0) {
            html += `
                <p class="flex items-center">
                    <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Consider adding <strong>${services.join(", ")}</strong> for a complete solution.
                </p>
            `;
            this.elements.additionalServicesText.textContent = `Includes assessment for ${services.join(", ")}.`;
            this.elements.ctaButton.textContent = "Get Complete IT Solution Quote";
        } else {
            this.elements.additionalServicesText.textContent = "Basic IT infrastructure assessment.";
            this.elements.ctaButton.textContent = "Get Free IT Consultation";
        }

        html += `</div>`;

        // Update DOM
        this.elements.resultText.innerHTML = html;
        this.elements.deviceCount.textContent = estimatedDevices.toLocaleString(); // Now 'estimatedDevices' for more general IT context
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
    new DigitalSolutionsApp();
});