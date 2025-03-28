import React from 'react';
import PropTypes from 'prop-types';
import { getValidationEmailHtml } from './mails/emailTemplate';

const EmailPreview = ({ userName }) => {
  const emailHtml = getValidationEmailHtml({
    userName,
    userEmail: 'ejemplo@globtherapist.com',
  });

  return (
    <div style={{
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

EmailPreview.propTypes = {
  userName: PropTypes.string.isRequired,
};

export default EmailPreview;
