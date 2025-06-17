import { FC } from 'react';
import clsx from 'clsx';

type SummaryProps = {
  totalWordCount: number | null;
  keywordCounts: number | null;
  keywordDensity: string | number | null;
  alternateEsqCount: number;
  headingsCount: number;
  internalLinksCount: number;
  externalLinksCount: number;
};

export const Summary: FC<SummaryProps> = ({
  totalWordCount,
  keywordCounts,
  keywordDensity,
  alternateEsqCount,
  headingsCount,
  internalLinksCount,
  externalLinksCount,
}) => {
  const Item = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="flex justify-between py-1 text-sm">
      <span className="font-medium">{label}</span>
      <span className="font-semibold">{value ?? '—'}</span>
    </div>
  );

  return (
    <section
      className={clsx(
        'p-4'
      )}>
      <div className="space-y-2">
        <Item label="Word Count" value={totalWordCount} />
        <Item label="Focus Keyphrase" value={keywordCounts || '—'} />
        <Item label="Keyword Density" value={keywordDensity} />
        <Item label="Alternate ESQ Count" value={alternateEsqCount} />
        <Item label="Headings" value={headingsCount} />
        <Item label="Internal Links" value={internalLinksCount} />
        <Item label="External Links" value={externalLinksCount} />
      </div>
    </section>
  );
};
