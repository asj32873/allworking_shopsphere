const {
  pagination,
  buildProductFilter,
  productSort,
  buildProductCacheKey,
} = require("../../src/services/query.service");

describe("query service", () => {
  describe("pagination", () => {
    test("uses defaults", () => {
      const req = {
        query: {},
      };

      expect(pagination(req)).toEqual({
        page: 1,
        limit: 9,
        skip: 0,
      });
    });

    test("calculates page and skip", () => {
      const req = {
        query: {
          page: "3",
          limit: "10",
        },
      };

      expect(pagination(req)).toEqual({
        page: 3,
        limit: 10,
        skip: 20,
      });
    });

    test("prevents page below 1", () => {
      expect(
        pagination({
          query: {
            page: "0",
            limit: "10",
          },
        })
      ).toEqual({
        page: 1,
        limit: 10,
        skip: 0,
      });
    });

    test("prevents limit above 100", () => {
      expect(
        pagination({
          query: {
            page: "1",
            limit: "500",
          },
        })
      ).toEqual({
        page: 1,
        limit: 100,
        skip: 0,
      });
    });

    test("prevents limit below 1", () => {
      expect(
        pagination({
          query: {
            page: "1",
            limit: "0",
          },
        })
      ).toEqual({
        page: 1,
        limit: 1,
        skip: 0,
      });
    });
  });

  describe("buildProductFilter", () => {
    test("returns empty filter", () => {
      expect(buildProductFilter({})).toEqual({});
    });

    test("builds text search filter", () => {
      const result = buildProductFilter({
        q: "iphone",
      });

      expect(result).toEqual({
        $or: [
          {
            name: {
              $regex: "iphone",
              $options: "i",
            },
          },
          {
            brand: {
              $regex: "iphone",
              $options: "i",
            },
          },
          {
            description: {
              $regex: "iphone",
              $options: "i",
            },
          },
        ],
      });
    });

    test("escapes regex characters", () => {
      const result = buildProductFilter({
        q: "iphone+",
      });

      expect(result.$or[0].name.$regex).toBe("iphone\\+");
    });

    test("builds brand filter", () => {
      expect(
        buildProductFilter({
          brand: "Apple",
        })
      ).toEqual({
        brand: "Apple",
      });
    });

    test("builds category filter", () => {
      expect(
        buildProductFilter({
          category: "MOBILE",
        })
      ).toEqual({
        category: "MOBILE",
      });
    });

    test("builds minimum price filter", () => {
      expect(
        buildProductFilter({
          minPrice: "100",
        })
      ).toEqual({
        price: {
          $gte: 100,
        },
      });
    });

    test("builds maximum price filter", () => {
      expect(
        buildProductFilter({
          maxPrice: "1000",
        })
      ).toEqual({
        price: {
          $lte: 1000,
        },
      });
    });

    test("builds price range filter", () => {
      expect(
        buildProductFilter({
          minPrice: "100",
          maxPrice: "1000",
        })
      ).toEqual({
        price: {
          $gte: 100,
          $lte: 1000,
        },
      });
    });

    test("builds rating filter", () => {
      expect(
        buildProductFilter({
          rating: "4",
        })
      ).toEqual({
        rating: {
          $gte: 4,
        },
      });
    });

    test("builds in-stock filter", () => {
      expect(
        buildProductFilter({
          stock: "in",
        })
      ).toEqual({
        stock: {
          $gt: 0,
        },
      });
    });

    test("builds out-of-stock filter", () => {
      expect(
        buildProductFilter({
          stock: "out",
        })
      ).toEqual({
        stock: 0,
      });
    });

    test("builds vendor filter", () => {
      expect(
        buildProductFilter({
          vendorId: "vendor-1",
        })
      ).toEqual({
        vendorId: "vendor-1",
      });
    });

    test("builds combined filter", () => {
      const result = buildProductFilter({
        brand: "Apple",
        category: "MOBILE",
        minPrice: "100",
        maxPrice: "2000",
        rating: "4",
        stock: "in",
        vendorId: "vendor-1",
      });

      expect(result).toEqual({
        brand: "Apple",
        category: "MOBILE",
        price: {
          $gte: 100,
          $lte: 2000,
        },
        rating: {
          $gte: 4,
        },
        stock: {
          $gt: 0,
        },
        vendorId: "vendor-1",
      });
    });
  });

  describe("productSort", () => {
    test("sorts low price first", () => {
      expect(productSort("low")).toEqual({
        price: 1,
      });
    });

    test("sorts high price first", () => {
      expect(productSort("high")).toEqual({
        price: -1,
      });
    });

    test("sorts by rating", () => {
      expect(productSort("rating")).toEqual({
        rating: -1,
      });
    });

    test("defaults to newest products", () => {
      expect(productSort()).toEqual({
        createdAt: -1,
      });
    });
  });

  describe("buildProductCacheKey", () => {
    test("creates cache key", () => {
      expect(
        buildProductCacheKey({
          page: "1",
          brand: "Apple",
        })
      ).toBe(
        'products:list:{"brand":"Apple","page":"1"}'
      );
    });

    test("produces same key regardless of query order", () => {
      const key1 = buildProductCacheKey({
        brand: "Apple",
        page: "1",
      });

      const key2 = buildProductCacheKey({
        page: "1",
        brand: "Apple",
      });

      expect(key1).toBe(key2);
    });
  });
});