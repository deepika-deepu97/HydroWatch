package com.waterleak.identity.config;

import com.waterleak.identity.model.Role;
import com.waterleak.identity.model.User;
import com.waterleak.identity.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            String encodedAnalyst = passwordEncoder.encode("AnalystPass123!");
            String encodedResident = passwordEncoder.encode("ResidentPass123!");

            userRepository.save(new User(
                    "usr-analyst-001",
                    "analyst@utility.gov",
                    "analyst@utility.gov",
                    encodedAnalyst,
                    "Marcus Vance (Lead Analyst)",
                    Role.UTILITY_ANALYST,
                    "*"
            ));

            userRepository.save(new User(
                    "usr-resident-001",
                    "alice@home-a.com",
                    "alice@home-a.com",
                    encodedResident,
                    "Alice Chen (Home A Owner)",
                    Role.RESIDENT,
                    "PROP-HOME-A"
            ));

            userRepository.save(new User(
                    "usr-resident-002",
                    "bob@home-b.com",
                    "bob@home-b.com",
                    encodedResident,
                    "Bob Davis (Home B Owner)",
                    Role.RESIDENT,
                    "PROP-HOME-B"
            ));
        }
    }
}
