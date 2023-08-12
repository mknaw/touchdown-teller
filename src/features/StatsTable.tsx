import { useState } from 'react';

import _ from 'lodash';

import { Typography } from '@mui/material';

import { TeamSeasonData } from '@/models/TeamSeason';

export default ({
  headers,
  data,
}: {
  headers: { [key in keyof TeamSeasonData]?: string };
  data: TeamSeasonData[];
}) => {
  const defaultSort = Object.keys(headers)[1];
  const [sortKey, setSortKey] = useState(defaultSort as keyof TeamSeasonData);
  const [isDesc, setIsDesc] = useState(true);
  const setSort = (newSort: keyof TeamSeasonData) => {
    if (newSort === sortKey) {
      // TODO would be good to have a chevron in the th
      setIsDesc(!isDesc);
    } else {
      setSortKey(newSort);
      setIsDesc(true);
    }
  };
  const orderedData = _.orderBy(data, [sortKey], [isDesc ? 'desc' : 'asc']);
  return (
    <table className={'w-full'}>
      <thead>
        <tr>
          {Object.entries(headers).map(([column, header]) => (
            <th
              key={column}
              onClick={() => setSort(column as keyof TeamSeasonData)}
              className={'pb-2'}
            >
              <Typography className={'cursor-pointer'}>
                {header as string}
              </Typography>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orderedData.map((datum, i) => (
          <tr key={i}>
            {Object.keys(headers).map((column) => (
              <td className={'text-center'}>
                <Typography>
                  {datum[column as keyof TeamSeasonData] as string}
                </Typography>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
