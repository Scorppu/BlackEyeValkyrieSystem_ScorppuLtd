// MongoDB initialization script

// Switch to the admin database
db = db.getSiblingDB('admin');

// Create root admin user if not exists
if (db.getUser("root") == null) {
    db.createUser({
        user: "root",
        pwd: "rootpassword",
        roles: [{ role: "root", db: "admin" }]
    });
}

// Switch to the application database
db = db.getSiblingDB('blackeyevalkyriesystem');

// Create application user if not exists
if (db.getUser("blackeye_app") == null) {
    db.createUser({
        user: "blackeye_app",
        pwd: "blackeye_password",
        roles: [
            { role: "readWrite", db: "blackeyevalkyriesystem" },
            { role: "dbAdmin", db: "blackeyevalkyriesystem" }
        ]
    });
}

// Create collections with validators
db.createCollection("patient", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "dateOfBirth", "gender"],
            properties: {
                name: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                dateOfBirth: {
                    bsonType: "date",
                    description: "must be a date and is required"
                },
                gender: {
                    enum: ["Male", "Female", "Other"],
                    description: "can only be one of the enum values and is required"
                },
                contactNumber: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                },
                email: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                },
                address: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                },
                medicalHistory: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                }
            }
        }
    }
});

db.createCollection("appointment", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["patientId", "appointmentDate", "status"],
            properties: {
                patientId: {
                    bsonType: "objectId",
                    description: "must be an objectId and is required"
                },
                appointmentDate: {
                    bsonType: "date",
                    description: "must be a date and is required"
                },
                status: {
                    enum: ["Scheduled", "Completed", "Cancelled"],
                    description: "can only be one of the enum values and is required"
                },
                notes: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                }
            }
        }
    }
});

// Create indexes
db.patient.createIndex({ "name": 1 });
db.patient.createIndex({ "email": 1 }, { unique: true, sparse: true });
db.appointment.createIndex({ "patientId": 1 });
db.appointment.createIndex({ "appointmentDate": 1 }); 