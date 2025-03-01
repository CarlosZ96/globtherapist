import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import MydatesPro from './MydatesPro';
import UserInfo from './UserInfo';

const Dates = () => {
  const [userType, setUserType] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserType = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCitas(userDoc.data().Citas || []);
            setUserType('user');
            setLoading(false);
            return;
          }
          const proDoc = await getDoc(doc(db, 'pros', user.uid));
          if (proDoc.exists()) {
            setCitas(proDoc.data().MisCitas || []);
            setUserType('pro');
            setLoading(false);
            return;
          }

          setLoading(false);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setLoading(false);
        }
      }
    };

    fetchUserType();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (!userType) return <div>Usuario no encontrado</div>;

  return (
    <div>
      {userType === 'user' ? (
        <UserInfo citas={citas} />
      ) : (
        <MydatesPro citas={citas} />
      )}
    </div>
  );
};

export default Dates;
