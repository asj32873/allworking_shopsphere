const Address = require("../../../services/address/src/models/Address");
const {
  list,
  create,
  update,
  remove,
  setDefault,
  internalGet,
} = require("../../../services/address/src/controllers/address.controller");

jest.mock("../../../services/address/src/models/Address", () => ({
  find: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateMany: jest.fn(),
}));

describe("Address controller", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: {
          toString: () => "user-123",
        },
        id: "user-id-should-not-win",
      },
      auth: {
        id: "auth-id-should-not-win",
      },
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("list", () => {
    test("returns addresses for the authenticated user", async () => {
      const addresses = [
        { _id: "address-1", userId: "user-123", isDefault: true },
        { _id: "address-2", userId: "user-123", isDefault: false },
      ];

      const sort = jest.fn().mockResolvedValue(addresses);

      Address.find.mockReturnValue({ sort });

      await list(req, res);

      expect(Address.find).toHaveBeenCalledWith({
        userId: "user-123",
      });

      expect(sort).toHaveBeenCalledWith({
        isDefault: -1,
        createdAt: -1,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: addresses,
      });
    });

    test("uses req.user.id when req.user._id is unavailable", async () => {
      req.user = {
        id: "user-id",
      };

      const sort = jest.fn().mockResolvedValue([]);

      Address.find.mockReturnValue({ sort });

      await list(req, res);

      expect(Address.find).toHaveBeenCalledWith({
        userId: "user-id",
      });
    });

    test("uses req.auth.id when req.user has no usable id", async () => {
      req.user = {};
      req.auth = {
        id: "auth-user-id",
      };

      const sort = jest.fn().mockResolvedValue([]);

      Address.find.mockReturnValue({ sort });

      await list(req, res);

      expect(Address.find).toHaveBeenCalledWith({
        userId: "auth-user-id",
      });
    });
  });

  describe("create", () => {
    test("returns 401 when user id cannot be determined", async () => {
      req.user = {};
      req.auth = {};

      await create(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User ID not found.",
      });

      expect(Address.exists).not.toHaveBeenCalled();
      expect(Address.create).not.toHaveBeenCalled();
    });

    test("creates the first address as the default address", async () => {
      req.body = {
        type: "Home",
        addressLine: "123 Main Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      };

      Address.exists.mockResolvedValue(false);

      const createdAddress = {
        _id: "address-1",
        ...req.body,
        userId: "user-123",
        isDefault: true,
      };

      Address.create.mockResolvedValue(createdAddress);

      await create(req, res);

      expect(Address.exists).toHaveBeenCalledWith({
        userId: "user-123",
      });

      expect(Address.create).toHaveBeenCalledWith({
        ...req.body,
        userId: "user-123",
        isDefault: true,
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Address created.",
        data: createdAddress,
      });
    });

    test("creates a non-default address when the user already has an address", async () => {
      req.body = {
        type: "Office",
        addressLine: "456 Office Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560002",
      };

      Address.exists.mockResolvedValue(true);

      const createdAddress = {
        _id: "address-2",
        ...req.body,
        userId: "user-123",
        isDefault: false,
      };

      Address.create.mockResolvedValue(createdAddress);

      await create(req, res);

      expect(Address.create).toHaveBeenCalledWith({
        ...req.body,
        userId: "user-123",
        isDefault: false,
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("update", () => {
    test("updates an address belonging to the authenticated user", async () => {
      req.params.id = "address-1";
      req.body = {
        city: "Mysuru",
        pincode: "570001",
      };

      const updatedAddress = {
        _id: "address-1",
        userId: "user-123",
        ...req.body,
      };

      Address.findOneAndUpdate.mockResolvedValue(updatedAddress);

      await update(req, res);

      expect(Address.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: "address-1",
          userId: "user-123",
        },
        req.body,
        {
          new: true,
          runValidators: true,
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Address updated.",
        data: updatedAddress,
      });
    });

    test("returns 404 when the address does not exist for the user", async () => {
      req.params.id = "missing-address";
      req.body = {
        city: "Mysuru",
      };

      Address.findOneAndUpdate.mockResolvedValue(null);

      await update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Address not found.",
      });
    });
  });

  describe("remove", () => {
    test("returns 404 when the address does not exist", async () => {
      req.params.id = "missing-address";

      Address.findOneAndDelete.mockResolvedValue(null);

      await remove(req, res);

      expect(Address.findOneAndDelete).toHaveBeenCalledWith({
        _id: "missing-address",
        userId: "user-123",
      });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Address not found.",
      });

      expect(Address.findOne).not.toHaveBeenCalled();
    });

    test("deletes the address and makes the earliest remaining address default", async () => {
      req.params.id = "address-1";

      const deletedAddress = {
        _id: "address-1",
        userId: "user-123",
      };

      const replacement = {
        _id: "address-2",
        userId: "user-123",
        isDefault: false,
      };

      const sort = jest.fn().mockResolvedValue(replacement);

      Address.findOneAndDelete.mockResolvedValue(deletedAddress);
      Address.findOne.mockReturnValue({ sort });
      Address.findByIdAndUpdate.mockResolvedValue({
        ...replacement,
        isDefault: true,
      });

      await remove(req, res);

      expect(Address.findOneAndDelete).toHaveBeenCalledWith({
        _id: "address-1",
        userId: "user-123",
      });

      expect(Address.findOne).toHaveBeenCalledWith({
        userId: "user-123",
      });

      expect(sort).toHaveBeenCalledWith({
        createdAt: 1,
      });

      expect(Address.findByIdAndUpdate).toHaveBeenCalledWith(
        "address-2",
        {
          isDefault: true,
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Address deleted.",
        data: null,
      });
    });

    test("deletes the address without replacement when no addresses remain", async () => {
      req.params.id = "address-1";

      Address.findOneAndDelete.mockResolvedValue({
        _id: "address-1",
        userId: "user-123",
      });

      const sort = jest.fn().mockResolvedValue(null);

      Address.findOne.mockReturnValue({ sort });

      await remove(req, res);

      expect(Address.findByIdAndUpdate).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Address deleted.",
        data: null,
      });
    });
  });

  describe("setDefault", () => {
    test("returns 404 when the address does not exist", async () => {
      req.params.id = "missing-address";

      Address.findOne.mockResolvedValue(null);

      await setDefault(req, res);

      expect(Address.findOne).toHaveBeenCalledWith({
        _id: "missing-address",
        userId: "user-123",
      });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Address not found.",
      });

      expect(Address.updateMany).not.toHaveBeenCalled();
    });

    test("clears other defaults and saves the selected address as default", async () => {
      req.params.id = "address-2";

      const address = {
        _id: "address-2",
        userId: "user-123",
        isDefault: false,
        save: jest.fn().mockResolvedValue(undefined),
      };

      Address.findOne.mockResolvedValue(address);
      Address.updateMany.mockResolvedValue({ modifiedCount: 1 });

      await setDefault(req, res);

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
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Default address updated.",
        data: address,
      });
    });
  });

  describe("internalGet", () => {
    test("returns 404 when the address does not belong to the requested user", async () => {
      req.params = {
        id: "address-1",
        userId: "user-999",
      };

      const lean = jest.fn().mockResolvedValue(null);

      Address.findOne.mockReturnValue({ lean });

      await internalGet(req, res);

      expect(Address.findOne).toHaveBeenCalledWith({
        _id: "address-1",
        userId: "user-999",
      });

      expect(lean).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Address not found.",
      });
    });

    test("returns the address when it belongs to the requested user", async () => {
      req.params = {
        id: "address-1",
        userId: "user-123",
      };

      const address = {
        _id: "address-1",
        userId: "user-123",
        addressLine: "123 Main Street",
      };

      const lean = jest.fn().mockResolvedValue(address);

      Address.findOne.mockReturnValue({ lean });

      await internalGet(req, res);

      expect(Address.findOne).toHaveBeenCalledWith({
        _id: "address-1",
        userId: "user-123",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: address,
      });
    });
  });
});