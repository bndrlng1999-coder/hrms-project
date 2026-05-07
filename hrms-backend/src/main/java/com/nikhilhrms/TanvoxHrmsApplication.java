package com.nikhilhrms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@SpringBootApplication
@EnableScheduling
public class TanvoxHrmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TanvoxHrmsApplication.class, args);
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        allowedOrigins().forEach(config::addAllowedOriginPattern);
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }

    private java.util.List<String> allowedOrigins() {
        String frontendUrl = System.getenv("FRONTEND_URL");
        String origins = System.getenv().getOrDefault(
                "CORS_ALLOWED_ORIGINS",
                "https://*.vercel.app"
        );
        String combinedOrigins = frontendUrl == null || frontendUrl.isBlank() ? origins : origins + "," + frontendUrl;
        return Arrays.stream(combinedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }
}
