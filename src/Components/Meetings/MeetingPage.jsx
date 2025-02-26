import React from 'react';
import { useLocation } from 'react-router-dom';
import GlobMeeting from './GlobMeeting ';

const MeetingPage = () => {
  const { state } = useLocation();
  const { cita, collection } = state || {};

  if (!cita || !collection) {
    return <div>Error: no se han proporcionado datos de la cita.</div>;
  }

  return <GlobMeeting collection={collection} cita={cita} />;
};

export default MeetingPage;
