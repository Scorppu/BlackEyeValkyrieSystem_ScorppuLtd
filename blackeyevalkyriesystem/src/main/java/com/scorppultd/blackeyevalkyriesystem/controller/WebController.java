package com.scorppultd.blackeyevalkyriesystem.controller;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;
import com.scorppultd.blackeyevalkyriesystem.service.PatientService;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;
import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.model.Drug;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import com.scorppultd.blackeyevalkyriesystem.model.Visit;
import com.scorppultd.blackeyevalkyriesystem.service.DutyStatusService;
import com.scorppultd.blackeyevalkyriesystem.model.DutyStatus;
import com.scorppultd.blackeyevalkyriesystem.model.User;
import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import com.scorppultd.blackeyevalkyriesystem.model.Nurse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;

/**
 * Controller for handling general application pages
 */
@Controller
public class WebController {
    
    private static final Logger logger = LoggerFactory.getLogger(WebController.class);
    
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final DoctorService doctorService;
    private final UserService userService;
    private final DutyStatusService dutyStatusService;
    private final DrugService drugService;
    
    /**
     * Constructor for WebController
     * 
     * @param patientService Service for managing patient data
     * @param appointmentService Service for managing appointment data
     * @param doctorService Service for managing doctor data
     * @param userService Service for managing user data
     * @param dutyStatusService Service for managing duty status data
     * @param drugService Service for managing drug data
     */
    @Autowired
    public WebController(PatientService patientService, 
                        AppointmentService appointmentService,
                        DoctorService doctorService,
                        UserService userService,
                        DutyStatusService dutyStatusService,
                        DrugService drugService) {
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
        this.userService = userService;
        this.dutyStatusService = dutyStatusService;
        this.drugService = drugService;
    }

