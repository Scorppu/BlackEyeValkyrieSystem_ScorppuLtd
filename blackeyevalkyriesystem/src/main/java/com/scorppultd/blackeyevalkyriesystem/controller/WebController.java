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
    
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final DoctorService doctorService;
    private final UserService userService;
    private final DutyStatusService dutyStatusService;
    private static final Logger logger = LoggerFactory.getLogger(WebController.class);
    
    @Autowired
    public WebController(PatientService patientService, 
                        AppointmentService appointmentService,
                        DoctorService doctorService,
                        UserService userService,
                        DutyStatusService dutyStatusService) {
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
        this.userService = userService;
        this.dutyStatusService = dutyStatusService;
    }

    /**
     * Display the home page
     */
    @GetMapping("/")
    public String index(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        
        // Calculate duty status counts for dashboard display
        try {
            // Get doctors duty status
            int doctorsOnDuty = 0;
            int doctorsOffDuty = 0;
            
            List<Doctor> doctorsList = doctorService.getAllDoctors();
            for (Doctor doctor : doctorsList) {
                boolean isOnDuty = false;
                try {
                    Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(doctor);
                    isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                } catch (Exception e) {
                    logger.warn("Error checking duty status for doctor {}: {}", doctor.getId(), e.getMessage());
                }
                
                if (isOnDuty) {
                    doctorsOnDuty++;
                } else {
                    doctorsOffDuty++;
                }
            }
            
            // Get nurses duty status
            int nursesOnDuty = 0;
            int nursesOffDuty = 0;
            
            List<User> nursesList = userService.findByRole(User.UserRole.NURSE);
            for (User nurse : nursesList) {
                boolean isOnDuty = false;
                try {
                    Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(nurse);
                    isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                } catch (Exception e) {
                    logger.warn("Error checking duty status for nurse {}: {}", nurse.getId(), e.getMessage());
                }
                
                if (isOnDuty) {
                    nursesOnDuty++;
                } else {
                    nursesOffDuty++;
                }
            }
            
            // Add duty status counts to model
            model.addAttribute("doctorsOnDuty", doctorsOnDuty);
            model.addAttribute("doctorsOffDuty", doctorsOffDuty);
            model.addAttribute("nursesOnDuty", nursesOnDuty);
            model.addAttribute("nursesOffDuty", nursesOffDuty);
            
            logger.info("Home page duty stats - doctors: {}/{}, nurses: {}/{}", 
                        doctorsOnDuty, doctorsOffDuty, nursesOnDuty, nursesOffDuty);
        } catch (Exception e) {
            logger.error("Error calculating duty status for homepage: {}", e.getMessage(), e);
            // Set defaults if there's an error
            model.addAttribute("doctorsOnDuty", 0);
            model.addAttribute("doctorsOffDuty", 0);
            model.addAttribute("nursesOnDuty", 0);
            model.addAttribute("nursesOffDuty", 0);
        }
        
        return "index";
    }
    
    /**
     * Display the login page
     */
    @GetMapping("/login")
    public String login(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "login";
    }
    
    /**
     * Display the appointments page
     */
    @GetMapping("/appointments")
    public String appointments(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "appointments";
    }
    
    /**
     * Display the settings page
     */
    @GetMapping("/settings")
    public String settings(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "settings";
    }

    @GetMapping("/duty-status")
    public String dutyStatus(HttpServletRequest request, Model model) {
        try {
            logger.info("Duty status page requested");
            model.addAttribute("request", request);
            
            // Fetch all doctors using DoctorService
            List<Map<String, Object>> doctors = new ArrayList<>();
            try {
                List<Doctor> doctorsList = doctorService.getAllDoctors();
                logger.info("Retrieved {} raw doctors from service", doctorsList.size());
                
                // Calculate doctors on duty count for stats
                int doctorsOnDuty = 0;
                
                for (Doctor doctor : doctorsList) {
                    Map<String, Object> doctorMap = new HashMap<>();
                    doctorMap.put("id", doctor.getId());
                    doctorMap.put("firstName", doctor.getFirstName() != null ? doctor.getFirstName() : "");
                    doctorMap.put("lastName", doctor.getLastName() != null ? doctor.getLastName() : "");
                    doctorMap.put("email", doctor.getEmail() != null ? doctor.getEmail() : "");
                    doctorMap.put("specialization", doctor.getSpecialization() != null ? doctor.getSpecialization() : "General");
                    
                    // Fetch duty status for this doctor
                    boolean isOnDuty = false;
                    try {
                        Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(doctor);
                        isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                        if (isOnDuty) {
                            doctorsOnDuty++;
                        }
                    } catch (Exception e) {
                        logger.warn("Error fetching duty status for doctor {}: {}", doctor.getId(), e.getMessage());
                    }
                    
                    doctorMap.put("dutyStatus", isOnDuty);
                    doctors.add(doctorMap);
                }
                
                model.addAttribute("doctorsOnDuty", doctorsOnDuty);
                logger.info("Processed {} doctors for view, {} on duty", doctors.size(), doctorsOnDuty);
                
                // Log some sample doctor data for troubleshooting
                if (!doctors.isEmpty()) {
                    logger.info("Sample doctor data: {}", doctors.get(0));
                }
            } catch (Exception e) {
                logger.error("Error fetching doctors: {}", e.getMessage(), e);
                // Continue with empty list
            }
            
            // Create a service method to get users by role and use it here
            List<Map<String, Object>> nurses = new ArrayList<>();
            try {
                List<User> nursesList = userService.findByRole(User.UserRole.NURSE);
                logger.info("Retrieved {} raw nurses from service", nursesList.size());
                
                // Calculate nurses on duty count for stats
                int nursesOnDuty = 0;
                
                for (User nurse : nursesList) {
                    Map<String, Object> nurseMap = new HashMap<>();
                    nurseMap.put("id", nurse.getId());
                    nurseMap.put("firstName", nurse.getFirstName() != null ? nurse.getFirstName() : "");
                    nurseMap.put("lastName", nurse.getLastName() != null ? nurse.getLastName() : "");
                    nurseMap.put("email", nurse.getEmail() != null ? nurse.getEmail() : "");
                    
                    // Get department with safe handling
                    String department = "General";
                    try {
                        // Try to cast to Nurse if possible
                        if (nurse instanceof Nurse) {
                            Nurse nurseObj = (Nurse) nurse;
                            if (nurseObj.getDepartment() != null && !nurseObj.getDepartment().isEmpty()) {
                                department = nurseObj.getDepartment();
                            }
                        }
                    } catch (Exception e) {
                        // If casting fails, use default department
                        logger.warn("Could not cast User to Nurse for ID: {}", nurse.getId());
                    }
                    nurseMap.put("department", department);
                    
                    // Fetch duty status for this nurse
                    boolean isOnDuty = false;
                    try {
                        Optional<DutyStatus> dutyStatus = dutyStatusService.getLatestDutyStatus(nurse);
                        isOnDuty = dutyStatus.isPresent() && dutyStatus.get().isOnDuty();
                        if (isOnDuty) {
                            nursesOnDuty++;
                        }
                    } catch (Exception e) {
                        logger.warn("Error fetching duty status for nurse {}: {}", nurse.getId(), e.getMessage());
                    }
                    
                    nurseMap.put("dutyStatus", isOnDuty);
                    nurses.add(nurseMap);
                }
                
                model.addAttribute("nursesOnDuty", nursesOnDuty);
                logger.info("Processed {} nurses for view, {} on duty", nurses.size(), nursesOnDuty);
                
                // Log some sample nurse data for troubleshooting
                if (!nurses.isEmpty()) {
                    logger.info("Sample nurse data: {}", nurses.get(0));
                }
            } catch (Exception e) {
                logger.error("Error fetching nurses: {}", e.getMessage(), e);
                // Continue with empty list
            }
            
            model.addAttribute("doctors", doctors);
            model.addAttribute("nurses", nurses);
            
            // Log final model state
            logger.info("Final model contents - doctors: {}, nurses: {}", 
                        doctors.size(), nurses.size());
            
            logger.info("Rendering Detail-DutyStatus template");
            return "Detail-DutyStatus";
        } catch (Exception e) {
            logger.error("Error in dutyStatus controller method: {}", e.getMessage(), e);
            model.addAttribute("errorMessage", "An error occurred while loading duty status: " + e.getMessage());
            return "error";
        }
    }
    
    /**
     * Display the error page
     */
    @GetMapping("/error")
    public String error(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "error";
    }
    
    @GetMapping("/access-denied")
    public String accessDenied(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        return "access-denied";
    }
    
    @GetMapping("/appointment/timeline")
    public String appointmentTimeline(HttpServletRequest request, Model model) {
        model.addAttribute("request", request);
        
        // Calculate actual doctors on duty
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
                    logger.warn("Error checking duty status for doctor {}: {}", doctor.getId(), e.getMessage());
                }
            }
            logger.info("Found {} doctors on duty for timeline page", doctorsOnDuty);
        } catch (Exception e) {
            logger.error("Error calculating doctors on duty: {}", e.getMessage(), e);
            // Default to 0 if there's an error
            doctorsOnDuty = 0;
        }
        
        // Calculate patients seen today
        int patientsToday = 0;
        try {
            // Get all appointments
            List<Appointment> allAppointments = appointmentService.getAllAppointments();
            
            // Get today's date
            LocalDate today = LocalDate.now();
            
            // Filter appointments to only include those scheduled for today
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
                
                // Count the appointments for today
                patientsToday = todayAppointments.size();
                
                logger.info("Found {} appointments scheduled for today", patientsToday);
            }
        } catch (Exception e) {
            logger.error("Error calculating today's patients: {}", e.getMessage(), e);
            // Default to 0 if there's an error
            patientsToday = 0;
        }
        
        model.addAttribute("doctorsOnDuty", doctorsOnDuty);
        model.addAttribute("patientsToday", patientsToday);
        
        return "appointment-timeline";
    }
    
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
            // Get sorted patients for patient selection
            List<Patient> allPatients = patientService.getAllPatientsSorted(sortBy, direction);
            
            // Calculate total patients count
            int totalPatients = allPatients.size();
            
            // Calculate start and end index for pagination
            int startIndex = (page - 1) * rowsPerPage;
            int endIndex = Math.min(startIndex + rowsPerPage, totalPatients);
            
            // Get sub-list for current page
            List<Patient> paginatedPatients = startIndex < totalPatients ? 
                allPatients.subList(startIndex, endIndex) : 
                new ArrayList<>();
                
            // Create simplified DTOs to avoid large object graphs
            List<Map<String, Object>> simplifiedPatients = new ArrayList<>();
            for (Patient patient : paginatedPatients) {
                Map<String, Object> patientData = new HashMap<>();
                patientData.put("id", patient.getId());
                patientData.put("firstName", patient.getFirstName());
                patientData.put("lastName", patient.getLastName());
                patientData.put("age", patient.getAge());
                patientData.put("sex", patient.getSex());
                
                // Add last visit date if available
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
            
            // Add patients to the model
            model.addAttribute("patients", simplifiedPatients);
            
            // Pagination information
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPatients", totalPatients);
            model.addAttribute("rowsPerPage", rowsPerPage);
            
            // Sort parameters
            model.addAttribute("currentSortBy", sortBy);
            model.addAttribute("currentDirection", direction);
            
            return "appointment-create";
        } catch (Exception e) {
            // Log the error
            System.err.println("Error loading appointment create page: " + e.getMessage());
            e.printStackTrace();
            
            // Add error message to the model
            model.addAttribute("errorMessage", "Failed to load patients. Please try again.");
            model.addAttribute("patients", new ArrayList<>());
            
            // Add default values for pagination and sorting
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPatients", 0);
            model.addAttribute("rowsPerPage", rowsPerPage);
            model.addAttribute("currentSortBy", sortBy);
            model.addAttribute("currentDirection", direction);
            
            return "appointment-create";
        }
    }
    
    @PostMapping("/appointment/create")
    public String processPatientSelection(
            @RequestParam(value = "selectedPatients", required = false) List<String> selectedPatientIds,
            HttpServletRequest request,
            Model model) {
        
        if (selectedPatientIds == null || selectedPatientIds.isEmpty()) {
            // If no patients selected, redirect back with an error message
            return "redirect:/appointment/create?error=noPatientSelected";
        }
        
        // For simplicity, we'll assume only one patient is selected (first one)
        String patientId = selectedPatientIds.get(0);
        
        // Find the patient by ID
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        // Redirect to visit information page with the patient ID
        return "redirect:/appointment/create/visit-info?patientId=" + patientId;
    }
    
    @GetMapping("/appointment/create/visit-info")
    public String createAppointmentVisitInfo(
            @RequestParam("patientId") String patientId,
            HttpServletRequest request,
            Model model) {
        
        model.addAttribute("request", request);
        
        // Find the patient by ID
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        Patient patient = patientOpt.get();
        model.addAttribute("patient", patient);
        
        // Add appointment type options
        List<String> appointmentTypes = List.of(
            "General Consultation",
            "Follow-up Visit",
            "Specialized Consultation",
            "Emergency",
            "Routine Check-up"
        );
        model.addAttribute("appointmentTypes", appointmentTypes);
        
        // Add appointment priority options
        List<String> appointmentPriorities = List.of(
            "low",
            "medium",
            "high",
            "urgent"
        );
        model.addAttribute("appointmentPriorities", appointmentPriorities);
        
        // Fetch all doctors for the dropdown
        List<Doctor> doctors = doctorService.getAllDoctors();
        model.addAttribute("doctors", doctors);
        
        return "appointment-create-visit-info";
    }
    
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
        
        // Find the patient
        Optional<Patient> patientOpt = patientService.getPatientById(patientId);
        if (!patientOpt.isPresent()) {
            return "redirect:/appointment/create?error=patientNotFound";
        }
        
        Patient patient = patientOpt.get();
        
        // Create a new appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setAppointmentType(appointmentType);
        
        // Parse required time (remove 'minutes' suffix if it exists)
        try {
            Integer time = Integer.parseInt(requiredTime.trim().split(" ")[0]);
            appointment.setRequiredTime(time);
        } catch (NumberFormatException e) {
            // Default to 30 minutes if parsing fails
            appointment.setRequiredTime(30);
        }
        
        appointment.setAppointmentPriority(appointmentPriority);
        appointment.setCreationTime(LocalDateTime.now());
        appointment.setStatus("pending"); // Ensure status is set
        
        // Set optional fields if provided
        if (notes != null && !notes.trim().isEmpty()) {
            appointment.setNotes(notes);
        }
        
        if (doctorName != null && !doctorName.trim().isEmpty()) {
            appointment.setDoctorName(doctorName);
        }
        
        // Parse and set scheduled time if provided
        if (scheduledTime != null && !scheduledTime.trim().isEmpty()) {
            try {
                // Use DateTimeFormatter for more robust parsing
                DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
                LocalDateTime dateTime = LocalDateTime.parse(scheduledTime, formatter);
                appointment.setScheduledTime(dateTime);
            } catch (Exception e) {
                // If parsing fails, log the error and continue
                System.err.println("Failed to parse scheduled time: " + e.getMessage());
                System.err.println("Input was: " + scheduledTime);
            }
        }
        
        try {
            // Save the appointment and log the ID
            appointment = appointmentService.createAppointment(appointment);
            System.out.println("Created appointment with ID: " + appointment.getId());
            
            // Create a new Visit record and add it to the patient's visits list
            if (appointment.getScheduledTime() != null) {
                // Create a new Visit
                Visit visit = new Visit();
                visit.setPatientId(patient.getId());
                
                // Set doctor ID if available
                if (doctorName != null && !doctorName.trim().isEmpty()) {
                    // Find the doctor by name
                    List<Doctor> doctors = doctorService.getAllDoctors();
                    Optional<Doctor> doctorOpt = doctors.stream()
                            .filter(d -> (d.getFirstName() + " " + d.getLastName()).equals(doctorName))
                            .findFirst();
                    
                    if (doctorOpt.isPresent()) {
                        visit.setDoctorId(doctorOpt.get().getId());
                    }
                }
                
                // Set visit date from appointment's scheduled time
                visit.setVisitDate(appointment.getScheduledTime().toLocalDate());
                
                // Initialize patient's visits list if null
                if (patient.getVisits() == null) {
                    patient.setVisits(new ArrayList<>());
                }
                
                // Add the visit to the patient's visits list
                patient.getVisits().add(visit);
                
                // Save the updated patient
                patientService.savePatient(patient);
                System.out.println("Added visit record to patient: " + patient.getId());
            }
        } catch (Exception e) {
            // Log any exceptions during save
            System.err.println("Error saving appointment: " + e.getMessage());
            e.printStackTrace();
            return "redirect:/appointment/create?error=saveFailed";
        }
        
        return "redirect:/appointment/timeline?success=created&appointmentId=" + appointment.getId();
    }
    
    @GetMapping("/appointment/edit/{id}")
    public String editAppointment(
            @PathVariable String id,
            HttpServletRequest request,
            Model model) {
        
        model.addAttribute("request", request);
        
        // Find the appointment by ID
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (!appointmentOpt.isPresent()) {
            return "redirect:/appointment/timeline?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        model.addAttribute("appointment", appointment);
        
        // Find the patient from the appointment
        Patient patient = appointment.getPatient();
        if (patient != null) {
            model.addAttribute("patient", patient);
        }
        
        // Add appointment type options
        List<String> appointmentTypes = List.of(
            "General Consultation",
            "Follow-up Visit",
            "Specialized Consultation",
            "Emergency",
            "Routine Check-up"
        );
        model.addAttribute("appointmentTypes", appointmentTypes);
        
        // Add appointment priority options
        List<String> appointmentPriorities = List.of(
            "low",
            "medium",
            "high",
            "urgent"
        );
        model.addAttribute("appointmentPriorities", appointmentPriorities);
        
        // Fetch all doctors for the dropdown
        List<Doctor> doctors = doctorService.getAllDoctors();
        model.addAttribute("doctors", doctors);
        
        // Format the scheduled time for the form
        if (appointment.getScheduledTime() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");
            String formattedDateTime = appointment.getScheduledTime().format(formatter);
            model.addAttribute("formattedScheduledTime", formattedDateTime);
        }
        
        return "appointment-edit";
    }
    
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
        
        // Find the appointment by ID
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (!appointmentOpt.isPresent()) {
            return "redirect:/appointment/timeline?error=appointmentNotFound";
        }
        
        Appointment appointment = appointmentOpt.get();
        
        // Update the appointment with new values
        appointment.setAppointmentType(appointmentType);
        appointment.setRequiredTime(Integer.parseInt(requiredTime));
        appointment.setAppointmentPriority(appointmentPriority);
        appointment.setNotes(notes);
        
        // Update doctor if changed
        if (doctorName != null && !doctorName.isEmpty()) {
            appointment.setDoctorName(doctorName);
        }
        
        // Update scheduled time if changed
        if (scheduledTime != null && !scheduledTime.isEmpty()) {
            LocalDateTime dateTime = LocalDateTime.parse(scheduledTime);
            appointment.setScheduledTime(dateTime);
        }
        
        // Save the updated appointment
        appointmentService.updateAppointment(appointment);
        
        // Redirect to appointment timeline with success message
        return "redirect:/appointment/timeline?success=appointmentUpdated";
    }

    @GetMapping("/appointment/cancel/{id}")
    public String cancelAppointment(@PathVariable String id) {
        // Find the appointment
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isPresent()) {
            // Delete the appointment
            appointmentService.deleteAppointment(id);
        }
        return "redirect:/appointment/timeline";
    }
    
    @GetMapping("/appointment/complete/{id}")
    public String completeAppointment(@PathVariable String id) {
        // Find the appointment
        Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
        if (appointmentOpt.isPresent()) {
            Appointment appointment = appointmentOpt.get();
            // Mark as completed
            appointment.setStatus("Completed");
            appointmentService.updateAppointment(appointment);
        }
        return "redirect:/appointment/timeline";
    }
} 