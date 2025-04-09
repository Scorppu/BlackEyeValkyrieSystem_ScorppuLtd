package com.scorppultd.blackeyevalkyriesystem.api;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.scorppultd.blackeyevalkyriesystem.dto.TimelineDTO;
import com.scorppultd.blackeyevalkyriesystem.dto.PendingAppointmentDTO;
import com.scorppultd.blackeyevalkyriesystem.model.Appointment;
import com.scorppultd.blackeyevalkyriesystem.model.Doctor;
import com.scorppultd.blackeyevalkyriesystem.model.Patient;
import com.scorppultd.blackeyevalkyriesystem.service.AppointmentService;
import com.scorppultd.blackeyevalkyriesystem.service.DoctorService;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentApiController {
    
    @Autowired
    private AppointmentService appointmentService;
    
    @Autowired
    private DoctorService doctorService;
    
    /**
     * API endpoint to get the timeline data for all doctors on a specific date
     * 
     * @param date The date for which to get the timeline data (format: YYYY-MM-DD)
     * @return ResponseEntity with TimelineDTO containing the doctors and their appointments
     */
    @GetMapping("/timeline")
    public ResponseEntity<TimelineDTO> getTimelineData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        // Get all doctors
        List<Doctor> doctors = doctorService.getAllDoctors();
        
        // Create start and end times for the requested date
        LocalDateTime startTime = date.atTime(0, 0, 0);
        LocalDateTime endTime = date.atTime(23, 59, 59);
        
        // Create the response DTO
        List<TimelineDTO.DoctorScheduleDTO> doctorDTOs = new ArrayList<>();
        
        for (Doctor doctor : doctors) {
            String doctorName = doctor.getFirstName() + " " + doctor.getLastName();
            
            // Get appointments for this doctor on the specified date
            List<Appointment> appointments = appointmentService.getAppointmentsByDoctorNameAndDateRange(
                    doctorName, startTime, endTime);
            
            // Convert appointments to DTOs
            List<TimelineDTO.AppointmentDTO> appointmentDTOs = appointments.stream()
                    .map(appointment -> {
                        String patientName = "";
                        if (appointment.getPatient() != null) {
                            patientName = appointment.getPatient().getFirstName() + " " + 
                                         appointment.getPatient().getLastName();
                        }
                        
                        return new TimelineDTO.AppointmentDTO(
                                appointment.getId(),
                                patientName,
                                appointment.getScheduledTime().toString(),
                                appointment.getRequiredTime(),
                                appointment.getAppointmentType()
                        );
                    })
                    .collect(Collectors.toList());
            
            // Create the doctor schedule DTO
            TimelineDTO.DoctorScheduleDTO doctorDTO = new TimelineDTO.DoctorScheduleDTO(
                    doctor.getId(),
                    doctorName,
                    appointmentDTOs
            );
            
            doctorDTOs.add(doctorDTO);
        }
        
        // Create the final response
        TimelineDTO timelineDTO = new TimelineDTO(doctorDTOs);
        
        return ResponseEntity.ok(timelineDTO);
    }
    
    /**
     * API endpoint to get pending appointments within a date range
     * 
     * @param startDate Start date of the range (format: YYYY-MM-DDThh:mm:ss)
     * @param endDate End date of the range (format: YYYY-MM-DDThh:mm:ss)
     * @return ResponseEntity with list of PendingAppointmentDTO
     */
    @GetMapping("/pending")
    public ResponseEntity<List<PendingAppointmentDTO>> getPendingAppointments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        // Get appointments by status "pending" within the date range
        List<Appointment> appointments = appointmentService.getAppointmentsByStatus("pending").stream()
                .filter(appointment -> {
                    LocalDateTime scheduledTime = appointment.getScheduledTime();
                    return scheduledTime != null && 
                           !scheduledTime.isBefore(startDate) && 
                           !scheduledTime.isAfter(endDate);
                })
                .collect(Collectors.toList());
        
        // Convert appointments to DTOs
        List<PendingAppointmentDTO> dtos = appointments.stream()
                .map(appointment -> {
                    String patientName = "";
                    if (appointment.getPatient() != null) {
                        patientName = appointment.getPatient().getFirstName() + " " + 
                                     appointment.getPatient().getLastName();
                    }
                    
                    return new PendingAppointmentDTO(
                            appointment.getId(),
                            patientName,
                            appointment.getDoctorName(),
                            appointment.getAppointmentType(),
                            appointment.getScheduledTime().toString(),
                            appointment.getRequiredTime(),
                            appointment.getAppointmentPriority(),
                            appointment.getStatus()
                    );
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
} 