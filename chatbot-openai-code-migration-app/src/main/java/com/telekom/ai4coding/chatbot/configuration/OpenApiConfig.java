package com.telekom.ai4coding.chatbot.configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI configuration for API documentation.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8152}")
    private String serverPort;

    @Value("${info.app.version:0.0.2-SNAPSHOT}")
    private String applicationVersion;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Advanced Coding Assistant API")
                        .version(applicationVersion)
                        .description("REST API for VS Code extension integration and AI-powered code assistance")
                        .contact(new Contact()
                                .name("AI4Coding Team")
                                .email("ai4coding@telekom.de"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local development server"),
                        new Server()
                                .url("http://127.0.0.1:" + serverPort)
                                .description("Local development server (127.0.0.1)")
                ));
    }
}
