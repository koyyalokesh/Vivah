const questions = [
  {
    question: 'What is Vivah?',
    answer:
      'Vivah is one shared wedding workspace for events, tasks, guests, invitations, expenses, vendors, a wedding website and private memories.',
  },
  {
    question: 'Who can help manage a wedding?',
    answer:
      'Admins can invite trusted people as Admins or Managers. Both roles can help plan the wedding, while only Admins can manage wedding membership.',
  },
  {
    question: 'Do guests need an account?',
    answer:
      'No. Guests use private links to view the events they are invited to, submit an RSVP and access a shared gallery when enabled.',
  },
  {
    question: 'Can Vivah manage several wedding ceremonies?',
    answer:
      'Yes. You can create ceremonies such as Mehendi, Haldi, Sangeet, Wedding and Reception, or add your own custom events.',
  },
  {
    question: 'Does Vivah include wedding budgeting?',
    answer:
      'Vivah V1 records actual or committed expenses and their categories. Budget limits, allocations and payment schedules are not part of V1.',
  },
  {
    question: 'How does photo sharing work?',
    answer:
      'Wedding members can share a private gallery link or QR code. Guests can view and contribute photos without creating an account.',
  },
];

export function Faq() {
  return (
    <div className="faq-list">
      {questions.map(({ question, answer }) => (
        <details key={question}>
          <summary>
            <span>{question}</span>
            <span className="faq-plus" aria-hidden="true" />
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}
