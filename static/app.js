$(document).ready(function () {
    // Handle search form submission
    $('#searchForm').submit(function (e) {
        e.preventDefault();

        const company = $('#searchCompany').val();
        const industry = $('#searchIndustry').val();

        if (!company && !industry) {
            showAlert('Please enter at least one search criteria', 'warning');
            return;
        }

        processRequest('search', { company, industry });
    });

    // Handle enhance form submission
    $('#enhanceForm').submit(function (e) {
        e.preventDefault();

        const industry = $('#enhanceIndustry').val();
        const country = $('#enhanceCountry').val();

        if (!industry || !country) {
            showAlert('Both industry and country are required', 'warning');
            return;
        }

        processRequest('enhance', { industry, country });
    });

    // Process API request
    function processRequest(type, data) {
        // Clear previous results
        $('#resultsSection').html(`
            <div class="card mt-4">
                <div class="card-body text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5 class="mt-3">Processing your ${type === 'search' ? 'search' : 'enhancement'} request...</h5>
                </div>
            </div>
        `);

        // Determine endpoint
        const endpoint = type === 'search' ? '/search_company' : '/enhance_lead';

        // Send request
        $.ajax({
            url: endpoint,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                displayResults(type, response);
            },
            error: function (xhr) {
                const error = xhr.responseJSON?.error || 'Request failed';
                showAlert(`Error: ${error}`, 'danger');
            }
        });
    }

    // Display results based on type
    function displayResults(type, data) {
        if (type === 'search') {
            $('#resultsSection').html(`
                <div class="fade-in">
                    <div class="result-card">
                        <div class="result-header bg-blue-50">
                            <i class="bi bi-building me-2 text-primary"></i>
                            Company Details
                        </div>
                        <div class="result-body">
                            ${renderCompanyDetails(data)}
                        </div>
                    </div>
                </div>
            `);
        }
        else { // enhance
            $('#resultsSection').html(`
                <div class="fade-in">
                    <div class="result-card">
                        <div class="result-header bg-teal-50">
                            <i class="bi bi-globe me-2 text-success"></i>
                            Global Opportunities
                        </div>
                        <div class="result-body">
                            ${renderOpportunities(data)}
                        </div>
                    </div>
                </div>
            `);
        }
    }

    // Render company details
    function renderCompanyDetails(data) {
        if (!data || !data.company) {
            return `<p class="text-center text-muted py-4">No company details found</p>`;
        }

        return `
            <div class="company-info">
                ${data.company.logo ?
                `<img src="${data.company.logo}" class="company-logo" alt="Logo">` :
                `<div class="company-logo d-flex align-items-center justify-content-center bg-blue-50">
                        <i class="bi bi-building text-primary fs-2"></i>
                    </div>`}
                <div>
                    <h3 class="h4">${data.company.name || 'N/A'}</h3>
                    <div class="d-flex align-items-center mb-2">
                        <span class="me-3">
                            <i class="bi bi-globe me-1 text-muted"></i>
                            <a href="https://${data.company.domain}" target="_blank" class="text-decoration-none">
                                ${data.company.domain || 'N/A'}
                            </a>
                        </span>
                        <span class="badge bg-blue-100 text-blue-800">
                            ${data.company.industry || 'Industry not specified'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5 class="mb-3">
                    <i class="bi bi-envelope me-2 text-primary"></i>
                    Contact Information
                </h5>
                <div class="d-flex flex-wrap">
                    ${renderEmails(data.emails)}
                </div>
            </div>
            
            <div class="mt-4 border-top pt-3">
                <button class="btn btn-outline-primary">
                    <i class="bi bi-download me-1"></i>Export Contacts
                </button>
            </div>
        `;
    }

    // Render emails
    function renderEmails(emails) {
        if (!emails || Object.keys(emails).length === 0) {
            return '<p class="text-muted">No email addresses found</p>';
        }

        let html = '';
        for (const [dept, addresses] of Object.entries(emails)) {
            if (addresses.length > 0) {
                html += `
                    <div class="mb-3 w-100">
                        <h6 class="text-uppercase text-muted small mb-2">${dept} Contacts</h6>
                        <div class="d-flex flex-wrap">
                            ${addresses.map(email => `
                                <a href="mailto:${email}" class="email-tag">
                                    <i class="bi bi-envelope me-1"></i>${email}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        return html;
    }

    // Render opportunities
    function renderOpportunities(data) {
        if (!data || !data.geo_expansion || data.geo_expansion.length === 0) {
            return '<p class="text-center text-muted py-4">No opportunities found</p>';
        }

        return `
            <p class="text-muted mb-4">Based on industry and location, we found these expansion opportunities:</p>
            
            <div class="row g-3">
                ${data.geo_expansion.map(company => `
                    <div class="col-md-6">
                        <div class="opportunity-card">
                            <div class="d-flex align-items-center">
                                <div class="bg-teal-100 text-teal-800 p-2 rounded me-3">
                                    <i class="bi bi-building fs-4"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-1">${company.name}</h6>
                                    <div class="d-flex">
                                        <span class="badge bg-teal-100 text-teal-800 me-2">
                                            <i class="bi bi-geo-alt me-1"></i> ${company.country}
                                        </span>
                                        <span class="badge bg-blue-100 text-blue-800">
                                            <i class="bi bi-tag me-1"></i> ${company.industry}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-4 border-top pt-3">
                <button class="btn btn-success">
                    <i class="bi bi-plus-circle me-1"></i>Add to Opportunity List
                </button>
                <button class="btn btn-outline-secondary ms-2">
                    <i class="bi bi-download me-1"></i>Export All
                </button>
            </div>
        `;
    }

    // Show alert message
    function showAlert(message, type) {
        $('#resultsSection').html(`
            <div class="alert alert-${type} alert-dismissible fade show">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }
});