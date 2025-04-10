import clsx from 'clsx';
import { IBtnType } from '../types'; 

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  btnType?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const primaryStyle = 'text-black-100 bg-white-100 border-black-100';
const primaryHoverStyle = clsx(
  'hover:cursor-pointer hover:bg-black-100 hover:text-white-100 hover:border-white-100',
  'hover:shadow-[inset_0_0px_5px_theme(color-shadow-100),inset_0_1px_8px_0_theme(color-shadow-100)]'
);

// @todo: should we use hover style for focus? (esp. tabbed into)
const focusStyle = 'focus:outline-0';
const paginationStyle = 'bg-transparent text-yellow-100 border border-yellow-100 font-bold';
const paginationHoverStyle = 'cursor-pointer hover:bg-blue-200';

export const Button = (btnProps : ButtonProps) => {
  const { disabled, children, className, btnType = IBtnType.PRIMARY, ...props } = btnProps;
  
  const btnStyle = clsx(
    'font-medium text-base font-normal leading-[1.5]',
    'rounded-md py-[6px] px-[12px] border bg-transparent',
    'transition-colors duration-150 ease-in-out',
    focusStyle,
    (btnType === IBtnType.PRIMARY ? primaryStyle : paginationStyle),
    !disabled &&
        (btnType === IBtnType.PRIMARY
          ? primaryHoverStyle
          : paginationHoverStyle),
    disabled && 'cursor-not-allowed opacity-50',
  );

  return (
    <button
      ref={props.ref}
      {...props}
      type='button'
      disabled={disabled}
      className={clsx(btnStyle, className)}>
      {children}
    </button>
  );
}
