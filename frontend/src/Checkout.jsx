import { React, useRef, useEffect } from 'react';
import { AdyenCheckout, Dropin, Card, Klarna, PayPal, GooglePay, ApplePay, Ach, Fastlane } from '@adyen/adyen-web';


function Checkout({ cartItems, onBack }) {

  const apiUrl = 'http://localhost:3001'
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const adyenTotal = total*100

  //useRef for creating empty div for mounting drop in
  const dropinRef = useRef(null)

  //function to create session, ount drop in
  const getSession = async () => {

    let data, adyenGlobalConfig;
    const sessionRequestData = {
        amount: {
            value : adyenTotal,
            currency : 'USD'
        },
        returnUrl : 'http://localhost:3000'
    };
    
    try {
        const response = await fetch (`${apiUrl}/api/session`, {
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify(sessionRequestData)
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
            }
        data = await response.json()
        if(data){
          console.log(` Session created succesfully! \n\n {\n    id : ${data.id},\n    sessionData : ${data.sessionData}\n}`)
        }
        
    } catch (error) {
        console.error('Error is: ',error)
    };

    //all config objects for dropin
    /*
    const cardConfiguration = {
        hasHolderName: true, // Show the cardholder name field.
        holderNameRequired: true, // Mark the cardholder name field as required.
        billingAddressRequired: true // Show the billing address input fields and mark them as required.
        };
*/
    const dropinConfiguration = {
        // Required if you import individual payment methods.
        paymentMethodComponents: [Card, GooglePay, PayPal, ApplePay, Klarna, Ach],
        openFirstPaymentMethod : true,
        showPaymentMethods : true,

        onReady: () => {},
        instantPaymentTypes: ['applepay', 'googlepay']
        };

        adyenGlobalConfig = {
            session : {
                id : data.id,
                sessionData : data.sessionData
            },
            amount : sessionRequestData.amount,
            environment : 'TEST',
            countryCode : 'US',
            locale : 'en-US',
            clientKey : data.clientKey,
          //event handlers for payment responses
            onPaymentCompleted: (result, component) => {
              //alert(`Payment completed successfully with code ${result.resultCode}`)
                console.info(result, component);
            },
            onPaymentFailed: (result, component) => {
              console.log(`Payment failed with code ${result.resultCode}`)
                console.info(result, component);
            },
            onError: (error, component) => {
                console.error(error.name, error.message, error.stack, component);
            }
        };

        //create and mount dropin container using above objects
        const checkout = await AdyenCheckout(adyenGlobalConfig);
        const drop = new Dropin(checkout,dropinConfiguration).mount('#dropin-container');
    };

    getSession();
     
  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {cartItems.map((item) => (
          <li key={item.id} style={{ marginBottom: '1rem' }}>
            <strong>{item.name}</strong> x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
          </li>
        ))}
      </ul>
      <div className="cart-total">
        <strong>Total: ${total.toFixed(2)}</strong>
      </div>
      <div style={{ margin: '2rem 0' }}>
        <div ref={dropinRef} id={'dropin-container'}></div>
      </div>
      <button onClick={onBack}>Back to Shop</button>
    </div>
  );
}

export default Checkout; 