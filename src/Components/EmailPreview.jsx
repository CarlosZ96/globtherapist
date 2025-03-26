import React from 'react';
import PropTypes from 'prop-types';
import getEmailHtml from './mails/emailTemplate';

const EmailPreview = ({ userName }) => {
  // Genera el contenido HTML usando la misma plantilla
  const htmlContent = getEmailHtml(userName);
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

EmailPreview.propTypes = {
  userName: PropTypes.string.isRequired,
};

export default EmailPreview;
