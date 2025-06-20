import React from 'react';

type DocPreviewProps = {
  docUrl: string;
  height?: string;
};

const getEmbedUrl = (url: string): string => {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return '';

  const docId = match[1];
  return `https://docs.google.com/document/d/${docId}/preview`;
};

const DocPreview: React.FC<DocPreviewProps> = ({ docUrl, height = '600px' }) => {
  const embedUrl = getEmbedUrl(docUrl);

  if (!embedUrl) {
    return <p className="text-red-500">Invalid Google Docs URL.</p>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <iframe
        src={embedUrl}
        title="Google Doc Preview"
        width="100%"
        height={height}
        allow="autoplay"
        className="border rounded-md shadow"
      />
    </div>
  );
};

export default DocPreview;
