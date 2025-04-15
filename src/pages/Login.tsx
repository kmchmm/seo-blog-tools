import { FC, use, useEffect, useState } from 'react';
import clsx from 'clsx';
import { Loading } from '../components/Loading';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const ARASH_AUTH_URL = 'https://arashlaw.ph/wp-json/ak/v1/auth';

const loadingStyle = '[&>*]:h-7 [&>*]:w-7';
const disabledInput = 'disabled:cursor-default disabled:opacity-50';

const Login: FC = () => {
  const { userData, setUserData } = use(UserContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const handleHomeClick = (event: React.MouseEvent<HTMLHeadingElement>) => {
    // if has data-href, hide menu then navigate
    const dataHref = (event.target as HTMLLabelElement).getAttribute('data-href');
    if (dataHref) {
      navigate(dataHref);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsError(false);
    setIsLoading(true);
    e.preventDefault();
    try {
      const url = ARASH_AUTH_URL;
      const options = {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const userJSON = await response.json();
      // modify types of certain properties
      userJSON.id = Number(userJSON.id);
      userJSON.profilegrid_id = Number(userJSON.profilegrid_id);
      userJSON.active = userJSON.active === '1';
      setUserData(userJSON);
    } catch (err) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData.id) navigate('/');
  }, [userData]);

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center h-lvh w-full',
        'bg-black-200'
      )}>
      <h1
        className={clsx(
          '[-webkit-text-stroke-width:.3px]',
          '[-webkit-text-stroke-color:theme(color-yellow-100)]',
          'text-blue-600 text-center text-[80px] text-8xl cursor-pointer'
        )}
        data-href="/"
        tabIndex={0}
        role="link"
        onClick={handleHomeClick}>
        AK RAKET
      </h1>
      <p className="text-yellow-100">Tools you didn't know you need</p>
      <form
        className={clsx('flex flex-col gap-2 mt-1 items-center')}
        onSubmit={handleSubmit}>
        <input
          className={clsx(
            '!bg-blue-600 !text-yellow-100 !border-yellow-100 !my-1',
            'focus:shadow-[0_0_0_4px_theme(color-blue-800/.40)]',
            disabledInput
          )}
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          disabled={isLoading}
          onKeyDown={() => setIsError(false)}
        />
        <input
          className={clsx(
            '!bg-blue-600 !text-yellow-100 !border-yellow-100 !my-1',
            'focus:shadow-[0_0_0_4px_theme(color-blue-800/.40)]',
            disabledInput
          )}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          disabled={isLoading}
          onKeyDown={() => setIsError(false)}
        />
        <button
          type="submit"
          className={clsx(
            'cursor-pointer h-12 w-30 rounded-md',
            'border-yellow-100 border text-blue-600 bg-gray-100',
            'shadow-[inset_0_0_5px_theme(color-blue-600),inset_0_1px_8px_theme(color-blue-600)]',
            loadingStyle
          )}>
          {isLoading ? <Loading /> : 'Login'}
        </button>
      </form>

      {isError && (
        <div
          className={clsx(
            'bg-red-200 text-white-100  rounded-md p-4 m-2',
            'border border-shadow-200/17'
          )}>
          Invalid credentials
        </div>
      )}
    </div>
  );
};

export default Login;
