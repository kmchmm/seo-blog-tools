import clsx from 'clsx';
import { IBtnType } from '../types';

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
  'bg-transparent text-yellow-100 border border-yellow-100 font-bold';
const paginationHoverStyle = 'cursor-pointer hover:bg-blue-200';

const searchStyle = 'bg-transparent text-yellow-100 border border-yellow-100 font-bold';

export const Button = (btnProps: ButtonProps) => {
  const {
    disabled,
    children,
    className,
    btnType = IBtnType.PRIMARY,
    ...props
  } = btnProps;

  const padding = btnType === IBtnType.SEARCH ? 'py-[13px] px-[30px]' : 'py-[6px] px-[12px]';

  const btnStyle = clsx(
    'font-medium text-base font-normal leading-[1.5]',
    'rounded-md py-[6px] px-[12px] border bg-transparent',
    padding,
    'transition-colors duration-150 ease-in-out',
    focusStyle,
    btnType === IBtnType.PRIMARY
      ? primaryStyle
      : btnType === IBtnType.PAGINATION
      ? paginationStyle
      : searchStyle,
    !disabled &&
      (btnType === IBtnType.PRIMARY
        ? primaryHoverStyle
        : paginationHoverStyle),
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
