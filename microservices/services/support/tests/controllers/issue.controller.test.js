jest.mock("../../src/models/CustomerIssue", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("../../src/utils/serviceClient", () => ({
  getJson: jest.fn(),
}));

jest.mock("../../src/utils/apiResponse", () => ({
  ok: jest.fn((res, data, message = "OK", status = 200) => {
    res.status(status).json({ success: true, message, data });
    return res;
  }),
  fail: jest.fn((res, message, status = 400, details) => {
    res.status(status).json({
      success: false,
      message,
      ...(details ? { details } : {}),
    });
    return res;
  }),
}));

const Issue = require("../../src/models/CustomerIssue");
const { getJson } = require("../../src/utils/serviceClient");
const { ok, fail } = require("../../src/utils/apiResponse");
const controller = require("../../src/controllers/issue.controller");

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const chain = (value) => {
  const lean = jest.fn().mockResolvedValue(value);
  const sort = jest.fn(() => ({ lean }));
  return { sort, lean };
};

describe("issue controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ORDER_SERVICE_URL;
  });

  test("create submits issue without order validation", async () => {
    const issue = { _id: "i1", subject: "Problem" };
    Issue.create.mockResolvedValue(issue);

    const req = {
      body: { subject: "Problem" },
      user: { id: "u1" },
      headers: {},
    };
    const res = response();

    await controller.create(req, res);

    expect(Issue.create).toHaveBeenCalledWith({
      subject: "Problem",
      userId: "u1",
    });
    expect(ok).toHaveBeenCalledWith(res, issue, "Issue submitted.", 201);
  });

  test("create uses _id when available and validates order ownership", async () => {
    process.env.ORDER_SERVICE_URL = "http://orders";
    getJson.mockResolvedValue({ ok: true });
    Issue.create.mockResolvedValue({ _id: "i1" });

    const req = {
      body: { orderId: "o1", subject: "Problem" },
      user: { _id: "u1", id: "fallback" },
      headers: { authorization: "Bearer abc" },
    };
    const res = response();

    await controller.create(req, res);

    expect(getJson).toHaveBeenCalledWith(
      "http://orders",
      "/api/orders/o1",
      { authorization: "Bearer abc" }
    );
    expect(Issue.create).toHaveBeenCalledWith({
      orderId: "o1",
      subject: "Problem",
      userId: "u1",
    });
  });

  test("create rejects order when downstream validation fails", async () => {
    getJson.mockResolvedValue({ ok: false });

    const req = {
      body: { orderId: "o1", subject: "Problem" },
      user: { id: "u1" },
      headers: {},
    };
    const res = response();

    await controller.create(req, res);

    expect(fail).toHaveBeenCalledWith(
      res,
      "Order does not belong to you.",
      403
    );
    expect(Issue.create).not.toHaveBeenCalled();
  });

  test("list filters USER issues", async () => {
    Issue.find.mockReturnValue(chain([{ _id: "i1" }]));

    const req = {
      user: { role: "USER", id: "u1" },
      query: {},
    };
    const res = response();

    await controller.list(req, res);

    expect(Issue.find).toHaveBeenCalledWith({ userId: "u1" });
    expect(ok).toHaveBeenCalledWith(res, [{ _id: "i1" }]);
  });

  test("list builds VENDOR filter from order ids and query filters", async () => {
    process.env.ORDER_SERVICE_URL = "http://orders";
    getJson.mockResolvedValue({
      data: { data: ["o1", "o2"] },
    });
    Issue.find.mockReturnValue(chain([]));

    const req = {
      user: { role: "VENDOR", _id: "v1" },
      query: {
        status: "OPEN",
        priority: "HIGH",
        assignedTo: "v2",
      },
    };
    const res = response();

    await controller.list(req, res);

    expect(getJson).toHaveBeenCalledWith(
      "http://orders",
      "/internal/orders/vendor/v1/order-ids"
    );
    expect(Issue.find).toHaveBeenCalledWith({
      $or: [
        { assignedTo: "v1" },
        { orderId: { $in: ["o1", "o2"] } },
      ],
      status: "OPEN",
      priority: "HIGH",
      assignedTo: "v2",
    });
  });

  test("list handles missing downstream data and ADMIN role", async () => {
    getJson.mockResolvedValue({ data: {} });
    Issue.find.mockReturnValue(chain([]));

    await controller.list(
      { user: { role: "VENDOR", id: "v1" }, query: {} },
      response()
    );

    expect(Issue.find).toHaveBeenCalledWith({
      $or: [
        { assignedTo: "v1" },
        { orderId: { $in: [] } },
      ],
    });

    Issue.find.mockReturnValue(chain([]));
    await controller.list(
      { user: { role: "ADMIN", id: "a1" }, query: {} },
      response()
    );
    expect(Issue.find).toHaveBeenCalledWith({});
  });

  test("list uses optional filters only when supplied", async () => {
    Issue.find.mockReturnValue(chain([]));

    await controller.list(
      {
        user: { role: "USER", id: "u1" },
        query: { status: "CLOSED" },
      },
      response()
    );

    expect(Issue.find).toHaveBeenCalledWith({
      userId: "u1",
      status: "CLOSED",
    });
  });

  test("getById returns 404 when issue is missing", async () => {
    Issue.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    const res = response();

    await controller.getById(
      { params: { id: "i1" }, user: { id: "u1", role: "USER" } },
      res
    );

    expect(fail).toHaveBeenCalledWith(res, "Issue not found.", 404);
  });

  test("getById hides another user's issue", async () => {
    const issue = {
      userId: { toString: () => "u2" },
    };
    Issue.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(issue),
    });

    const res = response();

    await controller.getById(
      { params: { id: "i1" }, user: { id: "u1", role: "USER" } },
      res
    );

    expect(fail).toHaveBeenCalledWith(res, "Issue not found.", 404);
  });

  test("getById returns issue for owner", async () => {
    const issue = {
      _id: "i1",
      userId: { toString: () => "u1" },
    };
    Issue.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(issue),
    });

    const res = response();

    await controller.getById(
      { params: { id: "i1" }, user: { id: "u1", role: "USER" } },
      res
    );

    expect(ok).toHaveBeenCalledWith(res, issue);
  });

  test("getById allows vendor/admin to view existing issue", async () => {
    const issue = { _id: "i1", userId: { toString: () => "u2" } };
    Issue.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(issue),
    });

    const res = response();

    await controller.getById(
      { params: { id: "i1" }, user: { id: "v1", role: "VENDOR" } },
      res
    );

    expect(ok).toHaveBeenCalledWith(res, issue);
  });

  test("update returns 404 when issue is missing", async () => {
    Issue.findById.mockResolvedValue(null);
    const res = response();

    await controller.update(
      { params: { id: "i1" }, user: { id: "u1", role: "USER" }, body: {} },
      res
    );

    expect(fail).toHaveBeenCalledWith(res, "Issue not found.", 404);
  });

  test("update prevents USER from updating another user's issue", async () => {
    const issue = {
      userId: { toString: () => "u2" },
    };
    Issue.findById.mockResolvedValue(issue);

    const res = response();

    await controller.update(
      {
        params: { id: "i1" },
        user: { id: "u1", role: "USER" },
        body: { response: "x" },
      },
      res
    );

    expect(fail).toHaveBeenCalledWith(res, "Issue not found.", 404);
    expect(issue.save).toBeUndefined();
  });

  test("update allows VENDOR to change only status and response", async () => {
    const issue = {
      status: "OPEN",
      response: undefined,
      priority: "LOW",
      userId: { toString: () => "other" },
      save: jest.fn().mockResolvedValue(undefined),
    };
    Issue.findById.mockResolvedValue(issue);

    const res = response();

    await controller.update(
      {
        params: { id: "i1" },
        user: { id: "v1", role: "VENDOR" },
        body: {
          status: "RESOLVED",
          response: "Fixed",
          priority: "URGENT",
          assignedTo: "v2",
        },
      },
      res
    );

    expect(issue.status).toBe("RESOLVED");
    expect(issue.response).toBe("Fixed");
    expect(issue.priority).toBe("LOW");
    expect(issue.assignedTo).toBeUndefined();
    expect(issue.resolvedAt).toBeInstanceOf(Date);
    expect(issue.save).toHaveBeenCalled();
    expect(ok).toHaveBeenCalledWith(res, issue, "Issue updated.");
  });

  test("update allows VENDOR to omit optional fields", async () => {
    const issue = {
      status: "OPEN",
      userId: { toString: () => "other" },
      save: jest.fn().mockResolvedValue(undefined),
    };
    Issue.findById.mockResolvedValue(issue);

    await controller.update(
      {
        params: { id: "i1" },
        user: { id: "v1", role: "VENDOR" },
        body: {},
      },
      response()
    );

    expect(issue.status).toBe("OPEN");
    expect(issue.resolvedAt).toBeUndefined();
    expect(issue.save).toHaveBeenCalled();
  });

  test("update allows ADMIN to assign all body fields", async () => {
    const issue = {
      status: "OPEN",
      userId: { toString: () => "u1" },
      save: jest.fn().mockResolvedValue(undefined),
    };
    Issue.findById.mockResolvedValue(issue);

    await controller.update(
      {
        params: { id: "i1" },
        user: { id: "a1", role: "ADMIN" },
        body: {
          status: "CLOSED",
          priority: "HIGH",
          response: "Done",
        },
      },
      response()
    );

    expect(issue.status).toBe("CLOSED");
    expect(issue.priority).toBe("HIGH");
    expect(issue.response).toBe("Done");
    expect(issue.resolvedAt).toBeInstanceOf(Date);
  });

  test("update preserves an existing resolvedAt date", async () => {
    const oldDate = new Date("2025-01-01");
    const issue = {
      status: "RESOLVED",
      resolvedAt: oldDate,
      userId: { toString: () => "u1" },
      save: jest.fn().mockResolvedValue(undefined),
    };
    Issue.findById.mockResolvedValue(issue);

    await controller.update(
      {
        params: { id: "i1" },
        user: { id: "u1", role: "USER" },
        body: { status: "RESOLVED" },
      },
      response()
    );

    expect(issue.resolvedAt).toBe(oldDate);
  });

  test("update clears resolvedAt when issue is reopened", async () => {
    const issue = {
      status: "RESOLVED",
      resolvedAt: new Date(),
      userId: { toString: () => "u1" },
      save: jest.fn().mockResolvedValue(undefined),
    };
    Issue.findById.mockResolvedValue(issue);

    await controller.update(
      {
        params: { id: "i1" },
        user: { id: "u1", role: "USER" },
        body: { status: "OPEN" },
      },
      response()
    );

    expect(issue.resolvedAt).toBeUndefined();
  });

  test("internalVendorCount returns 502 when order service fails", async () => {
    getJson.mockResolvedValue({ ok: false });
    const res = response();

    await controller.internalVendorCount(
      { params: { vendorId: "v1" } },
      res
    );

    expect(fail).toHaveBeenCalledWith(
      res,
      "Unable to retrieve vendor orders.",
      502
    );
    expect(Issue.countDocuments).not.toHaveBeenCalled();
  });

  test("internalVendorCount counts unresolved vendor issues", async () => {
    getJson.mockResolvedValue({
      ok: true,
      data: { data: ["o1", "o2"] },
    });
    Issue.countDocuments.mockResolvedValue(3);

    const res = response();

    await controller.internalVendorCount(
      { params: { vendorId: "v1" } },
      res
    );

    expect(Issue.countDocuments).toHaveBeenCalledWith({
      $or: [
        { assignedTo: "v1" },
        { orderId: { $in: ["o1", "o2"] } },
      ],
      status: {
        $nin: ["RESOLVED", "CLOSED"],
      },
    });

    expect(ok).toHaveBeenCalledWith(res, {
      vendorId: "v1",
      count: 3,
    });
  });

  test("internalVendorCount handles missing order data", async () => {
    getJson.mockResolvedValue({ ok: true, data: {} });
    Issue.countDocuments.mockResolvedValue(0);

    await controller.internalVendorCount(
      { params: { vendorId: "v1" } },
      response()
    );

    expect(Issue.countDocuments).toHaveBeenCalledWith({
      $or: [
        { assignedTo: "v1" },
        { orderId: { $in: [] } },
      ],
      status: {
        $nin: ["RESOLVED", "CLOSED"],
      },
    });
  });
});

