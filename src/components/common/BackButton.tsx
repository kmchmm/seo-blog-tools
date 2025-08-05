import { MdOutlineKeyboardArrowLeft } from 'react-icons/md';

type Props = {
  onClick: () => void;
};

const BackButton = ({ onClick }: Props) => {
  return (
    <button
      type="button"
      className="p-2 rounded-full hover:bg-gray-200 cursor-pointer"
      onClick={onClick}>
      <MdOutlineKeyboardArrowLeft size="1.5em" />
    </button>
  );
};

export default BackButton;
