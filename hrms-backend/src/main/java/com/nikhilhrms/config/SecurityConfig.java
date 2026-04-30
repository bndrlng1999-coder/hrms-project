package com.nikhilhrms.config;

import com.nikhilhrms.security.JwtAuthenticationFilter;
import com.nikhilhrms.security.PermissionRegistry;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth

                // IMPORTANT: allow browser CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public auth APIs
                .requestMatchers("/auth/login", "/auth/validate").permitAll()

                // Public system docs/health
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                // Employees
                .requestMatchers(HttpMethod.DELETE, "/employees/**").hasAuthority(PermissionRegistry.EMPLOYEE_DELETE)
                .requestMatchers(HttpMethod.POST, "/employees/**").hasAnyAuthority(
                        PermissionRegistry.EMPLOYEE_CREATE,
                        PermissionRegistry.INTERN_CREATE)
                .requestMatchers(HttpMethod.PUT, "/employees/**").hasAnyAuthority(
                        PermissionRegistry.EMPLOYEE_UPDATE,
                        PermissionRegistry.EMPLOYEE_CREATE)
                .requestMatchers("/employees/**").hasAnyAuthority(
                        PermissionRegistry.EMPLOYEE_VIEW_ALL,
                        PermissionRegistry.EMPLOYEE_VIEW_SELF,
                        PermissionRegistry.EMPLOYEE_CREATE,
                        PermissionRegistry.EMPLOYEE_UPDATE)

                // Attendance
                .requestMatchers("/attendance/**").hasAnyAuthority(
                        PermissionRegistry.ATTENDANCE_VIEW,
                        PermissionRegistry.ATTENDANCE_MANAGE,
                        PermissionRegistry.ATTENDANCE_APPROVE)

                // Holidays & shifts
                .requestMatchers(HttpMethod.POST, "/holidays/**").hasAuthority(PermissionRegistry.HOLIDAY_CREATE)
                .requestMatchers(HttpMethod.PUT, "/holidays/**").hasAuthority(PermissionRegistry.HOLIDAY_UPDATE)
                .requestMatchers(HttpMethod.POST, "/shifts").hasAuthority(PermissionRegistry.SHIFT_CREATE)
                .requestMatchers(HttpMethod.PUT, "/shifts/**").hasAuthority(PermissionRegistry.SHIFT_CREATE)
                .requestMatchers("/shifts/assign").hasAuthority(PermissionRegistry.SHIFT_ASSIGN)

                // Leave
                .requestMatchers("/leave/pending", "/leave/*/approve", "/leave/*/reject")
                    .hasAuthority(PermissionRegistry.LEAVE_APPROVE)
                .requestMatchers("/leave/**").hasAuthority(PermissionRegistry.LEAVE_APPLY)

                // Payroll
                .requestMatchers("/payroll/**").hasAnyAuthority(
                        PermissionRegistry.PAYROLL_MANAGE,
                        PermissionRegistry.PAYSLIP_GENERATE)
                .requestMatchers("/payslips/**").hasAnyAuthority(
                        PermissionRegistry.PAYROLL_VIEW,
                        PermissionRegistry.PAYROLL_MANAGE,
                        PermissionRegistry.PAYSLIP_CREATE,
                        PermissionRegistry.PAYSLIP_GENERATE)

                // Helpdesk
                .requestMatchers("/helpdesk/tickets/*/reply").hasAnyAuthority(
                        PermissionRegistry.HELPDESK_REPLY,
                        PermissionRegistry.HELPDESK_MANAGE)
                .requestMatchers("/helpdesk/**").authenticated()

                // Documents
                .requestMatchers("/documents/**").hasAnyAuthority(
                        PermissionRegistry.EMPLOYEE_VIEW_SELF,
                        PermissionRegistry.EMPLOYEE_VIEW_ALL,
                        PermissionRegistry.EMPLOYEE_UPDATE)

                // Announcements
                .requestMatchers(HttpMethod.POST, "/announcements/**").hasAuthority(PermissionRegistry.ANNOUNCEMENT_CREATE)
                .requestMatchers(HttpMethod.PUT, "/announcements/**").hasAuthority(PermissionRegistry.ANNOUNCEMENT_UPDATE)
                .requestMatchers(HttpMethod.DELETE, "/announcements/**").hasAuthority(PermissionRegistry.ANNOUNCEMENT_UPDATE)
                .requestMatchers("/announcements/**").authenticated()

                // Project tracker
                .requestMatchers(HttpMethod.GET, "/projects/**", "/sprints/**").hasAnyAuthority(
                        PermissionRegistry.PROJECT_CREATE,
                        PermissionRegistry.PROJECT_UPDATE,
                        PermissionRegistry.PROJECT_MANAGE,
                        PermissionRegistry.ISSUE_CREATE,
                        PermissionRegistry.ISSUE_UPDATE)
                .requestMatchers(HttpMethod.POST, "/projects/**").hasAuthority(PermissionRegistry.PROJECT_CREATE)
                .requestMatchers(HttpMethod.PUT, "/projects/**").hasAnyAuthority(
                        PermissionRegistry.PROJECT_UPDATE,
                        PermissionRegistry.PROJECT_MANAGE)
                .requestMatchers(HttpMethod.POST, "/sprints/**").hasAuthority(PermissionRegistry.SPRINT_CREATE)
                .requestMatchers(HttpMethod.PUT, "/sprints/**").hasAnyAuthority(
                        PermissionRegistry.SPRINT_UPDATE,
                        PermissionRegistry.PROJECT_MANAGE)
                .requestMatchers("/projects/**", "/sprints/**").hasAnyAuthority(
                        PermissionRegistry.PROJECT_CREATE,
                        PermissionRegistry.PROJECT_UPDATE,
                        PermissionRegistry.PROJECT_MANAGE)

                // Issues
                .requestMatchers("/issues/**").hasAnyAuthority(
                        PermissionRegistry.ISSUE_CREATE,
                        PermissionRegistry.ISSUE_ASSIGN,
                        PermissionRegistry.ISSUE_UPDATE,
                        PermissionRegistry.ISSUE_DELETE)

                // Reports
                .requestMatchers("/reports/**").hasAnyAuthority(
                        PermissionRegistry.REPORT_VIEW,
                        PermissionRegistry.ATTENDANCE_MANAGE,
                        PermissionRegistry.ATTENDANCE_APPROVE,
                        PermissionRegistry.PAYROLL_MANAGE)

                // Notifications
                .requestMatchers("/notifications/**").authenticated()

                // Internal mail
                .requestMatchers("/internal-mails/compose", "/internal-mails/*/reply", "/internal-mails/*/forward")
                    .hasAuthority(PermissionRegistry.INTERNAL_MAIL_SEND)
                .requestMatchers("/internal-mails/**").hasAuthority(PermissionRegistry.INTERNAL_MAIL_VIEW)

                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) ->
                    writeSecurityError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required"))
                .accessDeniedHandler((request, response, accessDeniedException) ->
                    writeSecurityError(response, HttpServletResponse.SC_FORBIDDEN, "You do not have permission to perform this action"))
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void writeSecurityError(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\",\"data\":null,\"statusCode\":" + status + "}");
    }
}