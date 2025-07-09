import clsx from 'clsx';
import { HTMLAttributes, ReactNode, useEffect, useState } from 'react';
import { GoChevronDown } from 'react-icons/go';

interface AccordionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  header: ReactNode;
  badge?: number | null | string;
  badgeColor?: 'green' | 'red' | 'gray';
  open?: boolean; 
  onToggle?: () => void; 
}


export const Accordion = (accProps: AccordionProps) => {
  const {
    children,
    className,
    header,
    badge,
    badgeColor = 'gray',
    open,
  } = accProps;

  const [expanded, setExpanded] = useState<boolean>(!!open);

  // Sync internal state if "open" is passed (controlled mode)
  useEffect(() => {
    if (typeof open === 'boolean') {
      setExpanded(open);
    }
  }, [open]);

const handleToggle = () => {
  if (typeof open === 'boolean') {
    // controlled: tell parent to toggle
    if (accProps.onToggle) accProps.onToggle();
  } else {
    // uncontrolled: manage internal state
    setExpanded((prev) => !prev);
  }
};


  return (
    <section
      className={clsx(
        className,
        'border rounded-sm',
        '[interpolate-size:allow-keywords]',
        'shadow-[rgba(0,0,0,0.2)_0px_2px_1px_-1px,rgba(0,0,0,0.14)_0px_1px_1px_0px,rgba(0,0,0,0.12)_0px_1px_3px_0px]'
      )}
    >
      <div
        className={clsx(
          'cursor-pointer border-b flex items-center px-4 pb-3',
          'transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
          expanded ? 'h-14 pt-5' : 'h-12 pt-3'
        )}
        onClick={handleToggle}
      >
        <GoChevronDown
          className={clsx(
            'self-start m-1',
            'transition-[transform] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
            expanded && 'rotate-180'
          )}
        />
        <div className="flex-1 text-left break-words flex justify-between items-center ">
          <span className="w-full">{header}</span>
          {badge && (
            <span
              className={clsx(
                'text-xs font-semibold ml-3 px-2 py-0.5 rounded-full',
                badgeColor === 'red' && 'bg-[#faeaea] text-red-600',
                badgeColor === 'green' && 'bg-[#e6f6e9] text-green-100',
                badgeColor === 'gray' && 'bg-gray-100 text-gray-700'
              )}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      <div
        className={clsx(
          'overflow-hidden',
          'transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]',
          expanded ? 'h-auto' : 'h-0'
        )}
      >
        <div className="box-content px-4 pt-2 pb-4">
          <div>{children}</div>
        </div>
      </div>
    </section>
  );
};
 