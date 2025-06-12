import clsx from 'clsx';
import { IBtnType } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  btnType?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const primaryStyle = clsx(
  'text-black-100 bg-white-100 border-black-100',
  'dark:text-yellow-100 dark:bg-blue-600 dark:border-yellow-100'
);
const primaryHoverStyle = clsx(
  'hover:cursor-pointer',
  'hover:bg-black-100 hover:text-white-100 hover:border-white-100',
  'hover:shadow-[inset_0_0px_5px_theme(color-shadow-100),inset_0_1px_8px_0_theme(color-shadow-100)]',
  'dark:hover:bg-yellow-100 dark:hover:text-blue-600 dark:hover:border-blue-600',
  'dark:hover:shadow-[inset_0_0px_5px_theme(color-shadow-200),inset_0_1px_8px_0_theme(color-shadow-200)]'
);

const focusStyle = 'focus:outline-0';

const paginationStyle =
  'bg-transparent text-black-100 border-black-100 dark:text-yellow-100 border dark:border-yellow-100 font-bold';
const paginationHoverStyle =
  'cursor-pointer hover:bg-black hover:text-white-100 dark:hover:text-blue-900 dark:hover:bg-yellow-100';

const searchStyle =
  'bg-transparent border-black-100 text-black-100 dark:text-yellow-100 border dark:border-yellow-100 font-bold';
const searchHoverStyle =
  'cursor-pointer hover:bg-black hover:text-white-100 dark:hover:text-blue-900 dark:hover:bg-yellow-100';

// NEW: Add button style
const generateStyle =
  'text-white-100 border font-bold dark:text-white-100 !bg-blue-100 border-blue-100';
const generateHoverStyle = 'cursor-pointer hover:!bg-blue-300 hover:border-blue-300';

const Button = (btnProps: ButtonProps) => {
  const {
    disabled,
    children,
    className,
    btnType = IBtnType.PRIMARY,
    ...props
  } = btnProps;

  const padding =
    btnType === IBtnType.SEARCH || btnType === IBtnType.GENERATE
      ? 'py-[13px] px-[30px]'
      : 'py-[6px] px-[12px]';

  const btnStyle = clsx(
    'font-medium text-base font-normal leading-[1.5] disabled:pointer-events-none',
    'rounded-md border bg-transparent',
    padding,
    'transition-colors duration-150 ease-in-out',
    focusStyle,
    btnType === IBtnType.PRIMARY
      ? primaryStyle
      : btnType === IBtnType.PAGINATION
        ? paginationStyle
        : btnType === IBtnType.SEARCH
          ? searchStyle
          : generateStyle, // use addStyle if btnType is ADD
    !disabled &&
      (btnType === IBtnType.PRIMARY
        ? primaryHoverStyle
        : btnType === IBtnType.PAGINATION
          ? paginationHoverStyle
          : btnType === IBtnType.SEARCH
            ? searchHoverStyle
            : btnType === IBtnType.GENERATE
              ? generateHoverStyle
              : ''),
    disabled && 'cursor-not-allowed opacity-50'
  );

  return (
    <button
      ref={props.ref}
      {...props}
      type="button"
      disabled={disabled}
      className={clsx(btnStyle, className)}>
      {children}
    </button>
  );
};

export default Button;
