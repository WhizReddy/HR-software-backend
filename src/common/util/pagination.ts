import { FilterQuery, Model, PipelineStage, PopulateOptions } from 'mongoose';

/**
 * Paginate a Mongoose query.
 * @param page  0-based page number (page=0 → first page, page=1 → second page, etc.)
 * @param limit Number of documents per page
 */
export async function paginate(
  page: number,
  limit: number,
  model: Model<any>,
  filter: FilterQuery<any> = {},
  sort?: any,
  populate?: PopulateOptions | (string | PopulateOptions)[],
): Promise<any> {
  try {
    const count = await model.countDocuments(filter);

    let query = model.find(filter);

    if (sort) {
      query = query.sort(sort);
    }

    if (populate) {
      query = query.populate(populate);
    }
    // 0-based page: page=0 → first page (all frontend callers use 0-based)
    const data = await query.skip(page * limit).limit(limit);
    const totalPages = Math.ceil(count / limit);
    return { data, totalPages, all: count };
  } catch (error) {
    console.error('Pagination error:', error);
    throw new Error('Failed to paginate');
  }
}

export async function aggregatePaginate(
  page?: number,
  limit?: number,
  model?: Model<any>,
  filter?: FilterQuery<any>,
  aggregationPipeline?: PipelineStage[],
): Promise<any> {
  try {
    let count: number;
    let data: any[];

    if (aggregationPipeline) {
      const countPipeline = [...aggregationPipeline, { $count: 'total' }];
      const countResult = await model.aggregate(countPipeline);
      count = countResult[0]?.total || 0;

      data = await model.aggregate([
        ...aggregationPipeline,
        { $skip: page * limit },
        { $limit: limit },
      ]);
    } else {
      count = await model.find(filter).countDocuments();
      data = await model
        .find(filter)
        .limit(limit)
        .skip(page * limit);
    }

    const totalPages = Math.ceil(count / limit);
    return { data, totalPages, all: count };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to paginate');
  }
}
