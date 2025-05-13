# BlackEye Valkyrie System
A comprehensive healthcare management system built with Spring Boot. This application allows healthcare organizations to manage patients, appointments, prescriptions, consultations, and staff duty schedules.

## Features

- Patient Profile Management
- Appointment Scheduling and Tracking
- Prescription Management
- Consultation Queue
- Drug Inventory and Interaction Management
- User Role Management (Admin, Doctor, Nurse)
- Staff Duty Status Tracking
- Responsive Web UI with Thymeleaf

## Technology Stack

- Java 23
- Spring Boot 3.4.3
- MongoDB
- Thymeleaf
- Spring Security
- Bootstrap 5
- Docker & Docker Compose

## Running the Application

### Prerequisites

- Java 23 or higher
- Docker and Docker Compose
- Maven

### Setup Steps

1. Clone the repository:
   ```
   git clone <repository-url>
   cd BlackEyeValkyrieSystem_ScorppuLtd
   ```

2. Start the application using Docker Compose:
   ```
   docker-compose up --build
   ```

3. Access the application at:
   ```
   http://localhost:8080
   ```

4. Default login credentials:
   ```
   Username: admin
   Password: admin
   ```

## How to Use

### Initial Login and Setup

1. Use the default admin credentials to log in:
   - Username: `admin`
   - Password: `admin`

2. Navigate to the User Management section to create user accounts for:
   - Doctors
   - Nurses
   - Administrators

### Patient Management

1. **Create Patient Profiles:**
   - Navigate to Patients → Create New Patient
   - Fill in the required information including personal details, contact information, and medical history

2. **View and Edit Patient Information:**
   - Go to Patients → Patient List
   - Use the search functionality to find patients
   - Click on a patient to view their profile
   - Use the Edit button to update patient information

### Appointment Scheduling

1. **Create a New Appointment:**
   - Navigate to Appointments → Create New Appointment
   - Select a patient
   - Specify appointment details (type, duration, priority)
   - Assign a doctor (optional)
   - Set a scheduled time (optional)

2. **View Appointments:**
   - Go to Appointments → Timeline to see all scheduled appointments
   - Filter by date, doctor, or status

3. **Manage Appointments:**
   - Edit appointment details
   - Cancel appointments
   - Mark appointments as completed

### Consultations

1. **Start a Consultation:**
   - From the appointment view, click "Start Consultation"
   - Record patient symptoms, diagnosis, and treatment plans

2. **Manage Consultation Queue:**
   - View and prioritize waiting patients
   - Track ongoing consultations

### Prescription Management

1. **Create a Prescription:**
   - During a consultation, add prescribed medications
   - Specify dosage, frequency, and duration

2. **View and Edit Prescriptions:**
   - Access patient prescriptions from their profile
   - Update or cancel prescriptions as needed

### Drug Management

1. **Manage Drug Inventory:**
   - Add, edit, or remove drugs from the system
   - Import drug data using CSV files

2. **Track Drug Interactions:**
   - Record potential interactions between medications
   - Receive warnings when prescribing potentially interacting drugs

### Staff Duty Management

1. **Update Duty Status:**
   - Staff can mark themselves as on or off duty
   - View currently available medical staff

2. **Monitor Duty Statistics:**
   - Dashboard shows counts of on-duty doctors and nurses

## Project Structure

```
src/main/java/com/scorppultd/blackeyevalkyriesystem/
├── BlackeyevalkyriesystemApplication.java
├── api/                  # API endpoints
├── config/               # Application configuration
│   ├── MongoConfig.java
│   ├── SecurityConfig.java
│   ├── LicenseKeyInitializer.java
│   └── CustomUserDetails.java
├── controller/           # Web controllers
│   ├── WebController.java
│   ├── PatientController.java
│   ├── UserController.java
│   ├── AppointmentController.java
│   ├── ConsultationController.java
│   ├── DrugController.java
│   ├── PrescriptionViewController.java
│   └── ... (other controllers)
├── dto/                  # Data Transfer Objects
├── model/                # Domain models
│   ├── User.java
│   ├── Patient.java
│   ├── Doctor.java
│   ├── Nurse.java
│   ├── Appointment.java
│   ├── Consultation.java
│   ├── Prescription.java
│   ├── Drug.java
│   ├── DutyStatus.java
│   └── ... (other models)
├── repository/           # Data repositories
│   ├── UserRepository.java
│   ├── PatientRepository.java
│   ├── AppointmentRepository.java
│   ├── ConsultationRepository.java
│   └── ... (other repositories)
└── service/              # Business logic services
    ├── UserService.java
    ├── PatientService.java
    ├── AppointmentService.java
    ├── ConsultationService.java
    ├── DoctorService.java
    ├── LicenseKeyService.java
    ├── DrugService.java
    └── ... (other services)
```

## Testing

To run the application in test mode:

```
docker-compose -f test-compose.yml up --build
```

## License

[MIT License](LICENSE)

## Contributors

- Scorppu Ltd Development Team
- CSCI3100 Course Project Group 