import { Input } from '../common';
import { FaCircleChevronRight } from 'react-icons/fa6';

type Props = {
  disabled: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  handleClickNext: () => void;
};
const InputSection = ({ disabled, value, onInputChange, handleClickNext }: Props) => {
  return (
    <div className="w-full flex items-center gap-x-4 sm:flex-row flex-col">
      <Input
        disabled={disabled}
        id="ai-assistant-input"
        label="Enter the spreadsheet URL:"
        name="ai-assistant-input"
        onInputChange={onInputChange}
        value={value}
        customClassName="w-full flex items-center sm:flex-row flex-col disabled:bg-gray-200"
      />
      <button
        type="button"
        disabled={disabled || !value}
        className="cursor-pointer hover:scale-125 transform duration-300 disabled:pointer-events-none"
        onClick={handleClickNext}>
        <FaCircleChevronRight color="blue" size={25} />
      </button>
    </div>
  );
};

export default InputSection;
