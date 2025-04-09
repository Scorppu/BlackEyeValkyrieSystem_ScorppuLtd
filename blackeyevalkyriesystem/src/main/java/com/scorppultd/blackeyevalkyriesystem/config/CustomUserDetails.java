package com.scorppultd.blackeyevalkyriesystem.config;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

public class CustomUserDetails extends User {

    private String fullName;

    public CustomUserDetails(String username, String password, 
                             boolean enabled, boolean accountNonExpired,
                             boolean credentialsNonExpired, boolean accountNonLocked,
                             Collection<? extends GrantedAuthority> authorities,
                             String fullName) {
        super(username, password, enabled, accountNonExpired, 
              credentialsNonExpired, accountNonLocked, authorities);
        this.fullName = fullName;
    }

    public String getFullName() {
        return fullName;
    }
} 