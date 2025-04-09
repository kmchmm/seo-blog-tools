import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  btnType?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

export enum IBtnType {
  PRIMARY = 'primary',
  PAGINATION = 'pagination',
}

export const Button = (btnProps : ButtonProps) => {
  const { disabled, children, className, btnType = IBtnType.PRIMARY, ...props } = btnProps;

  
  const btnStyle = clsx(
    'cursor-pointer font-medium text-base rounded-lg py-[0.6em] px-[1.2em]',
    'transition-[border-color] duration-250',
    'hover:bg-blue-100',
    !disabled &&
        (primary
          ? 'cursor-pointer hover:bg-primary-light'
          : 'cursor-pointer hover:bg-secondary-light'),
    disabled && 'opacity-50',
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
