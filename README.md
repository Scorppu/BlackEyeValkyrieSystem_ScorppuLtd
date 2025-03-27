# BlackEye Valkyrie System
CSCI3100 Final Project.
A healthcare management system built with Spring Boot.

## Features

- Patient Profile Management
- Appointment Scheduling
- User Authentication
- Responsive UI

## Technology Stack

- Java 23
- Spring Boot 3.4.3
- MongoDB
- Thymeleaf
- Spring Security

## Running the Application

### Prerequisites

- Java 23 or higher
- Docker and Docker Compose (for MongoDB)
- Maven

### Setup Steps

1. Clone the repository:
   ```
   git clone <repository-url>
   cd BlackEyeValkyrieSystem_ScorppuLtd
   ```

2. Start MongoDB using Docker Compose:
   ```
   cd blackeyevalkyriesystem
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

## Project Structure

```
src/main/java/com/scorppultd/blackeyevalkyriesystem/
├── BlackeyevalkyriesystemApplication.java
├── config/
│   └── SecurityConfig.java
├── controller/
│   ├── PatientController.java
│   └── WebController.java
├── model/
│   └── Patient.java
├── repository/
│   └── PatientRepository.java
└── service/
    └── PatientService.java
```

## Next Steps

- Implement Appointment Management
- Add Medical Records Module
- Enhance Security and User Management
- Add Reporting and Analytics Features

## License

[Your license here]

## Contributors

- [Your team information] 