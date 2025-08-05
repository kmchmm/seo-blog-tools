import { useState } from 'react';

function useFocusKeywordFormValidate() {
  const [error, setError] = useState<boolean>(false);
  const [helperText, setHelperText] = useState<string | null>(null);

  const resetError = () => {
    setError(false);
    setHelperText(null);
  };

  const validate = (focusKeyword: string): boolean => {
    const trimmed = focusKeyword.trim();
    if (!trimmed) {
      setError(true);
      setHelperText('Focus keyword is required');
      return false;
    }

    if (trimmed.length < 5) {
      setError(true);
      setHelperText('Keyword is too short, enter at least five (5) characters.');
      return false;
    }

    return true;
  };

  return {
    error,
    helperText,
    validate,
    resetError,
  };
}
export default useFocusKeywordFormValidate;
