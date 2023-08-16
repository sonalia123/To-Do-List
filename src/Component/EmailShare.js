import React from 'react';

const EmailShare = ({ task }) => {
  const handleShareEmail = () => {
    const subject = encodeURIComponent('Task Reminder');
    const body = encodeURIComponent(
      `Task: ${task.task}\nDate: ${task.date}\nTime: ${task.time}\n`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="EmailShare">
      <button onClick={handleShareEmail}>
        <i className="Envelope" aria-hidden="true"></i>
        Share Email
      </button>
    </div>
  );
};

export default EmailShare;