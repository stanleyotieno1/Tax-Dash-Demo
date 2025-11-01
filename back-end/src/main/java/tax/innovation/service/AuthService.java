package tax.innovation.service;

import tax.innovation.dto.LoginDto;
import tax.innovation.dto.SignUpDto;
import tax.innovation.model.User;
import tax.innovation.repository.UserRepository;
import tax.innovation.security.JwtTokenProvider;
import tax.innovation.messaging.EmailMessageSender;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.util.UUID;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailMessageSender emailMessageSender;

        @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public String loginUser(LoginDto loginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDto.getEmail(),
                        loginDto.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        return jwtTokenProvider.generateToken(authentication);
    }

    public void registerUser(SignUpDto signUpDto) {
        // Existing validation checks...

        if (userRepository.existsByKraPin(signUpDto.getKraPin())) {
            throw new IllegalArgumentException("KRA PIN is already registered.");
        }
        if (userRepository.existsByEmail(signUpDto.getEmail())) {
            throw new IllegalArgumentException("Email is already in use.");
        }
        if (userRepository.existsByPhone(signUpDto.getPhone())) {
            throw new IllegalArgumentException("Phone number is already registered.");
        }

        User user = new User();
        user.setCompany(signUpDto.getCompany());
        user.setKraPin(signUpDto.getKraPin());
        user.setPhone(signUpDto.getPhone());
        user.setEmail(signUpDto.getEmail());
        user.setPassword(passwordEncoder.encode(signUpDto.getPassword()));
        user.setVerified(false);

        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        userRepository.save(user);

        String verificationLink = "http://localhost:8084/api/auth/verify?token=" + verificationToken;
        emailMessageSender.sendVerificationEmail(signUpDto.getEmail(), verificationLink);
    }

    public boolean verifyToken(String token) {
        Optional<User> userOptional = userRepository.findByVerificationToken(token);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setVerified(true);
            user.setVerificationToken(null); // Invalidate token after use
            userRepository.save(user);
            return true;
        }
        return false;
    }
}