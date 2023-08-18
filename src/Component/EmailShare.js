import React from 'react';

// EmailShare component accepts a 'task' prop containing task details
const EmailShare = ({ task }) => {
  // handleShareEmail function is called when the "Share Via Email" button is clicked
  const handleShareEmail = () => {
    // Encode the subject and body of the email
    const subject = encodeURIComponent('Task Reminder');
    const body = encodeURIComponent(
      `Task: ${task.task}\nDate: ${task.date}\nTime: ${task.time}\n`
    );

    // Construct the mailto link and redirect the user to the default email client
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Render the EmailShare component
  return (
    <div className="EmailShare">
      <button onClick={handleShareEmail}>
        <i className="Envelope" aria-hidden="true"></i>
        Share Via Email
      </button>
    </div>
  );
};

export default EmailShare;