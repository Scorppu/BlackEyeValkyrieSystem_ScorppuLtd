package com.scorppultd.blackeyevalkyriesystem.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import com.scorppultd.blackeyevalkyriesystem.service.UserService;

import java.util.Arrays;
import java.util.Collections;

/**
 * Security configuration for the Black Eye Valkyrie System.
 * This class configures Spring Security settings including:
 * - HTTP security rules for endpoints
 * - Authentication manager
 * - User details service
 * - Password encryption
 * 
 * It defines which endpoints are publicly accessible and which require authentication,
 * along with role-based access control for certain endpoints.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserService userService;

    /**
     * Configures the security filter chain for HTTP requests.
     * 
     * @param http The HttpSecurity object to configure
     * @return The built SecurityFilterChain
     * @throws Exception If an error occurs during configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                // Static resources and login page are publicly accessible
                .requestMatchers("/css/**", "/js/**", "/images/**", "/webjars/**").permitAll()
                .requestMatchers("/login", "/register", "/forgot-password", "/api/verify-license-key", "/api/users/check-username").permitAll()
                // Admin-only pages
                .requestMatchers("/drugs/**").hasRole("ADMIN")
                // Require authentication for API endpoints
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                // All other requests need authentication
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .accessDeniedPage("/access-denied")
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
                .logoutSuccessUrl("/login?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );
        
        return http.build();
    }
    
    /**
     * Creates a UserDetailsService that retrieves user authentication information.
     * First attempts to find the user in the database using the UserService.
     * If database lookup fails and the username is "admin", creates a default admin user.
     * 
     * @return A custom UserDetailsService
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            // First try to find the user in the database
            try {
                return userService.findUserByUsername(username)
                    .map(user -> {
                        if (!user.isActive()) {
                            throw new UsernameNotFoundException("User account is not active: " + username);
                        }
                        
                        String fullName = user.getFirstName() + " " + user.getLastName();
                        
                        return new CustomUserDetails(
                            user.getUsername(),
                            user.getPassword(),
                            user.isActive(),
                            true,
                            true,
                            true,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                            fullName
                        );
                    })
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            } catch (Exception e) {
                // If database lookup fails, check if it's the admin user
                if ("admin".equals(username)) {
                    return new CustomUserDetails(
                        "admin",
                        passwordEncoder().encode("admin"),
                        true,
                        true,
                        true,
                        true,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")),
                        "System Administrator"
                    );
                }
                throw e;
            }
        };
    }
    
    /**
     * Creates an AuthenticationManager that validates user credentials.
     * Uses DaoAuthenticationProvider with the custom UserDetailsService and BCrypt password encoder.
     * 
     * @return The configured AuthenticationManager
     */
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(authProvider);
    }
    
    /**
     * Creates a BCryptPasswordEncoder for secure password hashing.
     * 
     * @return The password encoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
} 