    /**
     * Display the home page
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/")
    public String index(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        
        try {
            int doctorsOnDuty = 0;
            int doctorsOffDuty = 0;
            
            List<Doctor> doctorsList = doctorService.getAllDoctors();
            for (Doctor doctor : doctorsList) {
                boolean isOnDuty = false;
                try {
                    Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(doctor);
                    isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                } catch (Exception e) {
                }
                
                if (isOnDuty) {
                    doctorsOnDuty++;
                } else {
                    doctorsOffDuty++;
                }
            }
            
            int nursesOnDuty = 0;
            int nursesOffDuty = 0;
            
            List<User> nursesList = userService.findByRole(User.UserRole.NURSE);
            for (User nurse : nursesList) {
                boolean isOnDuty = false;
                try {
                    Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(nurse);
                    isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                } catch (Exception e) {
                }
                
                if (isOnDuty) {
                    nursesOnDuty++;
                } else {
                    nursesOffDuty++;
                }
            }
            
            int totalPatients = 0;
            int activePatients = 0;
            int admittedPatients = 0;
            int dischargedPatients = 0;
            int activePercentage = 0;
            int admittedPercentage = 0;
            int dischargedPercentage = 0;
            

            try {
                List<Patient> allPatients = patientService.getAllPatients();
                totalPatients = allPatients.size();
                
                if (totalPatients > 0) {
                    for (Patient patient : allPatients) {
                        if (patient.getStatus() != null) {
                            if (patient.getStatus().equalsIgnoreCase("active")) {
                                activePatients++;
                            } else if (patient.getStatus().equalsIgnoreCase("admitted")) {
                                admittedPatients++;
                            } else if (patient.getStatus().equalsIgnoreCase("discharged")) {
                                dischargedPatients++;
                            }
                        }
                    }
                    
                    admittedPercentage = Math.round((float) admittedPatients / totalPatients * 100);
                    dischargedPercentage = Math.round((float) dischargedPatients / totalPatients * 100);
                    activePercentage = Math.round((float) activePatients / totalPatients * 100);
                }
            } catch (Exception e) {
                logger.error("Error fetching total patients count: {}", e.getMessage(), e);
            }
            
            model.addAttribute("doctorsOnDuty", doctorsOnDuty);
            model.addAttribute("doctorsOffDuty", doctorsOffDuty);
            model.addAttribute("nursesOnDuty", nursesOnDuty);
            model.addAttribute("nursesOffDuty", nursesOffDuty);
            model.addAttribute("totalPatients", totalPatients);
            model.addAttribute("activePatients", activePatients);
            model.addAttribute("admittedPatients", admittedPatients);
            model.addAttribute("dischargedPatients", dischargedPatients);
            model.addAttribute("activePercentage", activePercentage);
            model.addAttribute("admittedPercentage", admittedPercentage);
            model.addAttribute("dischargedPercentage", dischargedPercentage);
            
            try {
                List<Drug> allDrugs = drugService.getAllDrugs();
                model.addAttribute("drugs", allDrugs);
            } catch (Exception e) {
                logger.error("Error fetching drugs for dashboard: {}", e.getMessage(), e);
                model.addAttribute("drugs", new ArrayList<>());
            }
        } catch (Exception e) {
            logger.error("Error calculating stats for homepage: {}", e.getMessage(), e);
            model.addAttribute("doctorsOnDuty", 0);
            model.addAttribute("doctorsOffDuty", 0);
            model.addAttribute("nursesOnDuty", 0);
            model.addAttribute("nursesOffDuty", 0);
            model.addAttribute("totalPatients", 0);
            model.addAttribute("admittedPatients", 0);
            model.addAttribute("dischargedPatients", 0);
            model.addAttribute("admittedPercentage", 0);
            model.addAttribute("dischargedPercentage", 0);
            model.addAttribute("drugs", new ArrayList<>());
        }
        
        return "index";
    }
    
    /**
     * Display the login page
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/login")
    public String login(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "login";
    }
    
    /**
     * Display the appointments page
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/appointments")
    public String appointments(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "appointments";
    }
    
    /**
     * Display the settings page
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/settings")
    public String settings(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "settings";
    }

    /**
     * Display the duty status page showing all doctors and nurses with their duty status
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/duty-status")
    public String dutyStatus(HttpServletRequest request, Model model) {
        try {
            model.addAttribute("request", request);
            
            List<Map<String, Object>> doctors = new ArrayList<>();
            try {
                List<Doctor> doctorsList = doctorService.getAllDoctors();
                
                int doctorsOnDuty = 0;
                
                for (Doctor doctor : doctorsList) {
                    Map<String, Object> doctorMap = new HashMap<>();
                    doctorMap.put("id", doctor.getId());
                    doctorMap.put("firstName", doctor.getFirstName() != null ? doctor.getFirstName() : "");
                    doctorMap.put("lastName", doctor.getLastName() != null ? doctor.getLastName() : "");
                    doctorMap.put("email", doctor.getEmail() != null ? doctor.getEmail() : "");
                    doctorMap.put("specialization", doctor.getSpecialization() != null ? doctor.getSpecialization() : "General");
                    
                    boolean isOnDuty = false;
                    try {
                        Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(doctor);
                        isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                        if (isOnDuty) {
                            doctorsOnDuty++;
                        }
                        
                        // Add lastDutyDuration to the map if available
                        if (dutyStatus.isPresent()) {
                            doctorMap.put("lastDutyDuration", dutyStatus.get().getLastDutyDuration());
                        }
                    } catch (Exception e) {
                        logger.error("Error fetching duty status for doctor {}: {}", doctor.getId(), e.getMessage());
                    }
                    
                    doctorMap.put("dutyStatus", isOnDuty);
                    doctors.add(doctorMap);
                }
                
                model.addAttribute("doctorsOnDuty", doctorsOnDuty);
            } catch (Exception e) {
                logger.error("Error fetching doctors: {}", e.getMessage(), e);
            }
            
            List<Map<String, Object>> nurses = new ArrayList<>();
            try {
                List<User> nursesList = userService.findByRole(User.UserRole.NURSE);
                
                int nursesOnDuty = 0;
                
                for (User nurse : nursesList) {
                    Map<String, Object> nurseMap = new HashMap<>();
                    nurseMap.put("id", nurse.getId());
                    nurseMap.put("firstName", nurse.getFirstName() != null ? nurse.getFirstName() : "");
                    nurseMap.put("lastName", nurse.getLastName() != null ? nurse.getLastName() : "");
                    nurseMap.put("email", nurse.getEmail() != null ? nurse.getEmail() : "");
                    
                    String department = "General";
                    try {
                        if (nurse instanceof Nurse) {
                            Nurse nurseObj = (Nurse) nurse;
                            if (nurseObj.getDepartment() != null && !nurseObj.getDepartment().isEmpty()) {
                                department = nurseObj.getDepartment();
                            }
                        }
                    } catch (Exception e) {
                        logger.error("Error fetching department for nurse {}: {}", nurse.getId(), e.getMessage(), e);
                    }
                    nurseMap.put("department", department);
                    
                    boolean isOnDuty = false;
                    try {
                        Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(nurse);
                        isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                        if (isOnDuty) {
                            nursesOnDuty++;
                        }
                        
                        // Add lastDutyDuration to the map if available
                        if (dutyStatus.isPresent()) {
                            nurseMap.put("lastDutyDuration", dutyStatus.get().getLastDutyDuration());
                        }
                    } catch (Exception e) {
                        logger.error("Error fetching duty status for nurse {}: {}", nurse.getId(), e.getMessage());
                    }
                    
                    nurseMap.put("dutyStatus", isOnDuty);
                    nurses.add(nurseMap);
                }
                
                model.addAttribute("nursesOnDuty", nursesOnDuty);
            } catch (Exception e) {
                logger.error("Error fetching nurses: {}", e.getMessage(), e);
            }
            
            model.addAttribute("doctors", doctors);
            model.addAttribute("nurses", nurses);
            
            return "duty-status";
        } catch (Exception e) {
            logger.error("Error in dutyStatus controller method: {}", e.getMessage(), e);
            model.addAttribute("errorMessage", "An error occurred while loading duty status: " + e.getMessage());
            return "error";
        }
    }
    
    /**
     * Display the error page
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/error")
    public String error(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "error";
    }
    
    /**
     * Display the access denied page
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/access-denied")
    public String accessDenied(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "access-denied";
    }
    
    /**
     * Display the appointment timeline page
     * 
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/appointment/timeline")
    public String appointmentTimeline(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        
        int doctorsOnDuty = 0;
        try {
            List<Doctor> doctorsList = doctorService.getAllDoctors();
            for (Doctor doctor : doctorsList) {
                try {
                    Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(doctor);
                    if (dutyStatus.isPresent() && dutyStatus.get().isOnDuty()) {
                        doctorsOnDuty++;
                    }
                } catch (Exception e) {
                }
            }
        } catch (Exception e) {
            logger.error("Error calculating doctors on duty: {}", e.getMessage(), e);
            doctorsOnDuty = 0;
        }
        
        int patientsToday = 0;
        try {
            List<Appointment> allAppointments = appointmentService.getAllAppointments();
            
            LocalDate today = LocalDate.now();
            
            if (allAppointments != null) {
                List<Appointment> todayAppointments = allAppointments.stream()
                    .filter(appointment -> {
                        if (appointment.getScheduledTime() != null) {
                            LocalDate appointmentDate = appointment.getScheduledTime().toLocalDate();
                            return appointmentDate.equals(today);
                        }
                        return false;
                    })
                    .collect(Collectors.toList());
                
                patientsToday = todayAppointments.size();
            }
        } catch (Exception e) {
            logger.error("Error calculating today's patients: {}", e.getMessage(), e);
            patientsToday = 0;
        }
        
        model.addAttribute("doctorsOnDuty", doctorsOnDuty);
        model.addAttribute("patientsToday", patientsToday);
        
        return "appointment-timeline";
    }
    
    /**
     * Display the appointment creation page with patient selection
     * 
     * @param sortBy The field to sort patients by (default: lastName)
     * @param direction The sort direction (default: asc)
     * @param rowsPerPage Number of patients per page (default: 10)
     * @param page Current page number (default: 1)
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name
     */
    @GetMapping("/appointment/create")
    public String createAppointment(
            @RequestParam(required = false, defaultValue = "lastName") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String direction,
            @RequestParam(required = false, defaultValue = "10") Integer rowsPerPage,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            HttpServletRequest request, 
            Model model) {
        
        model.addAttribute("request", request);
        
        try {
            List<Patient> allPatients = patientService.getAllPatientsSorted(sortBy, direction);
            
            int totalPatients = allPatients.size();
            
            int startIndex = (page - 1) * rowsPerPage;
            int endIndex = Math.min(startIndex + rowsPerPage, totalPatients);
            
            List<Patient> paginatedPatients = startIndex < totalPatients ? 
                allPatients.subList(startIndex, endIndex) : 
                new ArrayList<>();
                
            List<Map<String, Object>> simplifiedPatients = new ArrayList<>();
            for (Patient patient : paginatedPatients) {
                Map<String, Object> patientData = new HashMap<>();
                patientData.put("id", patient.getId());
                patientData.put("firstName", patient.getFirstName());
                patientData.put("lastName", patient.getLastName());
                patientData.put("age", patient.getAge());
                patientData.put("sex", patient.getSex());
                
                if (patient.getVisits() != null && !patient.getVisits().isEmpty() && patient.getVisits().get(0) != null) {
                    Visit lastVisit = patient.getVisits().get(0);
                    if (lastVisit.getVisitDate() != null) {
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                        patientData.put("lastVisitDate", lastVisit.getVisitDate().format(formatter));
                    } else {
                        patientData.put("lastVisitDate", "No date");
                    }
                } else {
                    patientData.put("lastVisitDate", "No visits");
                }
                
                simplifiedPatients.add(patientData);
            }
            
            model.addAttribute("patients", simplifiedPatients);
            
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPatients", totalPatients);
            model.addAttribute("rowsPerPage", rowsPerPage);
            
            model.addAttribute("currentSortBy", sortBy);
            model.addAttribute("currentDirection", direction);
            
            return "appointment-create";
        } catch (Exception e) {
            System.err.println("Error loading appointment create page: " + e.getMessage());
            e.printStackTrace();
            
            model.addAttribute("errorMessage", "Failed to load patients. Please try again.");
            model.addAttribute("patients", new ArrayList<>());
            
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPatients", 0);
            model.addAttribute("rowsPerPage", rowsPerPage);
            model.addAttribute("currentSortBy", sortBy);
            model.addAttribute("currentDirection", direction);
            
            return "appointment-create";
        }
    }
    
