import { FC, useState } from 'react';
import clsx from 'clsx';

import { Button } from '../components/common';
import { Modal } from '../components/Modal';

import StatsIcon from '../assets/icons/stats-icon.svg?react';

const Hunter: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // State to track modal visibility

  const handleOpenModal = () => {
    setIsModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  return (
    <div
      className={clsx('flex flex-col w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Hunter</h1>
      <h6 className="italic !text-left mt-2">AK Internal Linking Tool.</h6>
      <Button
        onClick={handleOpenModal}
        className="mt-5 w-[150px] !bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 hover:text-white-100 dark:hover:!text-black-200 hover:!shadow-none !py-3 !px-5">
        Open Modal
      </Button>{' '}
      {/* Button that opens the modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          width="900px"
          height="auto"
          backgroundColor="#0a1a31"
          showCloseButton={false}>
          <div className="relative h-full w-full">
            <h2 className="!text-left text-2xl font-bold">New Link</h2>
            <hr className="border-t border-yellow-400 mt-4" />
            <div className="mt-2">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Keyword/Keyphrase"
                  className="!p-2 !w-1/2"
                />
                <span className="!w-1/2">The word or phrase to look for.</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="text" placeholder="URL" className="!p-2 !w-1/2" />
                <span className="!w-1/2">The destination URL.</span>
              </div>
              <div className="flex gap-2 mt-4 items-center">
                <input type="checkbox" id="caseSensitive" className="cursor-pointer" />
                <label htmlFor="caseSensitive" className="cursor-pointer">
                  Case Sensitive?
                </label>
              </div>
            </div>
            <hr className="border-t border-yellow-400 mt-4" />
            <div>
              <h3 className="!text-left text-lg font-bold mt-4">Optional Settings</h3>
              <div mt-2>
                <div className="flex items-center gap-3">
                  <input type="number" defaultValue={1} className="!p-2 !w-1/2" />
                  <span className="!w-1/2">Priority</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" defaultValue={0} className="!p-2 !w-1/2" />
                  <span className="!w-1/2">
                    How often should the link appear on a page? Choose -1 for unlimited
                    links.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <select className="!w-1/2 cursor-pointer">
                    <option value="">Open in the same Tab</option>
                    <option value="">Open in New Tab</option>
                  </select>
                  <span className="!w-1/2">The behaviour of the link when clicked.</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center py-3">
                <div className="flex !items-center !w-1/2 gap-3">
                  <input
                    type="checkbox"
                    id="partialReplacement"
                    className="cursor-pointer"
                  />
                  <label htmlFor="partialReplacement" className="cursor-pointer">
                    Partial Replacement?
                  </label>
                </div>
                <span className="!w-1/2">
                  Allow partial replacement of words. (e.g. success in successful)
                </span>
              </div>
              <div className="flex items-center py-3">
                <div className="flex !items-center !w-1/2 gap-3">
                  <input type="checkbox" id="lookPost" className="cursor-pointer" />
                  <label htmlFor="lookPost" className="cursor-pointer">
                    Look in Post?
                  </label>
                </div>
                <span className="!w-1/2">To Look in Posts.</span>
              </div>
              <div className="flex items-center py-3">
                <div className="flex !items-center !w-1/2 gap-3 ">
                  <input type="checkbox" id="lookPages" className="cursor-pointer" />
                  <label htmlFor="lookPages" className="cursor-pointer">
                    Look in Pages?
                  </label>
                </div>
                <span className="!w-1/2">To Look in Pages.</span>
              </div>
            </div>
            <hr className="border-t border-yellow-400 mt-4 pb-20" />
            <div className="flex gap-4 absolute bottom-0 right-0">
              <button className="border border-blue-400 cursor-pointer py-2 px-7 bg-blue-400 hover:bg-blue-950 text-white hover:border-blue-800">
                Save
              </button>
              <button
                onClick={handleCloseModal}
                className="border border-white cursor-pointer py-2 px-7 hover:bg-red-100 hover:border-red-100">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
      <div className="paa-table-container m-0 p-0 w-full">
        <table
          className={clsx(
            'w-full my-[20px] mx-auto border-collapse',
            'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
          )}>
          <thead>
            <tr>
              <th className="w-1/4 border border-black-200 dark:border-amber-200">
                Keyword
              </th>
              <th className="w-1/2 border border-black-200 dark:border-amber-200">
                Link/Url
              </th>
              <th className="w-1/4 border border-black-200 dark:border-amber-200">
                Last Update
              </th>
              <th className="w-[150px] border border-black-200 dark:border-amber-200 !text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black-200 dark:border-amber-200"></td>
              <td className="border border-black-200 dark:border-amber-200"></td>
              <td className="border border-black-200 dark:border-amber-200"></td>
              <td className="border border-black-200 dark:border-amber-200 !text-center">
                <Button className="p-2 !bg-transparent border !border-transparent hover:!border-black-200 dark:hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:shadow-none">
                  <StatsIcon className="w-6 h-6 text-black-200 dark:text-white" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Hunter;
