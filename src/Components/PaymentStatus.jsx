import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StatusScreen } from '@mercadopago/sdk-react';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    if (!paymentId) {
      navigate('/');
    }
  }, [paymentId, navigate]);

  return (
    <div className="payment-status-container">
      {paymentId && (
        <StatusScreen
          initialization={{ paymentId }}
          customization={{
            visual: {
              style: {
                theme: 'dark',
                customVariables: {
                  formBackgroundColor: '#212B42',
                  baseColor: '#4F63C2',
                },
              },
            },
          }}
          onReady={() => console.log('Status Screen ready')}
          onError={(error) => console.error('Status Screen error:', error)}
        />
      )}
    </div>
  );
};

export default PaymentStatus;
