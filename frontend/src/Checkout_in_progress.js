import { React, useRef, useEffect } from 'react';
import { AdyenCheckout, Dropin, Card, Klarna, PayPal, GooglePay, ApplePay, Ach, Fastlane } from '@adyen/adyen-web';

const apiUrl = 'http://localhost:3001'
const clientKey = 'test_EUPVEDV3JVDUTF6DOQE5LZF5LM73PGKI'

function Checkout({ cartItems, onBack }) {

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const adyenTotal = total*100 
  const dropinRef = useRef(null)

  //START OF ADYEN API REQUESTS

  //FIRST: get payment menthods
  const getPaymentMethods = async () =>{
    try {
      console.log('trying payment methods endpoint')
      const response = await fetch(`${apiUrl}/api/paymentmethods`,{
        method : 'POST',
        headers : {
                  'Content-Type' : 'application/json'
              }
      });
      if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
            }
      const paymentData = await response.json()
      console.log('payment methods data is:', paymentData)
      return paymentData;
    } catch (error) {
      console.error(error)
    }
  }

  getPaymentMethods();

  const config = {
    paymentMethodsResponse : paymentData,
    clientKey : clientKey,
    locale : 'en-US',
    countryCode : 'US',
    enironment : 'TEST',
    amount : {
      value : adyenTotal,
      currency : 'USD'
    },
    onsubmit : async (state, components,actions) =>{
      try {
        const result = await getPaymentMethods(state.data, countryCode, locale, amount);
        if(!result.resultCode){
          actions.reject();
          return;
        }
        const {
          resultCode,
          action,
          order,
          donationToken
        } = result;

        actions.resolve({
          resultCode,
          action,
          order,
          donationToken
        });

      } catch (error) {
        console.error("onSubmit",error);
        actions.reject()
      }
    },
    onAdditionalDetails: async( state, components, actions) => {
      try {
        const result = await makeDetailsCall(state.data);
        if(!result.resultCode){
          actions.reject();
          return;
        }
        const {
          resultCode,
          action,
          order,
          donationToken
        } = result;

        actions.resolve({
          resultCode,
          action,
          order,
          donationToken
        });
      } catch (error) {
        console.error("onSubmit", error);
    actions.reject();
      }
    },
    onPaymentCompleted: (result, component) => {
    console.info(result, component);
    },
    onPaymentFailed: (result, component) => {
      console.info(result, component);
    },
    onError: (error, component) => {
      console.error(error.name, error.message, error.stack, component);
    }
  };

  console.log("config is:",config)

  //create and mount dropin container using above objects
  
  const checkout =  AdyenCheckout(config);

  const drop = new Dropin(checkout,config).mount('#dropin-container');

  };
      
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


export default Checkout; 