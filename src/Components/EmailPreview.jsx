import React from 'react';
import PropTypes from 'prop-types';
import WelcomeEmail from './mails/WelcomeEmail';

const EmailPreview = ({ userName }) => {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <WelcomeEmail userName={userName} collection="pros" />
    </div>
  );
};

EmailPreview.propTypes = {
  userName: PropTypes.string.isRequired,
};

export default EmailPreview;
