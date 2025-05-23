import clsx from 'clsx';
import { HTMLAttributes, ReactNode, useState } from 'react';
import { GoChevronDown } from "react-icons/go";

interface AccordionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  header: ReactNode
}

export const Accordion = (accProps: AccordionProps) => {
  const {
    children,
    className,
    header
  } = accProps;

  const [ expanded, setExpanded ] = useState<boolean>(false);

  return (
    <section className={clsx(
      className,
      'border rounded-sm',
      /* we used this to signal to browser to include keywords in sizes 
      in transition effects, e.g. auto, inherit, etc. */
      '[interpolate-size:allow-keywords]',
      'shadow-[rgba(0,0,0,0.2)_0px_2px_1px_-1px,rgba(0,0,0,0.14)_0px_1px_1px_0px,rgba(0,0,0,0.12)_0px_1px_3px_0px]'
    )}>
      <div
        className={clsx(
          'cursor-pointer border-b flex px-4 pb-3',
          'transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
          expanded ? 'h-14 pt-5' : 'h-12 pt-3'
        )}
        onClick={() => {
          setExpanded(isExpanded => !isExpanded);
        }}
      >
        <GoChevronDown className={clsx(
          'self-start m-1',
          'transition-[transform] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
          expanded ? 'rotate-z-180' : ''
        )} />
        <div className="flex-1 text-left">{header}</div>
      </div>
      <div className={clsx(
        'overflow-hidden',
        'transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]',
        expanded ? 'h-auto' : 'h-0'
      )}>
        <div
          className={clsx(
            'box-content px-4 pt-2 pb-4 ',
          )}>
            <div>
              {children}
            </div>
        </div>
      </div>
    </section>
  );
};
