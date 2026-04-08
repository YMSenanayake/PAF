package com.smartcampus.paf_assignment.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Passes 'login_hint' from the incoming request query param to the Google
 * authorization URL. This lets Google skip the account chooser for returning
 * users who we already know the email of.
 */
@Component
public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository repo) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(repo, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest authRequest = defaultResolver.resolve(request);
        return customize(authRequest, request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest authRequest = defaultResolver.resolve(request, clientRegistrationId);
        return customize(authRequest, request);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest authRequest, HttpServletRequest request) {
        if (authRequest == null) return null;

        Map<String, Object> additionalParams = new HashMap<>(authRequest.getAdditionalParameters());

        // Forward login_hint if provided (pre-fills / skips Google account chooser)
        String loginHint = request.getParameter("login_hint");
        if (loginHint != null && !loginHint.isBlank()) {
            additionalParams.put("login_hint", loginHint);
        }

        // Forward prompt if provided (e.g. "select_account" to force account chooser after sign-out)
        String prompt = request.getParameter("prompt");
        if (prompt != null && !prompt.isBlank()) {
            additionalParams.put("prompt", prompt);
        }

        return OAuth2AuthorizationRequest.from(authRequest)
                .additionalParameters(additionalParams)
                .build();
    }
}
