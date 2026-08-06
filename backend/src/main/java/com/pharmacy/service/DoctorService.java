package com.pharmacy.service;

import com.pharmacy.dto.DoctorDTO;
import com.pharmacy.dto.VerifyRequest;
import com.pharmacy.entity.Doctor;
import com.pharmacy.exception.BadRequestException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.DoctorRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public DoctorService(DoctorRepository doctorRepository, PasswordEncoder passwordEncoder) {
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<DoctorDTO> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DoctorDTO> getActiveDoctors() {
        return doctorRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DoctorDTO getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        return toDTO(doctor);
    }

    public List<DoctorDTO> searchDoctors(String name) {
        return doctorRepository.findByFullNameContainingIgnoreCase(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorDTO createDoctor(DoctorDTO dto) {
        Doctor doctor = Doctor.builder()
                .fullName(dto.getFullName())
                .gender(dto.getGender())
                .dateOfBirth(dto.getDateOfBirth())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .state(dto.getState())
                .pincode(dto.getPincode())
                .aadhaarNumber(dto.getAadhaarNumber())
                .panNumber(dto.getPanNumber())
                .registrationNumber(dto.getRegistrationNumber())
                .registrationCouncil(dto.getRegistrationCouncil())
                .qualification(dto.getQualification())
                .specialization(dto.getSpecialization())
                .passcodeHash(dto.getPasscode() != null && !dto.getPasscode().isEmpty()
                        ? passwordEncoder.encode(dto.getPasscode()) : null)
                .active(true)
                .build();
        doctor = doctorRepository.save(doctor);
        return toDTO(doctor);
    }

    @Transactional
    public DoctorDTO updateDoctor(Long id, DoctorDTO dto) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        doctor.setFullName(dto.getFullName());
        doctor.setGender(dto.getGender());
        doctor.setDateOfBirth(dto.getDateOfBirth());
        doctor.setPhone(dto.getPhone());
        doctor.setEmail(dto.getEmail());
        doctor.setAddress(dto.getAddress());
        doctor.setState(dto.getState());
        doctor.setPincode(dto.getPincode());
        doctor.setAadhaarNumber(dto.getAadhaarNumber());
        doctor.setPanNumber(dto.getPanNumber());
        doctor.setRegistrationNumber(dto.getRegistrationNumber());
        doctor.setRegistrationCouncil(dto.getRegistrationCouncil());
        doctor.setQualification(dto.getQualification());
        doctor.setSpecialization(dto.getSpecialization());
        if (dto.getPasscode() != null && !dto.getPasscode().isEmpty()) {
            doctor.setPasscodeHash(passwordEncoder.encode(dto.getPasscode()));
        }
        if (dto.getActive() != null) {
            doctor.setActive(dto.getActive());
        }
        doctor = doctorRepository.save(doctor);
        return toDTO(doctor);
    }

    @Transactional
    public void toggleDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        doctor.setActive(!doctor.getActive());
        doctorRepository.save(doctor);
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        doctorRepository.delete(doctor);
    }

    public boolean verifyPasscode(VerifyRequest request) {
        Doctor doctor = doctorRepository.findById(request.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getId()));
        if (doctor.getPasscodeHash() == null || doctor.getPasscodeHash().isEmpty()) {
            throw new BadRequestException("Doctor has no passcode set");
        }
        return passwordEncoder.matches(request.getPasscode(), doctor.getPasscodeHash());
    }

    private DoctorDTO toDTO(Doctor doctor) {
        return DoctorDTO.builder()
                .id(doctor.getId())
                .fullName(doctor.getFullName())
                .gender(doctor.getGender())
                .dateOfBirth(doctor.getDateOfBirth())
                .phone(doctor.getPhone())
                .email(doctor.getEmail())
                .address(doctor.getAddress())
                .state(doctor.getState())
                .pincode(doctor.getPincode())
                .aadhaarNumber(doctor.getAadhaarNumber())
                .panNumber(doctor.getPanNumber())
                .registrationNumber(doctor.getRegistrationNumber())
                .registrationCouncil(doctor.getRegistrationCouncil())
                .qualification(doctor.getQualification())
                .specialization(doctor.getSpecialization())
                .active(doctor.getActive())
                .createdAt(doctor.getCreatedAt())
                .build();
    }
}
