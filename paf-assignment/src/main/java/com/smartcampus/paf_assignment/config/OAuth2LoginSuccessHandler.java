package com.smartcampus.paf_assignment.config;

import com.smartcampus.paf_assignment.entity.User;
import com.smartcampus.paf_assignment.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        try {
            // 1. Get the user's details from Google
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String email = oAuth2User.getAttribute("email");
            String name  = oAuth2User.getAttribute("name");

            if (email == null) {
                System.err.println("[OAuth2] Google did not return an email — check OAuth2 scope includes 'email'");
                response.sendRedirect("http://localhost:3000/?error=oauth_failed");
                return;
            }

            // 2. Check if they exist in our database. If not, auto-register them.
            User user = userRepository.findByEmail(email);
            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setFullName(name != null ? name : email);
                user.setRole("USER"); // All new Google sign-ins default to standard USER
                userRepository.save(user);
                System.out.println("[OAuth2] New user registered: " + email);
            } else {
                System.out.println("[OAuth2] Existing user logged in: " + email);
            }

            // 3. Generate the secure JWT Token
            String token = jwtUtils.generateJwtToken(authentication);

            // 4. Redirect the user back to the React frontend, carrying the token in the URL
            response.sendRedirect("http://localhost:3000/oauth-redirect?token=" + token);

        } catch (Exception e) {
            // Catch any unexpected error (DB issue, JWT error, etc.) and redirect gracefully
            System.err.println("[OAuth2 SUCCESS HANDLER ERROR] " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace(System.err);
            response.sendRedirect("http://localhost:3000/?error=oauth_failed");
        }
    }
}