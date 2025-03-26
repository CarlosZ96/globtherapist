import React from 'react';
import { Route, Routes } from 'react-router-dom';
import GlobMeeting from './Components/Meetings/GlobMeeting ';
import './App.css';
import Mainpage from './Components/Homepage';
import EmailPreview from './Components/EmailPreview';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Mainpage />} />
        <Route path="/meeting" element={<GlobMeeting />} />
        <Route path="/Admin" element={<EmailPreview userName="CaredTest" />} />
      </Routes>
    </div>
  );
}

export default App;
