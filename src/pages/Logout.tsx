import { FC, use, useEffect } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/common';

const Logout: FC = () => {
  const { logout } = use(UserContext);

  useEffect(() => {
    logout();
  }, []);

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <div>Logged out</div>
      <div className="flex p-3 gap-3">
        <Button>
          {/* need to offset the padding from the parent button
          so link encompasses wthe whole */}
          <Link className="-mx-3 -my-[6px] px-3 py-[6px] flex " to="/">
            Go back to home
          </Link>
        </Button>
        <Button>
          <Link to="/login">Sign back in</Link>
        </Button>
      </div>
    </div>
  );
};

export default Logout;
