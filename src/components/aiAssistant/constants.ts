export const steps = {
  batchAnalysis: [
    { id: 1, step: 'Use a Google Sheet to list all your content inventory.' },
    {
      id: 2,
      step: 'Make sure your content is saved in AK’s designated Google Drive folder.',
    },
    { id: 3, step: 'Paste the sheet’s URL into BINI and select the correct tab.' },
    {
      id: 4,
      step: 'Run the tool. BINI will:',
      listItem: [
        'Automatically identify which docs still need review.',
        'Estimate how long the batch will take.',
        'Run in the background so your team can keep working.',
      ],
    },
    {
      id: 5,
      step: 'After completion, reports are saved in a private Google Drive folder.',
    },
  ],
  singleAnalysis: [
    {
      id: 1,
      step: 'Create a Google document for checking. Make sure your content is saved in AK’s designated Google Drive folder.',
    },
    {
      id: 2,
      step: 'Paste your document URL into BINI.',
    },
    {
      id: 3,
      step: 'Run the tool. BINI will:',
      listItem: [
        'Display results directly in the tool window.',
        'Offer the option to automatically generate a Google Docs report for easy sharing.',
        'Save the report to your AK Google Drive.',
      ],
    },
  ],
};

export const BINI_FAQ = [
  {
    question: 'How Does BINI Review The Documents?',
    answer: [
      {
        type: 'paragraph',
        content: [
          'BINI is built on GPT-4.1 and continues learning as compliance standards evolve, helping you stay compliant over time. This tool is trained to:',
        ],
      },
      {
        type: 'list',
        content: [
          'Detect risky language or legal claims',
          'Flag non-compliant phrases',
          'Provide clear explanations and legal references',
          'Suggest revision guidance for each issue',
        ],
      },
    ],
  },
  {
    question: 'What Laws And Rules Does The Tool Check For?',
    answer: [
      {
        type: 'paragraph',
        content: [
          'BINI uses a custom legal writing library to stay current with evolving compliance standards. It references:',
        ],
      },
      {
        type: 'list',
        content: [
          'California Senate Bill 37 (SB 37)',
          'California State Bar Act (Business & Professions Code)',
          'California Rules of Professional Conduct (7.1–7.3)',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'It also checks for “red-flag” verbiage, including but not limited to:',
        ],
      },
      {
        type: 'list',
        content: [
          'Superlatives: “best,” “top,” “most trusted”',
          'Guarantees: “We will get you justice;” “You will be compensated.”',
          'Verdicts/settlements with dollar amounts',
          'Comparative statements between firms',
          'Undisclosed or misleading fee structures',
          'Usage of terms like “expert” or “specialists”',
          'Testimonials and emotional appeals',
        ],
      },
      {
        type: 'paragraph',
        content: ['BINI does not check for grammar issues.'],
      },
    ],
  },
  {
    question: 'What Language Does BINI Support?',
    answer: [
      {
        type: 'paragraph',
        content: [
          'BINI works with both English and Spanish content. It is trained using a custom legal writing library to ensure relevance and accuracy.',
        ],
      },
    ],
  },
  {
    question: 'Can Multiple People Use BINI At The Same Time?',
    answer: [
      {
        type: 'paragraph',
        content: [
          'Yes. BINI supports parallel processing, allowing multiple users or batches to run simultaneously.',
        ],
      },
    ],
  },
  {
    question: 'How Do I Review Results?',
    answer: [
      {
        type: 'paragraph',
        content: [
          'After a review is completed, BINI automatically creates a report and saves it to a private folder in AK’s Google Drive, ensuring privacy and security.',
        ],
      },
      {
        type: 'paragraph',
        content: ['Each report:'],
      },
      {
        type: 'list',
        content: [
          'Organizes issues by content section.',
          'Highlights the exact phrases that triggered flags.',
          'Explains each issue in plain English, with legal references and fix suggestions.',
          'Is ready to share with writers, editors, or QA for quick follow-up and revisions.',
        ],
      },
    ],
  },
];
