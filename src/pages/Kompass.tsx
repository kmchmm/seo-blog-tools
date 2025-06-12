import { FC, KeyboardEvent, useState } from 'react';
import clsx from 'clsx';

import { Button } from '../components/common';
import { Keyword } from '../components/Keyword';
import Info from '../assets/icons/info.svg?react';

const Kompass: FC = () => {
  const [keywordValue, setKeywordValue] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleAddKeyword = () => {
    // check if already added
    const newKeywords = [...keywords];
    if (!newKeywords.includes(keywordValue)) {
      newKeywords.push(keywordValue);
      setKeywords(newKeywords);
      setKeywordValue('');
    }
  };

  const onRemove = (keyword: string) => {
    const newKeywords = [...keywords];
    const indexRemove = newKeywords.indexOf(keyword);
    if (indexRemove > -1) {
      newKeywords.splice(indexRemove, 1);
      setKeywords(newKeywords);
    }
  };

  const inputKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAddKeyword();
    }
  };

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Text Kompasss</h1>
      <p className="text-left italic self-start">An app to compare contents</p>

      <section className="w-full my-6 p-2">
        <div>
          <label className="font-bold align-middle mr-1">KEYWORDS</label>
          <Info className="inline-block align-middle w-4 peer" />
          <span
            className={clsx(
              'bg-gray-500 text-white absolute z-50 rounded-sm pointer-events-none',
              'py-2 px-3 font-medium text-xs opacity-0 peer-hover:opacity-100',
              'origin-[center_top] transform-[translate(-90px,30px)]',
              'transition-[opacity,transform] duration-[200ms,133ms]'
            )}>
            Press Enter to add keyword
          </span>
        </div>
        <div>
          <input
            type="text"
            className="!my-0 !mr-6"
            value={keywordValue}
            onKeyDown={inputKeyDown}
            onChange={e => setKeywordValue(e.target.value)}
          />
          <Button>Compare & Analyze</Button>
          <div className="py-2 flex gap-2">
            {keywords.map(keyword => (
              <Keyword key={keyword} keyword={keyword} onRemove={onRemove} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Kompass;
