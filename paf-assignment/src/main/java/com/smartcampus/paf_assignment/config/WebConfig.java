package com.smartcampus.paf_assignment.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves files from the local 'uploads/' directory at /uploads/**
 * so the frontend can display ticket evidence images directly via URL.
 *
 * Example: GET http://localhost:8080/uploads/1712345678_photo.jpg
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}
