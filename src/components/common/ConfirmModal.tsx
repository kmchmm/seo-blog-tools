import { Modal } from '../Modal';
import Button from './Button';

type Props = {
  allowClosing?: boolean;
  containerClassName?: string;
  open: boolean;
  toggle: () => void;
  onYesClick: () => void;
  title: string;
  message: string | React.ReactNode;
  loading?: boolean | undefined;
  yesText?: string;
  noText?: string;
  hideNo?: boolean;
  noButtonVariant?: 'clear' | 'outlined';
};

const ConfirmModal = ({
  open,
  toggle,
  onYesClick,
  message,
  loading,
  yesText = 'Yes',
  hideNo = false,
  noText = 'No',
  containerClassName = '',
  title = 'Confirm',
}: Props) => {
  return (
    <Modal isOpen={open} onClose={toggle} title={title} width="600px" height="auto">
      <div className="w-full p-6">
        <div className={`${containerClassName} p-4 text-center`}>
          {typeof message === 'string' ? (
            <span className="text-[#757575]">{message}</span>
          ) : (
            message
          )}
        </div>
        <div className="pt-3 flex justify-end gap-2">
          {hideNo ? null : (
            <Button onClick={toggle} disabled={loading}>
              {noText}
            </Button>
          )}
          <Button onClick={onYesClick} disabled={loading} loading={loading}>
            {yesText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
