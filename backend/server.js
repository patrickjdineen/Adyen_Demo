const express = require('express');
const cors = require('cors');
const env = require('dotenv').config( {path: '../.env'});
const { v4: uuidv4 } = require('uuid');
const products = require('./products');
const { Client, CheckoutAPI} = require("@adyen/api-library");

const app = express();

// Enhanced CORS configuration for Codespaces
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json())

createId = () =>{
  return uuidv4();
}

// Set up the client and service.
const client = new Client({
        apiKey: process.env.ADYEN_API_KEY,
        environment: process.env.ENVIRONMENT
    });
const checkoutApi = new CheckoutAPI(client);

//adyen route
app.post('/api/session', async (req, res) => {
	try {
        //destructure params from the front-end
        const {
            amount,
            returnUrl,
        } = req.body

        const checkoutSessionData = {
            merchantAccount: process.env.MERCHANT_ACCOUNT,
            amount: amount,
            returnUrl: returnUrl || 'https://google.com',
            reference: createId(),
            shopperReference : "pjdtoken3",
            captureDelayHours : 3,
            allowedPaymentMethods : ["card"],
            enableOneClick : true,
            enableRecurring : true,
            showInstallmentAmount: true
          };

        const response =  await checkoutApi.PaymentsApi.sessions(checkoutSessionData);
        response.clientKey = process.env.CLIENT_KEY
        //console.log(response)
        res.status(201).json(response)
    } catch (error) {
        console.error(error)
    }
});

app.post(`/sessions/:id`, async (req, res) => {
  try {
    const id = req.params.id;
    const sessionResult = req.query.sessionResult;
    const response = await checkoutApi.PaymentsApi.getResultOfPaymentSession(id, sessionResult);
    //console.log(response)
    res.status(201).json(response)
  } catch (error) {
    console.error(error)
  }
});

//getPayment Details
app.post('/api/paymentmethods', async(req,res)=>{
  try {
    console.log('request submitted to paymentmethods')
    const paymentMethodRequest = {
      merchantAccount: process.env.MERCHANT_ACCOUNT
    }

    const response =  await checkoutApi.PaymentsApi.paymentMethods(paymentMethodRequest);
    console.log(response)
    res.status(201).json(response)

  } catch (error) {
    console.error(error)
  }
});

app.post('/api/payment', async(req, res) =>{
  try {
    const {
      amount,
      paymentMethod

    }= req.body

    const paymentRequest = {
      amount : amount,
      reference : createId(),
      merchantAccount: process.env.MERCHANT_ACCOUNT,
      returnUrl : 'http://google.com',
      paymentMethod :paymentMethod
      /*
      paymentMethod: {
        type: "scheme",
        encryptedCardNumber: "test_4111111111111111",
        encryptedExpiryMonth: "test_03",
        encryptedExpiryYear: "test_2030",
        encryptedSecurityCode: "test_737"
      }
        */
    }

    const response = await checkoutApi.PaymentsApi.payments(paymentRequest);
    console.log('payments response is:',response)
    res.status(201).json(response)
    
  } catch (error) {
    console.error(error)
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

//route for filling product data
app.get('/api/products', (req, res) => {
  res.json(products);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Server accessible from external connections on port ${PORT}`);
}); 