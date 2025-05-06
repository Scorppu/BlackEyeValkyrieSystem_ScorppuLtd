/**
 * Main application JavaScript
 * Handles sidebar navigation, search, UI interactions and form processing
 */
document.addEventListener('DOMContentLoaded', function() {
    /**
     * Initializes mobile menu toggle functionality
     */
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    /**
     * Implements search functionality for sidebar navigation items
     */
    const searchInput = document.getElementById('sidebar-search');
    const clearSearchButton = document.getElementById('clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase().trim();
            clearSearchButton.style.display = searchText.length > 0 ? 'block' : 'none';
            filterSidebarItems(searchText);
        });
        
        if (clearSearchButton) {
            clearSearchButton.addEventListener('click', function() {
                searchInput.value = '';
                clearSearchButton.style.display = 'none';
                searchInput.dispatchEvent(new Event('input'));
            });
        }
        
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                clearSearchButton.style.display = 'none';
                this.dispatchEvent(new Event('input'));
            }
        });
    }
    
    /**
     * Filters sidebar navigation items based on search text
     * @param {string} searchText - The text to search for in navigation items
     */
    function filterSidebarItems(searchText) {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(function(item) {
            const itemContent = item.querySelector('.nav-item-content') || item;
            const itemText = itemContent.textContent.toLowerCase().trim();
            
            const isDropdownToggle = item.classList.contains('dropdown-toggle');
            const dropdownMenu = isDropdownToggle ? item.nextElementSibling : null;
            
            if (searchText === '') {
                item.style.display = '';
                if (dropdownMenu) {
                    dropdownMenu.style.display = '';
                    dropdownMenu.querySelectorAll('.nav-subitem').forEach(subitem => {
                        subitem.style.display = '';
                    });
                }
            } else {
                if (!isDropdownToggle) {
                    item.style.display = itemText.includes(searchText) ? '' : 'none';
                } else {
                    const subItems = dropdownMenu.querySelectorAll('.nav-subitem');
                    let hasVisibleChild = false;
                    
                    subItems.forEach(function(subItem) {
                        const subItemText = subItem.textContent.toLowerCase().trim();
                        const subItemMatches = subItemText.includes(searchText);
                        
                        subItem.style.display = subItemMatches ? '' : 'none';
                        
                        if (subItemMatches) {
                            hasVisibleChild = true;
                        }
                    });
                    
                    const parentMatches = itemText.includes(searchText);
                    item.style.display = (parentMatches || hasVisibleChild) ? '' : 'none';
                    
                    if (parentMatches || hasVisibleChild) {
                        dropdownMenu.style.display = '';
                        dropdownMenu.classList.add('active');
                        dropdownMenu.style.maxHeight = dropdownMenu.scrollHeight + "px";
                        item.classList.add('expanded');
                    } else {
                        dropdownMenu.style.display = 'none';
                    }
                }
            }
        });
    }
    
    /**
     * Ensures appropriate sidebar dropdown is expanded based on current URL path
     * Handles special cases for consultation and dispensary sections
     */
    function fixSidebarNavigation() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('consultation') || currentPath.includes('dispensary')) {
            let selector = currentPath.includes('consultation') 
                ? 'a.nav-item[href="/consultation"]' 
                : 'a.nav-item[href="/dispensary"]';
            
            const navItem = document.querySelector(selector);
            if (navItem) {
                navItem.classList.add('active');
                setTimeout(() => {
                    navItem.classList.add('active');
                }, 500);
            }
        }
        
        const dropdownToggles = document.querySelectorAll('.nav-item.dropdown-toggle');
        
        dropdownToggles.forEach(function(toggle) {
            const dropdownMenu = toggle.nextElementSibling;
            if (!dropdownMenu || !dropdownMenu.classList.contains('dropdown-menu')) {
                return;
            }
            
            const links = dropdownMenu.querySelectorAll('a.nav-subitem');
            
            let shouldExpand = false;
            links.forEach(function(link) {
                const linkPath = link.getAttribute('href');
                if (currentPath.startsWith(linkPath)) {
                    shouldExpand = true;
                    link.classList.add('active');
                }
            });
            
            if (toggle.classList.contains('expanded')) {
                shouldExpand = true;
            }
            
            if (shouldExpand || currentPath.startsWith(toggle.getAttribute('data-path'))) {
                toggle.classList.add('expanded');
                dropdownMenu.classList.add('active');
                dropdownMenu.style.maxHeight = dropdownMenu.scrollHeight + "px";
            }
        });

        const directNavItems = document.querySelectorAll('a.nav-item:not(.dropdown-toggle)');
        
        directNavItems.forEach(function(item) {
            const itemPath = item.getAttribute('href');
            
            if (!itemPath) return;
                        
            if (currentPath === itemPath || currentPath.startsWith(itemPath + '/')) {
                console.log('Highlighting direct nav item:', item, 'path:', itemPath);
                item.classList.add('active');
                
                const container = item.querySelector('.nav-item-content');
                if (container) {
                    container.classList.add('active');
                }
            }
        });
    }
    
    /**
     * Sets up dropdown menu toggle functionality in the sidebar
     */
    const dropdownLinks = document.querySelectorAll('.dropdown-toggle');
    
    if (dropdownLinks.length > 0) {
        dropdownLinks.forEach(function(link) {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });
        
        const refreshedDropdownLinks = document.querySelectorAll('.dropdown-toggle');
        
        refreshedDropdownLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                console.log('Dropdown toggle clicked');
                e.preventDefault();
                e.stopPropagation();
                
                this.classList.toggle('expanded');
                
                const submenu = this.nextElementSibling;
                if (submenu && submenu.classList.contains('dropdown-menu')) {
                    if (submenu.classList.contains('active')) {
                        submenu.classList.remove('active');
                        submenu.style.maxHeight = null;
                    } else {
                        submenu.classList.add('active');
                        submenu.style.maxHeight = submenu.scrollHeight + "px";
                    }
                }
            });
        });
    }
    
    /**
     * Applies special fixes for consultation and dispensary menu items
     */
    function applySpecialMenuFixes() {
        const consultationItem = document.getElementById('consultation-nav-item');
        const dispensaryItem = document.getElementById('dispensary-nav-item');
        
        if (consultationItem && window.location.pathname.includes('/consultation')) {
            consultationItem.classList.add('active');
            const content = consultationItem.querySelector('.nav-item-content');
            if (content) content.classList.add('active');
        }
        
        if (dispensaryItem && window.location.pathname.includes('/dispensary')) {
            dispensaryItem.classList.add('active');
            const content = dispensaryItem.querySelector('.nav-item-content');
            if (content) content.classList.add('active');
        }
    }
    
    /**
     * Handles tab navigation within content pages
     */
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabItems.length > 0) {
        tabItems.forEach(function(tab) {
            tab.addEventListener('click', function() {
                const target = this.dataset.target;
                
                tabContents.forEach(function(content) {
                    content.classList.remove('active');
                });
                
                tabItems.forEach(function(tab) {
                    tab.classList.remove('active');
                });
                
                this.classList.add('active');
                const targetElement = document.getElementById(target);
                if (targetElement) {
                    targetElement.classList.add('active');
                } else {
                    console.warn(`Tab content element with ID '${target}' not found.`);
                }
            });
        });
        
        tabItems[0].click();
    }
    
    /**
     * Handles patient form submission via AJAX
     */
    const patientForm = document.getElementById('patient-form');
    
    if (patientForm) {
        patientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                sex: document.getElementById('sex').value,
                relativeName: document.getElementById('relativeName').value,
                dateOfBirth: document.getElementById('dateOfBirth').value,
                age: document.getElementById('age').value,
                maritalStatus: document.getElementById('maritalStatus').value,
                bloodType: document.getElementById('bloodType').value
            };
            
            fetch('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                alert('Patient profile created successfully!');
                
                window.location.href = '/patient/list';
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Error creating patient profile. Please try again.');
            });
        });
    }
    
    /**
     * Calculates age automatically from date of birth input
     */
    const dobField = document.getElementById('dateOfBirth');
    const ageField = document.getElementById('age');
    
    if (dobField && ageField) {
        dobField.addEventListener('change', function() {
            const dob = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            
            ageField.value = age;
        });
    }
    
    /**
     * Handles user profile dropdown toggle and animations
     */
    const userProfileToggle = document.getElementById('user-profile-toggle');
    const userProfileDropdown = document.getElementById('user-profile-dropdown');
    const profileArrow = document.querySelector('.profile-arrow');
    
    if (userProfileToggle && userProfileDropdown) {
        userProfileToggle.addEventListener('click', function() {
            if (userProfileDropdown.classList.contains('active')) {
                userProfileDropdown.style.animation = 'popdown 0.2s ease-out forwards';
                
                setTimeout(() => {
                    userProfileDropdown.classList.remove('active');
                    profileArrow.classList.remove('flipped');
                }, 200);
            } else {
                userProfileDropdown.classList.add('active');
                userProfileDropdown.style.animation = 'popup 0.2s ease-out';
                profileArrow.classList.add('flipped');
            }
        });
        
        document.addEventListener('click', function(event) {
            if (!userProfileToggle.contains(event.target) && 
                !userProfileDropdown.contains(event.target) && 
                userProfileDropdown.classList.contains('active')) {
                
                userProfileDropdown.style.animation = 'popdown 0.2s ease-out forwards';
                
                setTimeout(() => {
                    userProfileDropdown.classList.remove('active');
                    profileArrow.classList.remove('flipped');
                }, 200);
            }
        });
    }
    
    /**
     * Handles staff duty status toggle and persistence
     */
    const dutyToggleBtn = document.getElementById('duty-toggle');
    const dutyStatusText = document.getElementById('duty-status');
    
    if (dutyToggleBtn && dutyStatusText) {
        let isOnDuty = localStorage.getItem('dutyStatus') === 'on';
        let dutyTime = localStorage.getItem('dutyTime') || getCurrentTime();
        
        updateDutyStatus(isOnDuty, dutyTime);
        
        dutyToggleBtn.addEventListener('click', function() {
            isOnDuty = !isOnDuty;
            dutyTime = getCurrentTime();
            
            localStorage.setItem('dutyStatus', isOnDuty ? 'on' : 'off');
            localStorage.setItem('dutyTime', dutyTime);
            
            updateDutyStatus(isOnDuty, dutyTime);
        });
    }
    
    /**
     * Updates the duty status text and button based on current state
     * @param {boolean} isOnDuty - Whether the user is currently on duty
     * @param {string} time - The time to display in the status text
     */
    function updateDutyStatus(isOnDuty, time) {
        if (dutyToggleBtn && dutyStatusText) {
            if (isOnDuty) {
                dutyStatusText.textContent = `On Duty Since ${time}`;
                dutyToggleBtn.textContent = 'Off Duty';
                dutyToggleBtn.classList.remove('off');
            } else {
                dutyStatusText.textContent = `Last On Duty ${time}`;
                dutyToggleBtn.textContent = 'On Duty';
                dutyToggleBtn.classList.add('off');
            }
        }
    }
    
    /**
     * Returns the current time formatted as HH:MM
     * @returns {string} The current time in HH:MM format
     */
    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    // Initialize sidebar navigation
    setTimeout(fixSidebarNavigation, 100);
    applySpecialMenuFixes();
    
    // Add event listeners for navigation changes
    window.addEventListener('resize', fixSidebarNavigation);
    window.addEventListener('popstate', fixSidebarNavigation);
    
    // Add additional listener for clicks on special links
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.closest('a[href="/consultation"]') || e.target.closest('a[href="/dispensary"]'))) {
            setTimeout(fixSidebarNavigation, 300);
        }
    });
}); 