import { ChangeEvent, FC, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { Button } from '../components/Button';

enum ILexiTweakMode {
  SENTENCE = 'sentence',
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
}

const tweak = (text: string, mode: ILexiTweakMode) => {
  if (mode === ILexiTweakMode.SENTENCE) {
    const textArr = text.toLowerCase().split(' ');
    //capitalize first letter of fragment/word
    return textArr
      .map(fragment => {
        return fragment.charAt(0).toUpperCase() + String(fragment).slice(1);
      })
      .join(' ');
  }

  if (mode === ILexiTweakMode.UPPERCASE) {
    return text.toUpperCase();
  }

  if (mode === ILexiTweakMode.LOWERCASE) {
    return text.toLowerCase();
  }

  return text;
};

const copyToClipboard = async (copyText: string) => {
  try {
    navigator.clipboard.writeText(copyText);
  } catch (e) {
    console.log(e);
  }
};

const TitleTweak: FC = () => {
  const [mode, setMode] = useState<ILexiTweakMode>(ILexiTweakMode.SENTENCE);
  const [tweaked, setTweaked] = useState<string>('');
  const textAreaInput = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (event: ChangeEvent) => {
      const baseText = (event.target as HTMLTextAreaElement).value;
      const tweakedText = tweak(baseText, mode);
      copyToClipboard(tweakedText);
      setTweaked(tweakedText);
    },
    [mode]
  );

  useEffect(() => {
    const baseText = textAreaInput.current?.value || '';
    const tweakedText = tweak(baseText, mode);
    copyToClipboard(tweakedText);
    setTweaked(tweakedText);
  }, [mode]);

  return (
    <div
      className={clsx('flex flex-col w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK LexiTweak</h1>
      <p className="text-left italic">You know what it is...</p>
      <section className=" mt-4 rounded-md border border-shadow-200/17 h-37 p-4">
        <p className="font-bold">Update Notes: v.2.0.0</p>
        <ol className="pl-8 [&>li]:list-decimal">
          <li>Auto copy upon paste/changing case</li>
          <li>UPPERCASE</li>
          <li>lowercase</li>
        </ol>
      </section>
      <section className="flex flex-row mt-12">
        <div className="flex flex-1 flex-col gap-2 p-2">
          <textarea
            className={clsx(
              'px-3 py-2 text-lg bg-white',
              'rounded-md border border-gray-300 min-h-12',
              'transition-[border-color,box-shadow] duration-[150ms,150ms]',
              'ease-[ease-in-out,ease-in-out] outline-0',
              'focus:border-blue-900 focus:shadow-[0_0_0_.25rem_#0d6efd40]'
            )}
            rows={8}
            placeholder="Input text here"
            onChange={handleChange}
            ref={textAreaInput}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          <textarea
            className={clsx(
              'px-3 py-2 text-lg bg-gray-400',
              'rounded-md border border-gray-300 min-h-12'
            )}
            value={tweaked}
            rows={8}
            disabled
          />
          <div className="flex flex-row gap-2">
            <Button onClick={() => setMode(ILexiTweakMode.SENTENCE)}>Sentence</Button>
            <Button onClick={() => setMode(ILexiTweakMode.UPPERCASE)}>UPPERCASE</Button>
            <Button onClick={() => setMode(ILexiTweakMode.LOWERCASE)}>lowercase</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TitleTweak;
