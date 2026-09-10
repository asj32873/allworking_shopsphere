const Address = require("../../src/models/Address");
const controller = require("../../src/controllers/address.controller");

jest.mock("../../src/models/Address", () => ({
  find: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock("@shopsphere/common", () => ({
  ok: jest.fn((res, data, message, status = 200) => {
    return res.status(status).json({
      success: true,
      data,
      message,
    });
  }),

  fail: jest.fn((res, message, status = 400) => {
    return res.status(status).json({
      success: false,
      message,
    });
  }),
}));

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function userRequest(overrides = {}) {
  return {
    user: {
      _id: {
        toString: () => "user-123",
      },
    },
    ...overrides,
  };
}

describe("address.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("list", () => {
    test("returns addresses for the authenticated user", async () => {
      const addresses = [
        {
          _id: "address-1",
          userId: "user-123",
          type: "Home",
        },
      ];

      Address.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(addresses),
      });

      const req = userRequest();
      const res = createResponse();

      await controller.list(req, res);

      expect(Address.find).toHaveBeenCalledWith({
        userId: "user-123",
      });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: addresses,
        message: "OK",
      });
    });

    test("supports req.user.id", async () => {
      const addresses = [];

      Address.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(addresses),
      });

      const req = {
        user: {
          id: "user-from-id",
        },
      };

      const res = createResponse();

      await controller.list(req, res);

      expect(Address.find).toHaveBeenCalledWith({
        userId: "user-from-id",
      });
    });

    test("supports req.auth.id", async () => {
      const addresses = [];

      Address.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(addresses),
      });

      const req = {
        auth: {
          id: "auth-user",
        },
      };

      const res = createResponse();

      await controller.list(req, res);

      expect(Address.find).toHaveBeenCalledWith({
        userId: "auth-user",
      });
    });
  });

  describe("create", () => {
    test("creates the first address as default", async () => {
      Address.exists.mockResolvedValue(null);

      const createdAddress = {
        _id: "address-1",
        userId: "user-123",
        type: "Home",
        addressLine: "123 Main Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        isDefault: true,
      };

      Address.create.mockResolvedValue(createdAddress);

      const req = userRequest({
        body: {
          type: "Home",
          addressLine: "123 Main Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = createResponse();

      await controller.create(req, res);

      expect(Address.exists).toHaveBeenCalledWith({
        userId: "user-123",
      });

      expect(Address.create).toHaveBeenCalledWith({
        type: "Home",
        addressLine: "123 Main Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        userId: "user-123",
        isDefault: true,
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test("creates a non-default address when the user already has one", async () => {
      Address.exists.mockResolvedValue({
        _id: "existing-address",
      });

      Address.create.mockResolvedValue({
        _id: "address-2",
      });

      const req = userRequest({
        body: {
          type: "Office",
          addressLine: "456 Office Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560002",
        },
      });

      const res = createResponse();

      await controller.create(req, res);

      expect(Address.create).toHaveBeenCalledWith({
        type: "Office",
        addressLine: "456 Office Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560002",
        userId: "user-123",
        isDefault: false,
      });
    });

    test("returns 401 when no authenticated user exists", async () => {
      const req = {
        body: {
          addressLine: "123 Main Street",
        },
      };

      const res = createResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(Address.exists).not.toHaveBeenCalled();
      expect(Address.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    test("updates an address belonging to the user", async () => {
      const updated = {
        _id: "address-1",
        userId: "user-123",
        city: "Mysuru",
      };

      Address.findOneAndUpdate.mockResolvedValue(updated);

      const req = userRequest({
        params: {
          id: "address-1",
        },
        body: {
          city: "Mysuru",
        },
      });

      const res = createResponse();

      await controller.update(req, res);

      expect(Address.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: "address-1",
          userId: "user-123",
        },
        {
          city: "Mysuru",
        },
        {
          new: true,
          runValidators: true,
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when address does not belong to user", async () => {
      Address.findOneAndUpdate.mockResolvedValue(null);

      const req = userRequest({
        params: {
          id: "missing-address",
        },
        body: {
          city: "Mysuru",
        },
      });

      const res = createResponse();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("remove", () => {
    test("deletes an address", async () => {
      Address.findOneAndDelete.mockResolvedValue({
        _id: "address-1",
      });

      Address.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      const req = userRequest({
        params: {
          id: "address-1",
        },
      });

      const res = createResponse();

      await controller.remove(req, res);

      expect(Address.findOneAndDelete).toHaveBeenCalledWith({
        _id: "address-1",
        userId: "user-123",
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("promotes the oldest remaining address after deleting one", async () => {
      Address.findOneAndDelete.mockResolvedValue({
        _id: "address-1",
      });

      const replacement = {
        _id: "address-2",
      };

      Address.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(replacement),
      });

      Address.findByIdAndUpdate.mockResolvedValue(replacement);

      const req = userRequest({
        params: {
          id: "address-1",
        },
      });

      const res = createResponse();

      await controller.remove(req, res);

      expect(Address.findOne).toHaveBeenCalledWith({
        userId: "user-123",
      });

      expect(Address.findByIdAndUpdate).toHaveBeenCalledWith("address-2", {
        isDefault: true,
      });
    });

    test("returns 404 when address does not exist", async () => {
      Address.findOneAndDelete.mockResolvedValue(null);

      const req = userRequest({
        params: {
          id: "missing-address",
        },
      });

      const res = createResponse();

      await controller.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(Address.findOne).not.toHaveBeenCalled();
    });
  });

  describe("setDefault", () => {
    test("sets an address as default", async () => {
      const address = {
        _id: "address-1",
        userId: "user-123",
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };

      Address.findOne.mockResolvedValue(address);
      Address.updateMany.mockResolvedValue({ modifiedCount: 1 });

      const req = userRequest({
        params: {
          id: "address-1",
        },
      });

      const res = createResponse();

      await controller.setDefault(req, res);

      expect(Address.findOne).toHaveBeenCalledWith({
        _id: "address-1",
        userId: "user-123",
      });

      expect(Address.updateMany).toHaveBeenCalledWith(
        {
          userId: "user-123",
        },
        {
          isDefault: false,
        },
      );

      expect(address.isDefault).toBe(true);
      expect(address.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when address does not exist", async () => {
      Address.findOne.mockResolvedValue(null);

      const req = userRequest({
        params: {
          id: "missing-address",
        },
      });

      const res = createResponse();

      await controller.setDefault(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(Address.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("internalGet", () => {
    test("returns an address for the requested user", async () => {
      const address = {
        _id: "address-1",
        userId: "user-123",
      };

      Address.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(address),
      });

      const req = {
        params: {
          userId: "user-123",
          id: "address-1",
        },
      };

      const res = createResponse();

      await controller.internalGet(req, res);

      expect(Address.findOne).toHaveBeenCalledWith({
        _id: "address-1",
        userId: "user-123",
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("returns 404 when address is not found", async () => {
      Address.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = {
        params: {
          userId: "user-123",
          id: "missing-address",
        },
      };

      const res = createResponse();

      await controller.internalGet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
