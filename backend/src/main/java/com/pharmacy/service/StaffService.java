package com.pharmacy.service;

import com.pharmacy.dto.StaffDTO;
import com.pharmacy.dto.VerifyRequest;
import com.pharmacy.entity.Staff;
import com.pharmacy.exception.BadRequestException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.StaffRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffService(StaffRepository staffRepository, PasswordEncoder passwordEncoder) {
        this.staffRepository = staffRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<StaffDTO> getAllStaff() {
        return staffRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<StaffDTO> getActiveStaff() {
        return staffRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public StaffDTO getStaffById(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        return toDTO(staff);
    }

    public List<StaffDTO> searchStaff(String name) {
        return staffRepository.findByFullNameContainingIgnoreCase(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffDTO createStaff(StaffDTO dto) {
        Staff staff = Staff.builder()
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
                .employeeId(dto.getEmployeeId())
                .designation(dto.getDesignation())
                .department(dto.getDepartment())
                .qualification(dto.getQualification())
                .dateOfJoining(dto.getDateOfJoining())
                .passcodeHash(dto.getPasscode() != null && !dto.getPasscode().isEmpty()
                        ? passwordEncoder.encode(dto.getPasscode()) : null)
                .active(true)
                .build();
        staff = staffRepository.save(staff);
        return toDTO(staff);
    }

    @Transactional
    public StaffDTO updateStaff(Long id, StaffDTO dto) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        staff.setFullName(dto.getFullName());
        staff.setGender(dto.getGender());
        staff.setDateOfBirth(dto.getDateOfBirth());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setAddress(dto.getAddress());
        staff.setState(dto.getState());
        staff.setPincode(dto.getPincode());
        staff.setAadhaarNumber(dto.getAadhaarNumber());
        staff.setPanNumber(dto.getPanNumber());
        staff.setEmployeeId(dto.getEmployeeId());
        staff.setDesignation(dto.getDesignation());
        staff.setDepartment(dto.getDepartment());
        staff.setQualification(dto.getQualification());
        staff.setDateOfJoining(dto.getDateOfJoining());
        if (dto.getPasscode() != null && !dto.getPasscode().isEmpty()) {
            staff.setPasscodeHash(passwordEncoder.encode(dto.getPasscode()));
        }
        if (dto.getActive() != null) {
            staff.setActive(dto.getActive());
        }
        staff = staffRepository.save(staff);
        return toDTO(staff);
    }

    @Transactional
    public void toggleStaff(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        staff.setActive(!staff.getActive());
        staffRepository.save(staff);
    }

    @Transactional
    public void deleteStaff(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
        staffRepository.delete(staff);
    }

    public boolean verifyPasscode(VerifyRequest request) {
        Staff staff = staffRepository.findById(request.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", request.getId()));
        if (staff.getPasscodeHash() == null || staff.getPasscodeHash().isEmpty()) {
            throw new BadRequestException("Staff has no passcode set");
        }
        return passwordEncoder.matches(request.getPasscode(), staff.getPasscodeHash());
    }

    private StaffDTO toDTO(Staff staff) {
        return StaffDTO.builder()
                .id(staff.getId())
                .fullName(staff.getFullName())
                .gender(staff.getGender())
                .dateOfBirth(staff.getDateOfBirth())
                .phone(staff.getPhone())
                .email(staff.getEmail())
                .address(staff.getAddress())
                .state(staff.getState())
                .pincode(staff.getPincode())
                .aadhaarNumber(staff.getAadhaarNumber())
                .panNumber(staff.getPanNumber())
                .employeeId(staff.getEmployeeId())
                .designation(staff.getDesignation())
                .department(staff.getDepartment())
                .qualification(staff.getQualification())
                .dateOfJoining(staff.getDateOfJoining())
                .active(staff.getActive())
                .createdAt(staff.getCreatedAt())
                .build();
    }
}
