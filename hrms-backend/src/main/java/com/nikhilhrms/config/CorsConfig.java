package com.nikhilhrms.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(CorsConfig.class);
    private static final List<String> DEFAULT_ORIGINS = List.of(
            "https://*.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
    );
    private static final List<String> ALLOWED_METHODS = List.of("GET", "POST", "PUT", "DELETE", "OPTIONS");
    private static final List<String> ALLOWED_HEADERS = List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With");

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = buildConfiguration();
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        log.info("CORS configured for origins: {}", configuration.getAllowedOriginPatterns());
        return source;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        CorsConfiguration configuration = buildConfiguration();
        registry.addMapping("/**")
                .allowedOriginPatterns(configuration.getAllowedOriginPatterns().toArray(String[]::new))
                .allowedMethods(ALLOWED_METHODS.toArray(String[]::new))
                .allowedHeaders(ALLOWED_HEADERS.toArray(String[]::new))
                .exposedHeaders("Authorization")
                .allowCredentials(false)
                .maxAge(3600);
    }

    private CorsConfiguration buildConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();
        allowedOrigins().forEach(configuration::addAllowedOriginPattern);
        ALLOWED_METHODS.forEach(configuration::addAllowedMethod);
        ALLOWED_HEADERS.forEach(configuration::addAllowedHeader);
        configuration.addExposedHeader("Authorization");
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);
        return configuration;
    }

    private List<String> allowedOrigins() {
        String frontendUrl = System.getenv("FRONTEND_URL");
        String configuredOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
        String combined = configuredOrigins == null || configuredOrigins.isBlank()
                ? String.join(",", DEFAULT_ORIGINS)
                : configuredOrigins;
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            combined = combined + "," + frontendUrl;
        }
        return Arrays.stream(combined.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .distinct()
                .toList();
    }
}
