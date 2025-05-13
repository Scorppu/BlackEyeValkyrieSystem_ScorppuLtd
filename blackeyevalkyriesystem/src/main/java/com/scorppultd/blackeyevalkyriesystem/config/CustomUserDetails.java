package com.scorppultd.blackeyevalkyriesystem.config;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

/**
 * Custom implementation of Spring Security's User class that includes the user's full name.
 * This class extends the standard User class to add additional user information while
 * maintaining all the security functionalities provided by Spring Security.
 */
public class CustomUserDetails extends User {

    private String fullName;

    /**
     * Constructs a CustomUserDetails instance with all required User properties plus the user's full name.
     *
     * @param username the username presented to the authentication provider
     * @param password the password presented to the authentication provider
     * @param enabled set to true if the user is enabled
     * @param accountNonExpired set to true if the user account is not expired
     * @param credentialsNonExpired set to true if the user's credentials are not expired
     * @param accountNonLocked set to true if the user account is not locked
     * @param authorities the authorities granted to the user
     * @param fullName the full name of the user
     */
    public CustomUserDetails(String username, String password, 
                             boolean enabled, boolean accountNonExpired,
                             boolean credentialsNonExpired, boolean accountNonLocked,
                             Collection<? extends GrantedAuthority> authorities,
                             String fullName) {
        super(username, password, enabled, accountNonExpired, 
              credentialsNonExpired, accountNonLocked, authorities);
        this.fullName = fullName;
    }

    /**
     * Returns the user's full name.
     *
     * @return the full name of the user
     */
    public String getFullName() {
        return fullName;
    }
} 