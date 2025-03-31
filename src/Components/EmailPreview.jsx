import React from 'react';
import { getSuccessEmailHtml } from './mails/emailTemplate';

const EmailPreview = () => {
  const terapias = ['fisica', 'lenguaje', 'mental'];
  const emailHtml = getSuccessEmailHtml(terapias);

  return (
    <div
      style={{
        minHeight: 600,
        maxWidth: 800,
        margin: '0 auto',
        backgroundColor: '#F2F5FC',
        padding: '20px',
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
    </div>
  );
};

export default EmailPreview;
