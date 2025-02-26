import React from 'react';
import { Route, Routes } from 'react-router-dom';
import GlobMeeting from './Components/Meetings/GlobMeeting ';
import './App.css';
import Mainpage from './Components/Homepage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Mainpage />} />
        <Route path="/meeting" element={<GlobMeeting />} />
      </Routes>
    </div>
  );
}

export default App;
