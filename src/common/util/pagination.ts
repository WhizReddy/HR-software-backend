import { FilterQuery, Model, PipelineStage, PopulateOptions } from 'mongoose';

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
  return new Promise(async (resolve, reject) => {
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
      resolve({ data, totalPages, all: count });
    } catch (error) {
      console.error(error);
      reject('Failed to paginate');
    }
  });
}
