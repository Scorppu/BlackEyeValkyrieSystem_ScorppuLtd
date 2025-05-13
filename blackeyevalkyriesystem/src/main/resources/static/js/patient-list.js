/**
 * Patient List Page JavaScript
 * 
 * This file handles the interactive functionality of the patient list page.
 * 
 * Features:
 * - Handles pagination controls (header and footer) with prev/next navigation
 * - Manages rows per page selection and updates URL accordingly
 * - Implements real-time patient search filtering by name
 * - Updates pagination information based on search results
 * - Displays notifications from session storage
 * 
 * Functions:
 * - updatePaginationInfo: Updates pagination text based on visible/filtered rows
 * - setupPaginationButtons: Configures prev/next pagination buttons with proper state and event listeners
 * - displayNotificationFromSession: Retrieves and displays notifications from session storage
 * - displayNotification: Shows notification messages of specified type (implementation logs to console only)
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Patient List page loaded');
    
    // Check for notification in sessionStorage
    displayNotificationFromSession();
    
    // Handle rows per page change - footer
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    if (rowsPerPageSelect) {
        rowsPerPageSelect.addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('rowsPerPage', this.value);
            url.searchParams.set('page', '1'); // Reset to first page
            window.location.href = url.toString();
        });
    }
    
    // Handle rows per page change - header
    const headerRowsPerPageSelect = document.getElementById('headerRowsPerPage');
    if (headerRowsPerPageSelect) {
        headerRowsPerPageSelect.addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('rowsPerPage', this.value);
            url.searchParams.set('page', '1'); // Reset to first page
            window.location.href = url.toString();
        });
    }
    
    // Safely get pagination variables
    const tableElement = document.querySelector('.patient-table');
    const totalPatients = tableElement ? parseInt(tableElement.getAttribute('data-total-patients') || '0') : 0;
    const rowsPerPage = rowsPerPageSelect ? parseInt(rowsPerPageSelect.value || '10') : 10;
    const currentPage = parseInt(new URLSearchParams(window.location.search).get('page') || '1');
    
    // Handle pagination buttons - footer
    const prevPageButton = document.querySelector('.prev-page');
    const nextPageButton = document.querySelector('.next-page');
    
    // Handle pagination buttons - header
    const headerPrevPageButton = document.querySelector('.header-prev-page');
    const headerNextPageButton = document.querySelector('.header-next-page');
    
    // Setup pagination buttons - footer
    setupPaginationButtons(prevPageButton, nextPageButton, currentPage, rowsPerPage, totalPatients);
    
    // Setup pagination buttons - header
    setupPaginationButtons(headerPrevPageButton, headerNextPageButton, currentPage, rowsPerPage, totalPatients);
            
    // Patient search functionality
    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const patientRows = document.querySelectorAll('.patient-table tbody tr:not(:last-child)');
            
            patientRows.forEach(row => {
                const patientName = row.querySelector('td:first-child a').textContent.toLowerCase();
                if (patientName.includes(searchTerm)) {
                    row.style.display = '';
            } else {
                    row.style.display = 'none';
                }
            });
            
            // Update the showing X-Y of Z text
            updatePaginationInfo(patientRows, searchTerm);
        });
        }
        
    /**
     * Updates pagination information text based on search results
     * 
     * @param {NodeList} rows - Collection of patient table rows
     * @param {string} searchTerm - Current search filter text
     * 
     * If searchTerm is empty, displays regular pagination info (showing X-Y of Z).
     * If filtering is active, shows count of filtered results.
     */
    function updatePaginationInfo(rows, searchTerm) {
        if (!searchTerm) {
            // Reset to original pagination info if search is cleared
            document.querySelectorAll('.pagination-info').forEach(info => {
                const start = (currentPage - 1) * rowsPerPage + 1;
                const end = Math.min((currentPage - 1) * rowsPerPage + rows.length, totalPatients);
                info.textContent = `Showing ${start} - ${end} of ${totalPatients}`;
            });
            return;
        }
        
        // Count visible rows after filtering
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none').length;
        
        // Update both header and footer pagination info
        document.querySelectorAll('.pagination-info').forEach(info => {
            info.textContent = `Showing ${visibleRows} filtered results`;
        });
    }
    
    /**
     * Sets up pagination buttons with proper state and event listeners
     * 
     * @param {HTMLElement} prevButton - Previous page button element
     * @param {HTMLElement} nextButton - Next page button element
     * @param {number} page - Current page number
     * @param {number} rowsPerPage - Number of rows displayed per page
     * @param {number} total - Total number of patients
     * 
     * Disables buttons appropriately based on current page and total records.
     * Adds click handlers to navigate between pages.
     */
    function setupPaginationButtons(prevButton, nextButton, page, rowsPerPage, total) {
        if (!prevButton || !nextButton) return;
        
        try {
            // Disable prev button on first page
            prevButton.disabled = page <= 1;
            
            // Disable next button on last page
            nextButton.disabled = (page * rowsPerPage) >= total;
        
            // Add event listeners
            prevButton.addEventListener('click', function() {
                if (page > 1) {
                    const url = new URL(window.location);
                    url.searchParams.set('page', (page - 1).toString());
                    window.location.href = url.toString();
                }
            });
            
            nextButton.addEventListener('click', function() {
                if ((page * rowsPerPage) < total) {
                    const url = new URL(window.location);
                    url.searchParams.set('page', (page + 1).toString());
                    window.location.href = url.toString();
                }
            });
        } catch (e) {
            console.error('Error setting up pagination buttons:', e);
        }
    }
    
    /**
     * Retrieves and displays notification from session storage
     * 
     * Checks for 'notification' item in sessionStorage, displays it if found,
     * and then removes it to prevent showing the same notification multiple times.
     */
    function displayNotificationFromSession() {
        const notification = sessionStorage.getItem('notification');
        if (notification) {
            const notificationData = JSON.parse(notification);
            displayNotification(notificationData.type, notificationData.message);
            sessionStorage.removeItem('notification'); // Clear after displaying
        }
    }
    
    /**
     * Displays a notification message
     * 
     * @param {string} type - The type of notification (e.g., 'success', 'error')
     * @param {string} message - The notification message text
     * 
     * Currently only logs to console, implementation for UI display would be added here.
     */
    function displayNotification(type, message) {
        // Implementation of displayNotification function
        console.log(`Notification: ${type} - ${message}`);
    }
});