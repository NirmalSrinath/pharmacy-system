package com.pharmacy.service;

import com.pharmacy.dto.LoginRequest;
import com.pharmacy.dto.LoginResponse;
import com.pharmacy.dto.RegisterRequest;
import com.pharmacy.entity.Role;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BadRequestException;
import com.pharmacy.repository.RoleRepository;
import com.pharmacy.repository.UserRepository;
import com.pharmacy.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("User not found"));

        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .roles(roleNames)
                .fullName(user.getFullName())
                .userId(user.getId())
                .build();
    }

    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists: " + request.getUsername());
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            for (String roleName : request.getRoles()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new BadRequestException("Invalid role: " + roleName));
                roles.add(role);
            }
        } else {
            Role defaultRole = roleRepository.findByName("SALESPERSON")
                    .orElseThrow(() -> new BadRequestException("Default role not found"));
            roles.add(defaultRole);
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .roles(roles)
                .enabled(true)
                .build();

        userRepository.save(user);

        List<String> roleNames = roles.stream().map(Role::getName).collect(Collectors.toList());
        String token = tokenProvider.generateToken(user.getUsername(), roleNames);

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .roles(roleNames)
                .fullName(user.getFullName())
                .userId(user.getId())
                .build();
    }
}
