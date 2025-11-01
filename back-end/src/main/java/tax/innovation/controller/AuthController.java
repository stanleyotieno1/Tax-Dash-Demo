package tax.innovation.controller;

import tax.innovation.dto.LoginDto;
import tax.innovation.dto.SignUpDto;
import tax.innovation.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody SignUpDto signUpDto) {
        
        try {
            authService.registerUser(signUpDto);
            System.out.println("User registered successfully");
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User registered successfully! Please check your email to verify your account.");
            response.put("requiresVerification", true);

            return new ResponseEntity<>(response, HttpStatus.CREATED);
            
        } catch (IllegalArgumentException e) {
            System.err.println("Registration failed: " + e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            System.err.println("🚨 Unexpected error during registration: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An unexpected error occurred. Please try again.");
            
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestParam("token") String token) {
        boolean isVerified = authService.verifyToken(token);
        Map<String, Object> response = new HashMap<>();
        
        if (isVerified) {
            response.put("success", true);
            response.put("message", "Email successfully verified!");
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
        
        response.put("success", false);
        response.put("message", "Invalid or expired verification token.");
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginDto loginDto) {
        try {
            String token = authService.loginUser(loginDto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("token", token);
            response.put("message", "Login successful");
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Invalid credentials");
            
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }
    }
}