import React from 'react';

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  name: string;
  id: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  value: string;
  options: Option[];
  required?: boolean;
  error?: boolean;
  helperText?: string;
  customClassName?: string;
  disabled?: boolean;
};

const SelectInput = ({
  label,
  name,
  id,
  onChange,
  value,
  options,
  required = false,
  error = false,
  helperText = '',
  customClassName = '',
  disabled = false,
}: Props) => {
  return (
    <div className={`w-1/2 flex flex-col ${customClassName}`}>
      <label htmlFor={id}>{label}</label>
      <select
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="!w-full py-2 disabled:!bg-gray-200 disabled:!text-gray-600">
        <option value="" disabled>
          -- Select an option --
        </option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 italic mt-2">{helperText}</p>}
    </div>
  );
};

export default SelectInput;
