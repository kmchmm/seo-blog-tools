import { Modal } from '../Modal';
import { BINI_FAQ } from './constants';

type Props = {
  open: boolean;
  onClose: () => void;
};

const FAQModal = ({ open, onClose }: Props) => {
  return (
    <Modal isOpen={open} onClose={onClose} height="800px" width="800px">
      <div className="flex flex-col">
        <div className="uppercase text-2xl font-semibold">FAQ</div>
        <div className="space-y-6">
          {BINI_FAQ.map(faq => (
            <div key={faq.question} className="mb-4">
              <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
              {faq.answer.map((block, bIdx) =>
                block.type === 'paragraph' ? (
                  <p key={bIdx} className="mb-2">
                    {block.content[0]}
                  </p>
                ) : (
                  <ul key={bIdx} className="list-disc ml-6 mb-2">
                    {block.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default FAQModal;
