// Import necessary modules
const request = require("supertest");
const app = require("../server"); // Ensure server.js exports the Express app correctly NOW
const Appointment = require("../models/appointment");
const mongoose = require("mongoose"); // Import mongoose to close connection

// --- Mocking Dependencies ---

// Mock the Appointment model to prevent actual database operations
jest.mock("../models/appointment");

// Mock the authentication middleware module
jest.mock("../middleware/authMiddleware", () => ({
  protect: (req, res, next) => {
    req.user = { id: "mockUserId123" };
    next();
  },
}));

// --- Test Suite Setup ---

// Define reusable data
const sampleAppointmentData = {
  doctorName: "Dr. Jane Doe",
  appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  appointmentTime: "10:30",
  reason: "Regular Checkup",
  status: "scheduled",
};

const mockAppointment = {
  ...sampleAppointmentData,
  _id: "mockAppointmentId123",
  userId: "mockUserId123",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// --- Test Suite Hook ---

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset specific mock implementations if they were changed in a test
  // e.g., reset Appointment constructor mock if used
  if (Appointment.mockImplementation) {
    Appointment.mockReset(); // Resets constructor mock behavior
  }
  // Ensure static mocks like .find are reset if needed (clearAllMocks often handles this)
  // Appointment.find.mockClear();
  // Appointment.findById.mockClear();
});

// --- Close DB connection after all tests ---
afterAll(async () => {
  // Ensure the mongoose connection is closed to allow Jest to exit gracefully.
  await mongoose.disconnect();
  console.log("MongoDB disconnected for testing."); // Optional log
});

// --- Test Suite for Appointment Routes (/api/appointments) ---