    /**
     * Process the patient selection for appointment creation
     * 
     * @param selectedPatientIds List of selected patient IDs
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name or redirect URL
     */
    @PostMapping("/appointment/create")
    public String processPatientSelection(
            @RequestParam(value = "selectedPatients", required = false) List<String> selectedPatientIds,
            HttpServletRequest request,
            Model model) {
        
        if (selectedPatientIds == null || selectedPatientIds.isEmpty()) {
            return "redirect:/appointment/create?error=noPatientSelected";
        }
        
        String patientId = selectedPatientIds.get(0);
        
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        return "redirect:/appointment/create/visit-info?patientId=" + patientId;
    }
    
    /**
     * Display the visit information form for appointment creation
     * 
     * @param patientId ID of the selected patient
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name or redirect URL
     */
    @GetMapping("/appointment/create/visit-info")
    public String createAppointmentVisitInfo(
            @RequestParam("patientId") String patientId,
            HttpServletRequest request,
            Model model) {
        
        model.addAttribute("request", request);
        
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        Patient patient = patientOpt.get();
        model.addAttribute("patient", patient);
        
        List<String> appointmentTypes = List.of(
            "General Consultation",
            "Follow-up Visit",
            "Specialized Consultation",
            "Emergency",
            "Routine Check-up"
        );
        model.addAttribute("appointmentTypes", appointmentTypes);
        
        List<String> appointmentPriorities = List.of(
            "low",
            "medium",
            "high",
            "urgent"
        );
        model.addAttribute("appointmentPriorities", appointmentPriorities);
        
        List<Doctor> doctors = doctorService.getAllDoctors();
        model.addAttribute("doctors", doctors);
        
        return "appointment-create-visit-info";
    }
    
