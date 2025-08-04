import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';

const { VITE_SECRET_EMAIL } = import.meta.env;

const VersionSection = () => {
  const { userData } = useAuth();
  const { email } = userData || {};
  const navigate = useNavigate();

  return (
    <div className="flex gap-x-4">
      {email.toLocaleLowerCase() === VITE_SECRET_EMAIL && (
        <button
          onClick={() => navigate('/publishing/ai-assistant/system-prompts')}
          className="underline hover:text-blue-400 cursor-pointer">
          Prompts
        </button>
      )}
      <p>Beta v2.1.0</p>
    </div>
  );
};

export default VersionSection;
