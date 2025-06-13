import React from 'react';

type Props = {
  label: string;
  name: string;
  id: string;
  onInputChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  value: string;
  error?: boolean;
  helperText?: string;
};

const Input = ({
  label,
  name,
  id,
  onInputChange,
  value,
  required,
  error = false,
  helperText = '',
}: Props) => {
  return (
    <div className="w-1/2">
      <label htmlFor={id}>{label}</label>
      <input
        name={name}
        id={id}
        required={required}
        type="text"
        value={value}
        className="!w-full py-2"
        onChange={onInputChange}
      />
      {error && <p className="text-red-600 italic mt-2">{helperText}</p>}
    </div>
  );
};

export default Input;
