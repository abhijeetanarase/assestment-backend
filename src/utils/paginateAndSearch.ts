import { FilterQuery, Model } from "mongoose";
import { getCache, setCache } from "../utils/cache"; // adjust path if needed

interface PaginateOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  filter?: Record<string, any>;
  sort: Record<string, 1 | -1>;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

export const paginateAndSearch = async <T>(
  model: Model<T>,
  {
    page = 1,
    limit = 10,
    search = "",
    searchFields = [],
    filter = {},
    sort = { createdAt: -1 },
  }: PaginateOptions
): Promise<PaginatedResult<T>> => {
  const query = { ...filter } as FilterQuery<T>;

  // Handle search
  if (search && searchFields.length > 0) {
    query["$or"] = searchFields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    })) as FilterQuery<T>["$or"];
  }

  const skip = (page - 1) * limit;

  // Generate cache key
  const cacheKey = `${model.modelName}:page=${page}:limit=${limit}:search=${search}:searchFields=${searchFields.join(",")}:filter=${JSON.stringify(
    filter
  )}:sort=${JSON.stringify(sort)}`;

  // Try getting from cache
  const cached = await getCache<PaginatedResult<T>>(cacheKey);
  if (cached) {
    return cached ;
  }

  // DB Query
  const [data, total] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit),
    model.countDocuments(query),
  ]);

  const result: PaginatedResult<T> = {
    data,
    total,
    page,
    pages: Math.ceil(total / limit),
  };

  // Set cache
  await setCache(cacheKey, result, 600); // cache for 10 minutes

  return result;
};
