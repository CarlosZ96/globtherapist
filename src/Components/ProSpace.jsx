/* eslint-disable no-unused-vars */
import React from 'react';
import { collection } from 'firebase/firestore';
import { db } from '../firebase';
import Calendar from './Calendar/CalendarWithToggle';
import ProData from './ProData';
import Hdv from './Hdv';
import '../stylesheets/prospace.css';

const ProSpace = () => {
  const usersCollection = collection(db, 'pros');
  return (
    <div className="prospace-cont">
      <Calendar collection="pros" />
      <ProData />
      <Hdv />
    </div>
  );
};

export default ProSpace;