    /**
     * Process the appointment creation
     * 
     * @param patientId ID of the selected patient
     * @param appointmentType Type of appointment
     * @param requiredTime Required appointment time in minutes
     * @param appointmentPriority Priority of the appointment
     * @param notes Optional notes about the appointment
     * @param doctorName Selected doctor's name
     * @param scheduledTime Scheduled date and time
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return Redirect URL to appointment timeline or error page
     */
    @PostMapping("/appointment/create/visit-info")
    public String processAppointmentCreation(
            @RequestParam("patientId") String patientId,
            @RequestParam("appointmentType") String appointmentType,
            @RequestParam("requiredTime") String requiredTime,
            @RequestParam("appointmentPriority") String appointmentPriority,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "doctorName", required = false) String doctorName,
            @RequestParam(value = "scheduledTime", required = false) String scheduledTime,
            HttpServletRequest request,
            Model model) {
        
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        Patient patient = patientOpt.get();
        
        // Validate appointment time restrictions
        if (scheduledTime != null && !scheduledTime.isEmpty()) {
            LocalDateTime appointmentTime = LocalDateTime.parse(scheduledTime);
            
            // Check if appointment starts before 9:00 AM
            if (appointmentTime.getHour() < 9) {
                return "redirect:/appointment/create?error=timeBeforeWorkHours&patientId=" + patientId;
            }
            
            // Check if appointment starts after 17:30 (5:30 PM)
            if (appointmentTime.getHour() > 17 || 
                (appointmentTime.getHour() == 17 && appointmentTime.getMinute() > 30)) {
                return "redirect:/appointment/create?error=timeAfterWorkHours&patientId=" + patientId;
            }
            
            // Calculate end time
            int durationMinutes = 30; // Default
            try {
                durationMinutes = Integer.parseInt(requiredTime.trim().split(" ")[0]);
            } catch (NumberFormatException e) {
                // Use default if parsing fails
            }
            
            LocalDateTime endTime = appointmentTime.plusMinutes(durationMinutes);
            
            // Check if appointment ends after 17:30 (5:30 PM)
            if (endTime.getHour() > 17 || 
                (endTime.getHour() == 17 && endTime.getMinute() > 30)) {
                return "redirect:/appointment/create?error=endTimeAfterWorkHours&patientId=" + patientId;
            }
        }
        
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setAppointmentType(appointmentType);
        
        try {
            Integer time = Integer.parseInt(requiredTime);
            appointment.setRequiredTime(time);
        } catch (NumberFormatException e) {
            appointment.setRequiredTime(30);
        }
        
        appointment.setAppointmentPriority(appointmentPriority);
        appointment.setCreationTime(LocalDateTime.now());
        appointment.setStatus("pending");
        
        if (notes != null && !notes.trim().isEmpty()) {
            appointment.setNotes(notes);
        }
        
        if (doctorName != null && !doctorName.trim().isEmpty()) {
            appointment.setDoctorName(doctorName);
        }
        
        if (scheduledTime != null && !scheduledTime.trim().isEmpty()) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
                LocalDateTime dateTime = LocalDateTime.parse(scheduledTime, formatter);
                appointment.setScheduledTime(dateTime);
            } catch (Exception e) {
                System.err.println("Failed to parse scheduled time: " + e.getMessage());
                System.err.println("Input was: " + scheduledTime);
            }
        }
        
        try {
            appointment = appointmentService.createAppointment(appointment);
            System.out.println("Created appointment with ID: " + appointment.getId());
            
            if (appointment.getScheduledTime() != null) {
                Visit visit = new Visit();
                visit.setPatientId(patient.getId());
                
                if (doctorName != null && !doctorName.trim().isEmpty()) {
                    List<Doctor> doctors = doctorService.getAllDoctors();
                    Optional<Doctor> doctorOpt = doctors.stream()
                            .filter(d -> (d.getFirstName() + " " + d.getLastName()).equals(doctorName))
                            .findFirst();
                    
                    if (doctorOpt.isPresent()) {
                        visit.setDoctorId(doctorOpt.get().getId());
                    }
                }
                
                visit.setVisitDate(appointment.getScheduledTime().toLocalDate());
                
                if (patient.getVisits() == null) {
                    patient.setVisits(new ArrayList<>());
                }
                
                patient.getVisits().add(visit);
                
                patientService.savePatient(patient);
                System.out.println("Added visit record to patient: " + patient.getId());
            }
        } catch (Exception e) {
            System.err.println("Error saving appointment: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/appointment/create?error=saveFailed";
        }
        
        return "redirect:/appointment/timeline?success=created&appointmentId=" + appointment.getId();
    }
    
    /**
     * Display the appointment edit page
     * 
     * @param id ID of the appointment to edit
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return The view name or redirect URL
     */
    @GetMapping("/appointment/edit/{id}")
    public String editAppointment(
            @PathVariable String id,
            HttpServletRequest request,
            Model model) {
        
        model.addAttribute("request", request);
        
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (!appointmentOpt.isPresent()) {
            return "redirect:/appointment/timeline?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        model.addAttribute("appointment", appointment);
        
        Patient patient = appointment.getPatient();
        if (patient != null) {
            model.addAttribute("patient", patient);
        }
        
        List<String> appointmentTypes = List.of(
            "General Consultation",
            "Follow-up Visit",
            "Specialized Consultation",
            "Emergency",
            "Routine Check-up"
        );
        model.addAttribute("appointmentTypes", appointmentTypes);
        
        List<String> appointmentPriorities = List.of(
            "low",
            "medium",
            "high",
            "urgent"
        );
        model.addAttribute("appointmentPriorities", appointmentPriorities);
        
        List<Doctor> doctors = doctorService.getAllDoctors();
        model.addAttribute("doctors", doctors);
        
        if (appointment.getScheduledTime() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
            String formattedDateTime = appointment.getScheduledTime().format(formatter);
            model.addAttribute("formattedScheduledTime", formattedDateTime);
        }
        
        return "appointment-edit";
    }
    
    /**
     * Process the appointment edit
     * 
     * @param id ID of the appointment to edit
     * @param patientId ID of the patient
     * @param appointmentType Type of appointment
     * @param requiredTime Required appointment time in minutes
     * @param appointmentPriority Priority of the appointment
     * @param notes Optional notes about the appointment
     * @param doctorName Selected doctor's name
     * @param scheduledTime Scheduled date and time
     * @param request The HTTP request
     * @param model The model to be populated for the view
     * @return Redirect URL to appointment timeline
     */
    @PostMapping("/appointment/edit/{id}")
    public String processAppointmentEdit(
            @PathVariable String id,
            @RequestParam("patientId") String patientId,
            @RequestParam("appointmentType") String appointmentType,
            @RequestParam("requiredTime") String requiredTime,
            @RequestParam("appointmentPriority") String appointmentPriority,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "doctorName", required = false) String doctorName,
            @RequestParam(value = "scheduledTime", required = false) String scheduledTime,
            HttpServletRequest request,
            Model model) {
        
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (!appointmentOpt.isPresent()) {
            return "redirect:/appointment/timeline?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        
        appointment.setAppointmentType(appointmentType);
        appointment.setRequiredTime(Integer.parseInt(requiredTime));
        appointment.setAppointmentPriority(appointmentPriority);
        appointment.setNotes(notes);
        
        if (doctorName != null && !doctorName.isEmpty()) {
            appointment.setDoctorName(doctorName);
        }
        
        if (scheduledTime != null && !scheduledTime.isEmpty()) {
            LocalDateTime dateTime = LocalDateTime.parse(scheduledTime);
            appointment.setScheduledTime(dateTime);
        }
        
        appointmentService.updateAppointment(appointment);
        
        return "redirect:/appointment/timeline?success=appointmentUpdated&appointmentId=" + id;
    }

    /**
     * Cancel an appointment
     * 
     * @param id ID of the appointment to cancel
     * @return Redirect URL to appointment timeline
     */
    @GetMapping("/appointment/cancel/{id}")
    public String cancelAppointment(@PathVariable String id) {
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isPresent()) {
            appointmentService.deleteAppointment(id);
        }
        return "redirect:/appointment/timeline";
    }
    
    /**
     * Mark an appointment as completed
     * 
     * @param id ID of the appointment to complete
     * @return Redirect URL to appointment timeline
     */
    @GetMapping("/appointment/complete/{id}")
    public String completeAppointment(@PathVariable String id) {
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isPresent()) {
            Appointment appointment = appointmentOpt.get();
            appointment.setStatus("Completed");
            appointmentService.updateAppointment(appointment);
        }
        return "redirect:/appointment/timeline";
    }
} 