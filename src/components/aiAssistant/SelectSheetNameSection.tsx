import React from 'react';

type Props = {
  sheetName: string;
  handleSheetChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  loadingSheets: Record<string, boolean>;
  completed: Record<string, boolean>;
  sheetNames: string[];
};

const SelectSheetNameSection = ({
  sheetName,
  handleSheetChange,
  loadingSheets,
  completed,
  sheetNames,
}: Props) => {
  return (
    <div className="mx-auto max-w-xl w-full">
      <div className="flex gap-5 items-center justify-between">
        <p className="font-semibold">Select Sheet Name:</p>
        <select
          value={sheetName}
          onChange={handleSheetChange}
          className="h-12 px-2 border rounded w-full bg-red-100">
          <option value="" disabled>
            Select a sheet
          </option>
          {sheetNames.map(name => (
            <option key={name} value={name}>
              {name}{' '}
              {loadingSheets[name] ? <p className="italic">(Processing...)</p> : ''}
              {completed[name] && ' ✅'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectSheetNameSection;
