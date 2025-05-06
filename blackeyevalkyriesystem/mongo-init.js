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
            required: ["firstName", "lastName", "dateOfBirth"],
            properties: {
                firstName: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                lastName: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                sex: {
                    bsonType: "bool",
                    description: "must be a boolean"
                },
                dateOfBirth: {
                    bsonType: "date",
                    description: "must be a date and is required"
                },
                age: {
                    bsonType: "int",
                    description: "must be an integer"
                },
                relativeName: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                },
                maritalStatus: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                },
                bloodType: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                },
                drugAllergies: {
                    bsonType: "array",
                    description: "must be an array if the field exists"
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
                    bsonType: "object",
                    description: "must be an object if the field exists",
                    properties: {
                        addressLine1: { bsonType: "string" },
                        addressLine2: { bsonType: "string" },
                        addressLine3: { bsonType: "string" },
                        country: { bsonType: "string" },
                        state: { bsonType: "string" },
                        town: { bsonType: "string" },
                        pinCode: { bsonType: "string" }
                    }
                },
                status: {
                    bsonType: "string",
                    description: "must be a string if the field exists"
                },
                createDate: {
                    bsonType: "date",
                    description: "must be a date if the field exists"
                },
                updateDate: {
                    bsonType: "date",
                    description: "must be a date if the field exists"
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
db.patient.createIndex({ "lastName": 1, "firstName": 1 });
db.patient.createIndex({ "email": 1 }, { unique: true, sparse: true });
db.appointment.createIndex({ "patientId": 1 });
db.appointment.createIndex({ "appointmentDate": 1 }); 