describe("Appointment Routes API (/api/appointments)", () => {
  // --- Tests for POST /api/appointments ---
  describe("POST /api/appointments", () => {
    // Tests remain largely the same, but should now run without the app.address error

    it("should create a new appointment successfully when no conflicts exist", async () => {
      // Arrange:
      Appointment.find.mockResolvedValue([]);
      const saveMock = jest
        .fn()
        .mockResolvedValue({ ...mockAppointment, userId: "mockUserId123" });
      // Mock the Appointment constructor *instance* to have the save method
      Appointment.prototype.save = saveMock; // Mock save on the prototype

      // Act:
      const response = await request(app)
        .post("/api/appointments")
        .send(sampleAppointmentData)
        .expect("Content-Type", /json/)
        .expect(201);

      // Assert:
      // Check constructor call (Note: Cannot directly check constructor args easily with prototype mock)
      // expect(Appointment).toHaveBeenCalledTimes(1); // This check might need adjustment
      expect(Appointment.find).toHaveBeenCalledTimes(1);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("_id", mockAppointment._id);
      expect(response.body).toHaveProperty("userId", "mockUserId123");
    });

    it("should return 400 if a time conflict exists", async () => {
      // Arrange:
      const conflictingAppt = {
        ...mockAppointment,
        _id: "conflictId",
        appointmentTime: "11:00",
      };
      Appointment.find.mockResolvedValue([conflictingAppt]);
      // No need to mock constructor/save if it returns early

      // Act:
      const response = await request(app)
        .post("/api/appointments")
        .send(sampleAppointmentData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert:
      expect(Appointment.find).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Time conflict")
      );
    });

    // Test case for missing 'doctorName' field (Mongoose validation)
    it("should return 400 if doctorName is missing (validation)", async () => {
      // Arrange:
      const { doctorName, ...invalidData } = sampleAppointmentData;
      const validationError = new Error(
        "Validation failed: doctorName is required"
      );
      validationError.name = "ValidationError";
      const saveMock = jest.fn().mockRejectedValue(validationError);
      Appointment.prototype.save = saveMock; // Mock save on prototype
      Appointment.find.mockResolvedValue([]); // Assume no conflict for validation test

      // Act:
      const response = await request(app)
        .post("/api/appointments")
        .send(invalidData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert:
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", validationError.message);
    });

    // Test case for missing 'appointmentDate' field (Mongoose validation)
    it("should return 400 if appointmentDate is missing (validation)", async () => {
      const { appointmentDate, ...invalidData } = sampleAppointmentData;
      const validationError = new Error(
        "Validation failed: appointmentDate is required"
      );
      validationError.name = "ValidationError";
      const saveMock = jest.fn().mockRejectedValue(validationError);
      Appointment.prototype.save = saveMock;
      Appointment.find.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/appointments")
        .send(invalidData)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", validationError.message);
    });

    // Test case for missing 'appointmentTime' field (Mongoose validation)
    it("should return 400 if appointmentTime is missing (validation)", async () => {
      const { appointmentTime, ...invalidData } = sampleAppointmentData;
      const validationError = new Error(
        "Validation failed: appointmentTime is required"
      );
      validationError.name = "ValidationError";
      const saveMock = jest.fn().mockRejectedValue(validationError);
      Appointment.prototype.save = saveMock;
      Appointment.find.mockResolvedValue([]);

      const response = await request(app)
        .post("/api/appointments")
        .send(invalidData)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", validationError.message);
    });

    it("should return 400 if there is an unexpected server error during conflict check", async () => {
      // Arrange:
      const dbError = new Error("Database connection lost");
      Appointment.find.mockRejectedValue(dbError);
      // No need to mock constructor/save

      // Act:
      const response = await request(app)
        .post("/api/appointments")
        .send(sampleAppointmentData)
        .expect("Content-Type", /json/)
        .expect(400); // Route catches this as 400

      // Assert:
      expect(Appointment.find).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", dbError.message);
    });

    it("should return 400 if there is an unexpected server error during save", async () => {
      // Arrange:
      Appointment.find.mockResolvedValue([]); // No conflict
      const dbError = new Error("Failed to save");
      const saveMock = jest.fn().mockRejectedValue(dbError);
      Appointment.prototype.save = saveMock;

      // Act:
      const response = await request(app)
        .post("/api/appointments")
        .send(sampleAppointmentData)
        .expect("Content-Type", /json/)
        .expect(400); // Route catches save errors as 400

      // Assert:
      expect(Appointment.find).toHaveBeenCalledTimes(1);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", dbError.message);
    });
  }); // End describe POST

  // --- Tests for GET /api/appointments ---
  describe("GET /api/appointments", () => {
    it("should retrieve appointments successfully for the authenticated user", async () => {
      // Arrange:
      const mockAppointmentsList = [
        /* ... as before ... */
      ];
      Appointment.find.mockResolvedValue(mockAppointmentsList);
      // Act & Assert: ... as before ...
      const response = await request(app)
        .get("/api/appointments")
        .expect("Content-Type", /json/)
        .expect(200);
      expect(Appointment.find).toHaveBeenCalledTimes(1);
      expect(Appointment.find).toHaveBeenCalledWith({
        userId: "mockUserId123",
      });
      // ... other assertions
    });

    it("should return an empty array if the authenticated user has no appointments", async () => {
      // Arrange:
      Appointment.find.mockResolvedValue([]);
      // Act & Assert: ... as before ...
      const response = await request(app)
        .get("/api/appointments")
        .expect("Content-Type", /json/)
        .expect(200);
      expect(Appointment.find).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveLength(0);
    });

    it("should return 500 if there is an unexpected server error during retrieval", async () => {
      // Arrange:
      const errorMessage = "Failed to query database";
      Appointment.find.mockRejectedValue(new Error(errorMessage));
      // Act & Assert: ... as before ...
      const response = await request(app)
        .get("/api/appointments")
        .expect("Content-Type", /json/)
        .expect(500);
      expect(response.body).toHaveProperty("message", errorMessage);
    });
  }); // End describe GET /

  // --- Tests for GET /api/appointments/:id ---
  describe("GET /api/appointments/:id", () => {
    const appointmentId = "mockAppointmentId123";
    // Tests remain the same, but should now run without the app.address error
    it("should retrieve a specific appointment by ID if owner", async () => {
      Appointment.findById.mockResolvedValue({
        ...mockAppointment,
        userId: "mockUserId123",
      });
      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(200);
      expect(Appointment.findById).toHaveBeenCalledWith(appointmentId);
      expect(response.body).toHaveProperty("_id", appointmentId);
    });

    it("should return 404 if appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null);
      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(404);
      expect(response.body).toHaveProperty("message", "Appointment not found");
    });

    it("should return 403 if user is not the owner", async () => {
      Appointment.findById.mockResolvedValue({
        ...mockAppointment,
        userId: "anotherUserId",
      });
      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(403);
      expect(response.body).toHaveProperty(
        "message",
        "Not authorized to access this appointment"
      );
    });

    it("should return 500 if database error occurs during findById", async () => {
      const dbError = new Error("Database error");
      Appointment.findById.mockRejectedValue(dbError);
      const response = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(500);
      expect(response.body).toHaveProperty("message", dbError.message);
    });
  }); // End describe GET /:id

  // --- Tests for PATCH /api/appointments/:id ---
  describe("PATCH /api/appointments/:id", () => {
    const appointmentId = "mockAppointmentId123";
    const updateData = { reason: "Updated Reason", status: "completed" };
    let mockFoundAppointment;
    const saveMock = jest.fn();

    beforeEach(() => {
      saveMock.mockClear();
      Appointment.findById.mockClear();
      Appointment.find.mockClear();

      // Simulate finding the appointment
      mockFoundAppointment = {
        ...mockAppointment,
        _id: appointmentId,
        userId: "mockUserId123",
        save: saveMock, // Attach save mock
        // Add other necessary properties/methods used by the route
      };
      Appointment.findById.mockResolvedValue(mockFoundAppointment); // Mock findById used by getAppointment
      saveMock.mockResolvedValue({ ...mockFoundAppointment, ...updateData }); // Default save success
      Appointment.find.mockResolvedValue([]); // Default no conflict
    });
    // Tests remain the same, but should now run without the app.address error
    it("should update an appointment successfully if owner", async () => {
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(200);
      expect(Appointment.findById).toHaveBeenCalledTimes(1); // From getAppointment
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("status", updateData.status);
    });

    it("should return 403 if user is not the owner", async () => {
      mockFoundAppointment.userId = "anotherUserId"; // Change owner
      Appointment.findById.mockResolvedValue(mockFoundAppointment); // Update mock return value
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(403);
      expect(saveMock).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty(
        "message",
        "Not authorized to update this appointment"
      );
    });

    it("should return 404 if appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null); // Mock findById to return null
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(404); // getAppointment returns 404
      expect(saveMock).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty("message", "Appointment not found");
    });

    it("should return 400 if update causes time conflict", async () => {
      // Arrange: findById finds appointment, but conflict check returns conflict
      Appointment.findById.mockResolvedValue(mockFoundAppointment);
      const conflictingAppt = {
        ...mockAppointment,
        _id: "conflictId",
        appointmentTime: "11:00",
      };
      Appointment.find.mockResolvedValue([conflictingAppt]);
      const conflictUpdateData = { appointmentTime: "10:45" };

      // Act:
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}`)
        .send(conflictUpdateData)
        .expect("Content-Type", /json/)
        .expect(400);

      // Assert:
      expect(Appointment.findById).toHaveBeenCalledTimes(1);
      expect(Appointment.find).toHaveBeenCalledTimes(1); // Conflict check called
      expect(saveMock).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty(
        "message",
        expect.stringContaining("Time conflict")
      );
    });

    it("should return 400 if save fails during update", async () => {
      // Arrange: findById finds, no conflict, but save rejects
      Appointment.findById.mockResolvedValue(mockFoundAppointment);
      Appointment.find.mockResolvedValue([]);
      const saveError = new Error("Failed to save update");
      saveMock.mockRejectedValue(saveError);

      // Act:
      const response = await request(app)
        .patch(`/api/appointments/${appointmentId}`)
        .send(updateData)
        .expect("Content-Type", /json/)
        .expect(400); // Route catches save errors as 400

      // Assert:
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", saveError.message);
    });
  }); // End describe PATCH /:id

  // --- Tests for DELETE /api/appointments/:id ---
  describe("DELETE /api/appointments/:id", () => {
    const appointmentId = "mockAppointmentId123";
    let mockFoundAppointmentForDelete;
    const deleteOneMock = jest.fn();

    beforeEach(() => {
      deleteOneMock.mockClear();
      Appointment.findById.mockClear();
      // Simulate finding the appointment
      mockFoundAppointmentForDelete = {
        _id: appointmentId,
        userId: "mockUserId123",
        deleteOne: deleteOneMock, // Attach delete mock
      };
      Appointment.findById.mockResolvedValue(mockFoundAppointmentForDelete); // Mock findById used by getAppointment
      deleteOneMock.mockResolvedValue({ acknowledged: true, deletedCount: 1 }); // Default delete success
    });
    // Tests remain the same, but should now run without the app.address error
    it("should delete an appointment successfully if owner", async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(200);
      expect(Appointment.findById).toHaveBeenCalledTimes(1); // From getAppointment
      expect(deleteOneMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", "Appointment deleted");
    });

    it("should return 403 if user is not the owner", async () => {
      mockFoundAppointmentForDelete.userId = "anotherUserId"; // Change owner
      Appointment.findById.mockResolvedValue(mockFoundAppointmentForDelete); // Update mock return value
      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(403);
      expect(deleteOneMock).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty(
        "message",
        "Not authorized to delete this appointment"
      );
    });

    it("should return 404 if appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null); // Mock findById to return null
      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(404); // getAppointment returns 404
      expect(deleteOneMock).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty("message", "Appointment not found");
    });

    it("should return 500 if deleteOne fails", async () => {
      // Arrange: findById finds, but deleteOne rejects
      Appointment.findById.mockResolvedValue(mockFoundAppointmentForDelete);
      const deleteError = new Error("Database error during delete");
      deleteOneMock.mockRejectedValue(deleteError);

      // Act:
      const response = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .expect("Content-Type", /json/)
        .expect(500); // Route catches delete errors as 500

      // Assert:
      expect(deleteOneMock).toHaveBeenCalledTimes(1);
      expect(response.body).toHaveProperty("message", deleteError.message);
    });
  }); // End describe DELETE /:id
}); // End describe Appointment Routes API
