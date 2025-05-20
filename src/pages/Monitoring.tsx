import { FC } from 'react';
import clsx from 'clsx';

const Monitoring: FC = () => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AKPHub Monitoring</h1>

      <div className="flex gap-5 mt-5">
        <div>
          <h3>Timed-In Users</h3>
          <input 
          type="text" 
          name="" 
          id="" 
          placeholder="Email"
          className="!w-1/2"
          />
          
          <div className="paa-table-container m-0 p-0 w-full">
            <table
              className={clsx(
                'w-full my-[20px] mx-auto border-collapse',
                'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
              )}
            >
              <thead>
                <tr>
                  <th className="w-1/2 border border-amber-200">Email</th>
                  <th className="w-1/4 border border-amber-200">Time In</th>
                  <th className="w-1/4 border border-amber-200">Time Out</th>
                </tr>
              </thead>
              <tbody>
                  <tr>
                    <td className="border border-amber-200"></td>
                    <td className="border border-amber-200"></td>
                    <td className="border border-amber-200"></td>
                  </tr>
              </tbody>
            </table>
          </div>

        </div>
        <div>
          <h3>User Breaks</h3>
          <div className="flex gap-3">
            <input 
            type="text" 
            name="" 
            id="" 
            placeholder="Email"
            className="!w-1/3"
            />
            <select name="" id="">
              <option value="">All</option>
              <option value="">Bio Break</option>
              <option value="">Quick Break</option>
              <option value="">Mandatory 10 Minutes Break&#40;ON TIMER&#41;</option>
              <option value="">15 Minutes Lunch Break&#40;ON TIMER&#41;</option>
              <option value="">30 Minutes Lunch Break&#40;OFF TIMER&#41;</option>
            </select>
          </div>
          
            <div className="paa-table-container m-0 p-0 w-full">
              <table
                className={clsx(
                  'w-full my-[20px] mx-auto border-collapse',
                  'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
                )}
              >
                <thead>
                  <tr>
                    <th className="w-1/2 border border-amber-200">Email</th>
                    <th className="w-1/4 border border-amber-200">Break Type</th>
                    <th className="w-1/4 border border-amber-200">Duration</th>
                  </tr>
                </thead>
                <tbody>
                    <tr>
                      <td className="border border-amber-200"></td>
                      <td className="border border-amber-200"></td>
                      <td className="border border-amber-200"></td>
                    </tr>
                </tbody>
              </table>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Monitoring;
