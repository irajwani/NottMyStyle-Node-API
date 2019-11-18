const request = require('request');
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Chatkit = require("@pusher/chatkit-server");
const engines = require('consolidate');
const paypal = require('paypal-rest-sdk');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const {google} = require('googleapis');
// const fs = require('fs');
// const path = require('path');
// const http = require('http');
// const url = require('url');
// const opn = require('open');
// const destroyer = require('server-destroy');

const {getProfile} = require('./routes/user');

const app = express();

const app_domain = "https://glacial-island-26545.herokuapp.com";
// const app_domain = "https://calm-coast-12842.herokuapp.com";
// const app_domain = "https://localhost:5000";

app.engine("ejs", engines.ejs);
// app.engine("hbs", engines.handlebars);
app.set("views", "./views");
app.set("view engine", "ejs");
app.use('/public', express.static('public'));
app.use('/img', express.static(__dirname + '/Images'));
const {credentials, firebaseAdminConfig, CHATKIT_INSTANCE_LOCATOR, CHATKIT_SECRET_KEY, gmailConfig, GoogleAuthorizationCode} = require('./keys');
admin.initializeApp(firebaseAdminConfig);

global.price = 1

global.create_payment_json = {
  "intent": "sale",
  "payer": {
      "payment_method": "paypal"
  },
  "redirect_urls": {
      "return_url": app_domain + "/success",
      "cancel_url": app_domain + "/cancel",
  },
  "transactions": [{
      "item_list": {
          "items": [{
              "name": "item",
              "sku": "item",
              "price": "1.00",
              "currency": "GBP",
              "quantity": 1
          }]
      },
      "amount": {
          "currency": "GBP",
          "total": "1.00"
      },
      "description": "Maybe fill item description or something here?"
  }]
};

global.execute_payment_json = {
  "payer_id": "",
  "transactions": [{
      "amount": {
          "currency": "GBP",
          "total": "1.00"
      }
    }]
};

// const firebaseDBHelloWorld = `${firebase.database().ref().once("value", (snap) => {console.log(snap.val())})}`;
// function onlyUnique(value, index, self) { 
//   return self.indexOf(value) === index;
// };
// a and b are javascript Date objects
function dateDiffInDaysGreaterThanThree(a, b) {
  if(a) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    var diff = Math.floor((utc2 - utc1) / 1000 * 60 * 60 * 24); //divide diff in milliseconds between dates by milliseconds per day

    if(diff>3) {
      return true
    } else {
      return false
    }
  }
  else {
    return false
  }
}

function removeFalsyValuesFrom(object) {
  const newObject = {};
  Object.keys(object).forEach((property) => {
    if (object[property]) {newObject[property] = object[property]}
  })
  return Object.keys(newObject);
}

const chatkit = new Chatkit.default({
  instanceLocator: CHATKIT_INSTANCE_LOCATOR,
  key: CHATKIT_SECRET_KEY
});



paypal.configure({
  // 'mode': 'sandbox', //sandbox or live
  mode: 'live',
  // mode: 'live',
  'client_id': credentials.live.client_id,
  'client_secret': credentials.live.client_secret
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// app.use((req, res) => {
//   res.writeHead(200);
//   res.end("hello world\n");
// })

// app.post('/payWithPaypal', (req, res) => {
//   // console.log(req.query);
//   res.send(req.query.payment + 'hi');
// })

// app.get('/test', (req, res) => {
//   res.send(req.query.payment);
// })

app.get('/paypal', (req, res) => {
  // console.log(req);
  // var {price} = req.query;
//   var create_payment_json = {
//     "intent": "sale",
//     "payer": {
//         "payment_method": "paypal"
//     },
//     "redirect_urls": {
//         "return_url": app_domain + "/success",
//         "cancel_url": app_domain + "/cancel",
//     },
//     "transactions": [{
//         "item_list": {
//             "items": [{
//                 "name": "item",
//                 "sku": "item",
//                 "price": price,
//                 "currency": "GBP",
//                 "quantity": 1
//             }]
//         },
//         "amount": {
//             "currency": "GBP",
//             "total": price
//         },
//         "description": "Maybe fill item description or something here?"
//     }]
// };


  paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          console.log("Create Payment Response");
          console.log(payment);
          // res.send('placeholder');
          res.redirect(payment.links[1].href)
      }
  });
})

let redirectUrl = app_domain;

const oauth2Client = new google.auth.OAuth2(
  gmailConfig.clientId,
  gmailConfig.clientSecret,
  redirectUrl,
);

google.options({auth: oauth2Client});

//TODO: requires refreshToken
// oauth2Client.getAccessToken().then(token => console.log(token))

//requires accessToken + refreshToken before it can be used
// google.oauth2('v1').tokeninfo()
// .then(info => console.log(info))

//////////////////////// GOOGLE sample/oauth2.js //////////
// async function authenticate() {
//   return new Promise((resolve, reject) => {
//     // grab the url that will be used for authorization
//     const authorizeUrl = oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: "https://mail.google.com/",
//     });
//     const server = http
//       .createServer(async (req, res) => {
//         try {
//           if (req.url.indexOf('/oauth2callback') > -1) {
//             const qs = new url.URL(req.url, `http://localhost:${process.env.PORT}`)
//               .searchParams;
//             res.end('Authentication successful! Please return to the console.');
//             server.destroy();
//             const {tokens} = await oauth2Client.getToken(qs.get('code'));
//             oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
//             resolve(oauth2Client);
//           }
//         } catch (e) {
//           reject(e);
//         }
//       })
//       .listen(process.env.PORT, () => {
//         // open the browser to the authorize url to start the workflow
//         opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
//       });
//     destroyer(server);
//   });
// }
// authenticate().then(client => console.log(client))
/////////////////////////////////////////////////////////////

const scope = "https://mail.google.com/";
const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',

  // If you only need one scope you can pass it as a string
  scope: scope,
  approval_prompt: ''
});
console.log(url);

request.get(url, (error, res, body) => {
  if (error) {
      console.log(error)
      return
  }
  console.log(`statusCode: ${res.statusCode}`)
  console.log(body)
  }
)

// oauth2Client.getToken(GoogleAuthorizationCode).then((tokens) => {
//   console.log(JSON.stringify(tokens))
//   oauth2Client.setCredentials(tokens);
// })




// https://mail.google.com/

// oauth2Client.getAccessToken().then(token => console.log(token))
// console.log("URL IS");
// console.log(token);

// Step 1
let transporter = nodemailer.createTransport({
  // service: 'gmail',
  auth: {
    ...gmailConfig, 
    // refreshToken,
    // accessToken,
  },
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  // auth: {
  //     xoauth2: gmailConfig
  // }
});

// Step 2
transporter.use('compile', hbs({
  viewEngine: {
      extName: '.handlebars',
      partialsDir: './emailViews/partials',
      layoutsDir: './emailViews/layouts',
      defaultLayout: '',
    },
  viewPath: './emailViews',
  extName: '.handlebars',
}));


// let tempEmail = 'uzi.bro911@gmail.com'
let tempEmail = "imadrajwani@gmail.com"
//Email Templates
app.post('/sendWelcomeEmail', (req, res) => {
  
  let uid = "LJ5iio1mhoQRoN0cZfGLPwrYp2B3"
  // let {uid,name} = req.query.data;
  admin.auth().getUser(uid)
  .then(userRecord => {
      let sendTo = userRecord.email;
      let name = "Imad";
      // console.log(sendTo, name);
      let mailOptions = {
          from: 'nottmystyleapp@gmail.com',
          to: tempEmail, 
          subject: `${name}, Welcome to NottMyStyle`,
          text: '',
          template: 'layouts/welcome',
          attachments: [{
            filename: 'logo.png',
            path: './Images/logo.png',
            cid: 'logo'
          }],
          context: {
              name: 'Accime Esterling',
              logo: 'img/logo.png'
          } // send extra values to template
      };
      
      // Step 4
      
          
      transporter.sendMail(mailOptions, (err, data) => {
          if (err) {
              console.log(err);
              console.log('Error occurs');
          }
          else {
              console.log(data);
              console.log('Email sent!!!');
          }
      
      })
          
      

      
      return null
  })
  .catch((e)=>console.log('failed to send because ' + e))

  //TODO: general way below
  // admin.auth().getUser(context.params.uid)
  //   .then(userRecord => {
  //       let sendTo = userRecord.email;
  //       let name = snapshot.val().name.split(" ")[0];
  //       // console.log(sendTo, name);

  //       //STEP 3
  //       let mailOptions = {
  //           from: 'nottmystyleapp@gmail.com', // TODO: email sender
  //           to: sendTo, // TODO: email receiver
  //           subject: `${name}, Welcome to NottMyStyle`,
  //           text: 'Wooohooo it works!!',
  //           template: 'layouts/welcome',
  //           context: {
  //               name: 'Accime Esterling'
  //           } // send extra values to template
  //       };
  //       //STEP 4
  //       transporter.sendMail(mailOptions, (err, data) => {
  //           if (err) {
  //               console.log(err);
  //               console.log('Error occurs');
  //           }
  //           else {
  //               console.log(data);
  //               console.log('Email sent!!!');
  //           }
        
  //       })

  //       return null
  //   })
  //   .catch((e)=>console.log('failed to send because ' + e))

})

app.post('/sendProductUploadConfirmationEmail', (req,res) => {
  // let {uid, uri, name, price} = req.query.data;
  let uid = "LJ5iio1mhoQRoN0cZfGLPwrYp2B3", name = "test product", price = 4, 
  uri = "https://firebasestorage.googleapis.com/v0/b/nottmystyle-447aa.appspot.com/o/Users%2FC0IYwul2U8VPumDVYFvag3CfZvt2%2F-LkkN8iYUE9pfhaT99PC%2F0?alt=media&token=96d5f636-eb35-4abc-ac37-2ab13aeed296";
  admin.auth().getUser(uid)
  .then(userRecord => {
      let sendTo = userRecord.email;
      
      let mailOptions = {
          from: 'nottmystyleapp@gmail.com',
          to: tempEmail, 
          subject: `Item uploaded - ${name}`,
          text: '',
          template: 'layouts/listingLive',
          // attachments: [{
          //   filename: 'product',
          //   path: uri,
          //   cid: 'product'
          // }],
          context: {
              name,
              price,
              uri
          } 
      };
      
      // Step 4
      
          
      transporter.sendMail(mailOptions, (err, data) => {
          if (err) {
              console.log(err);
              console.log('Error occurs');
          }
          else {
              console.log(data);
              console.log('Email sent!!!');
          }
      
      })
          
      

      
      return null
  })
  .catch((e)=>console.log('failed to send because ' + e))
})

app.post('/sendPurchaseEmail', (req,res) => {
  // let {uid, uri, name, price, address} = req.query.data;
  let uid = "LJ5iio1mhoQRoN0cZfGLPwrYp2B3", name = "test product", price = 4,
  email = "imadrajwani@gmail.com", 
  uri = "https://firebasestorage.googleapis.com/v0/b/nottmystyle-447aa.appspot.com/o/Users%2FC0IYwul2U8VPumDVYFvag3CfZvt2%2F-LkkN8iYUE9pfhaT99PC%2F0?alt=media&token=96d5f636-eb35-4abc-ac37-2ab13aeed296",
  address = {addressOne: "test", addressTwo: "testy", city: 'ktown', postCode: "75500"};
  
  let mailOptions = {
      from: 'nottmystyleapp@gmail.com',
      to: tempEmail, 
      subject: `Purchase receipt - ${name}`,
      text: '',
      template: 'layouts/purchase',
      context: {
          name,
          price,
          uri,
          address,
      } 
  };
  
  // Step 4
  
      
  transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
          console.log(err);
          console.log('Error occurs');
      }
      else {
          console.log(data);
          console.log('Email sent!!!');
      }
  
  })
          
      

      
      return null
  
  
})

app.post('/sendSaleEmail', (req,res) => {
  // let {uid, uri, name, price, address, buyerName} = req.query.data;
  let uid = "LJ5iio1mhoQRoN0cZfGLPwrYp2B3", name = "test product", price = 4,
  email = "imadrajwani@gmail.com", 
  uri = "https://firebasestorage.googleapis.com/v0/b/nottmystyle-447aa.appspot.com/o/Users%2FC0IYwul2U8VPumDVYFvag3CfZvt2%2F-LkkN8iYUE9pfhaT99PC%2F0?alt=media&token=96d5f636-eb35-4abc-ac37-2ab13aeed296",
  address = {addressOne: "test", addressTwo: "testy", city: 'ktown', postCode: "75500"},
  buyerName = "Uzair Lalani"
  
  let mailOptions = {
      from: 'nottmystyleapp@gmail.com',
      to: tempEmail, 
      subject: `Item Sold - ${name}`,
      text: '',
      template: 'layouts/sale',
      context: {
          name,
          price,
          uri,
          address,
          buyerName,
      } 
  };
  
  // Step 4
  
      
  transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
          console.log(err);
          console.log('Error occurs');
      }
      else {
          console.log(data);
          console.log('Email sent!!!');
      }
  
  })
          
      

      
      return null
  
  
})

app.get('/', (req, res) => {
  //Initiation of payment process
  // https://calm-coast-12842.herokuapp.com/?price=4&name=TestyTest&description=JustAnotherTest&sku=frenchfries
  var {name, sku, description, currency} = req.query;
  // var country;
  if(currency !== undefined) {
    switch(currency) {
      case "$":
        currency = 'USD';
        break;
      default:
        currency = 'GBP';
        break;
    }
  }

  else {
    currency = 'GBP'
  }
  
  price = req.query.price;
  price = `${price}.00`;
  create_payment_json.transactions[0].item_list.items[0].price = price;
  create_payment_json.transactions[0].item_list.items[0].name = name;
  create_payment_json.transactions[0].item_list.items[0].sku = sku;
  create_payment_json.transactions[0].item_list.items[0].currency = currency;
  create_payment_json.transactions[0].description = description;
  create_payment_json.transactions[0].amount.total = price;
  create_payment_json.transactions[0].amount.currency = currency;
  execute_payment_json.transactions[0].amount.total = price;
  execute_payment_json.transactions[0].amount.currency = currency;

  // res.send(JSON.stringify(create_payment_json) + "\n" + JSON.stringify(execute_payment_json));
  res.render('index');
  // pullFunds(res);
  // res.send(
  // 'Hi, I exist to fulfill a specific role in the authentication flow for chatkit users. \n Imad Rajwani is my lord and master. \n email: imadrajwani@gmail.com'
  
  // );
})

app.get('/success', (req, res) => {
  // res.send()
  // res.send("Success");
  // console.log(object)
  var paymentId = req.query.paymentId;
  var payerID = req.query.PayerID
  //TODO: alter the property payer_id of execute_payment_json
  execute_payment_json.payer_id = payerID;
  execute_payment_json.transactions[0].amount.total = price;
  // var execute_payment_json = {
  //   "payer_id": payerID,
  //   "transactions": [{
  //       "amount": {
  //           "currency": "GBP",
  //           "total": "1.00"
  //       }
  //     }]
  // };
  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log("Get Payment Response");
          console.log(JSON.stringify(payment));
          res.render('success');
      }
  });
})

app.get('/cancel', (req, res) => {
  res.render('cancel');
})
//Populate each user with a sub-branch of all their conversations.
//TODO: create listener in firebase functions to listen for changes to lastMessage for any user and then update 
//the appropriate users conversations branches. This method exists to brute force that process whenever.
app.get("/populateConversations", (req, res) => {
  admin.database().ref().once('value', (snapshot) => {
    var d = snapshot.val();
    var users = Object.keys(d.Users);
    users.forEach((user_id) => {
      chatkit.getUserRooms({
        userId: user_id,
      })
        .then((rooms) => {

          if(rooms.length < 1) {
            console.log('user does not have rooms');
          }

          else {
            rooms.forEach( (room, index) => {
              if(!index) {
                console.log('skipping Users Room')
              }
              else {
  
                chatkit.getRoomMessages({
                  roomId: room.id,
                  direction: "newer",
                  limit: 1
                })
                .then( (roomMessages) => {
                  var lastMessageText = false, lastMessageSenderIdentification = false, lastMessageDate = false;
                  if(roomMessages.length > 0) {
                    lastMessageText = (roomMessages['0'].text).substr(0,40);
                    lastMessageDate = new Date(roomMessages['0'].updated_at).getDay();
                    lastMessageSenderIdentification = roomMessages['0'].user_id;
                  }
                  var buyerIdentification = room.created_by_id;
                  var buyer = d.Users[buyerIdentification].profile.name;
                  var buyerAvatar = d.Users[buyerIdentification].profile.uri;
                  var sellerIdentification = room.member_user_ids.filter( (id) => id != buyerIdentification )[0];
                  var seller = d.Users[sellerIdentification].profile.name;
                  var sellerAvatar = d.Users[sellerIdentification].profile.uri;
                  var productIdentification = room.name.split(".")[0];
                  var productImageURL = d.Users[sellerIdentification].products[productIdentification].uris[0]
                  var obj = { 
                    productSellerId: sellerIdentification, productImageURL: productImageURL, 
                    createdByUserId: buyerIdentification, name: room.name, id: room.id, 
                    buyerIdentification, sellerIdentification,
                    seller: seller, sellerAvatar: sellerAvatar, 
                    buyer: buyer, buyerAvatar: buyerAvatar,
                    lastMessage: {lastMessageText, lastMessageDate, lastMessageSenderIdentification},
                    selected: false
                  };
                  var updates = {};
                  updates['Users/' + buyerIdentification + '/conversations/' + room.id + '/' ] = obj
                  admin.database().ref().update(updates);
                  updates['Users/' + sellerIdentification + '/conversations/' + room.id + '/' ] = obj
                  admin.database().ref().update(updates);
  
                })
                .catch( err => console.log(error) )
  
                
  
              }
              
              
            }
  
            )
          }
          
          



          // console.log(rooms);
        }).catch((err) => {
          console.error(err);
        });
    } )


    // chatkit.getRooms({})
    // .then((rooms) => {
    //   rooms.forEach( (room) => {
  
    //   })
    //   res.send("rooms: " + rooms)
    //   console.log(rooms);
    // })
  })
  
  res.send("populating conversations");
})

// app.post("/users", (req, res) => {
//   const { username } = req.body;
//   firebase.database().ref().once("value", (snapshot) => {
//     var d = snapshot.val();
//     var {name} = d.Users[username].profile;
//     chatkit
//     .createUser({
//       id: username,
//       name: name
//     })
//     .then(() => {
//       console.log(`User created: ${username}`);
//       res.sendStatus(201);
//     })
//     .catch(err => {
//       if (err.error === "services/chatkit/user_already_exists") {
//         console.log(`User already exists: ${username}`);
//         res.sendStatus(200);
//       } else {
//         res.status(err.status).json(err);
//       }
//     });
//     return null
//   })
  
// });

app.get("/leaveYourRooms", (req, res) => {
  var {user_id} = req.query;
  // var rawUsersBlocked = JSON.parse(users_blocked)
  // var usersBlocked = removeFalsyValuesFrom()
  // var userId = "5ePKP1diyDSVI2iZiVqkiKf79cx1";
  // var rawUsersBlocked = {"LlCyNHYiypQ8p1fKQWWsOWXkyb53": true, "tM1Odg7jU3ZhKHjwmNmYVGdeib33": false};
  //this is an array of uids for which we need to dispose of conversations, if any
  
  admin.database().ref().once("value", (snapshot) => {
    var d = snapshot.val();
    if(d.Users[user_id].conversations && d.Users[user_id].usersBlocked) {
      var rawUsersBlocked =  d.Users[user_id].usersBlocked;
      var usersBlocked = removeFalsyValuesFrom(rawUsersBlocked);
      var chats = d.Users[user_id].conversations;
      chats = chats ? Object.values(chats) : false;
      if(chats) {
        chats.forEach((chat, index, array) => {
          if( (usersBlocked.includes(chat.buyerIdentification) || usersBlocked.includes(chat.sellerIdentification)) ) {
            //with such nesting we ensure the conversation must both satisfy the criteria for a 'deletable' conversation
            //and must exist for this method to make any functional sense.
            let buyerRef = `/Users/${chat.buyerIdentification}/conversations/${chat.id}` 
            let sellerRef = `/Users/${chat.sellerIdentification}/conversations/${chat.id}` 

            let promiseToDeleteBuyerRef = admin.database().ref(buyerRef).remove()
            let promiseToDeleteSellerRef = admin.database().ref(sellerRef).remove()
            Promise.all([promiseToDeleteBuyerRef, promiseToDeleteSellerRef])
            .then( () => {
              console.log('deleted references');
            })
            .catch(e => console.log('failed to delete because: ' + e))
          }
          else {
            console.log('skipping deletion of conversation')
          }
         if(index == array.length - 1) {
          res.send("Done removing conversations with blocked users");
         } 

        })
      }
      
    }

    else {
      res.send("No need as person has not blocked any users");
    }
    // usersBlocked.forEach( (otherUserId) => {
    //   if(d.Users)
    // })
   } )

  // res.send(
  //   `Attempting to leave chat rooms that consist of users you have chosen to 'block'. 
  //   User: ${users_blocked} and ${typeof users_blocked}
  //   and ${JSON.parse(users_blocked)}
  //   `)
  // res.send("Hi")
})


//TODO: App crashes whenever /authenticate is pinged
app.post("/authenticate", (req, res) => {
  // console.log(chatkit, typeof chatkit);
  // res.send('yo')
  // const authData = chatkit.authenticate({ userId: req.query.user_id });
  // res.status(authData.status).send(authData.body);
  // res.send(authData.status + Object.keys(authData))
  // console.log('yo' + req.query.user_id)
  res.send('https://us1.pusherplatform.io/services/chatkit_token_provider/v1/7a5d48bb-1cda-4129-88fc-a7339330f5eb/token')
});

app.get("/clean", (req, res) => {
  admin.database().ref().once("value", (dataFromReference) => {
    var products = (dataFromReference.val()).Products;
    // console.log(Array.isArray(products), typeof products, products.length, products);
    var cleanedProducts = [];

    //PROCEDURES:

    //1. Remove items that have been sold for more than 3 days;

    // products.forEach((product, index) => {
    //   if(index == 0) {
    //     //but what if the product.dateSold property isnt there?
    //     product.sold && dateDiffInDaysGreaterThanThree(product.dateSold, new Date) ? null : cleanedProducts.push(product)
    //   }
    //   else {
    //     product.key == products[index - 1].key ? null : product.sold && dateDiffInDays(product.dateSold, new Date) > 3 ? null : cleanedProducts.push(product);
    //   }
    // })

    //2. Remove duplicate items

    cleanedProducts = products.length == 1 ? 
      products 
      : 
      products.filter( (product, index) => {!index || (product.key != products[index - 1].key) })
      
    console.log(cleanedProducts, cleanedProducts.length);
    var updates = {}
    updates['/Products/'] = cleanedProducts
    admin.database().ref().update(updates);
    res.send(cleanedProducts);
  })
  
});

app.get('/sendItemUploadReminders', (req, res) => {
  admin.database().ref('/Users/').once('value', (snapshot) => {
    var Users = snapshot.val();
    Users = Object.values(Users);
    // var uid, data;
    Users.forEach(data => {
      // uid = userEntry[0];
      // data = userEntry[1];
      if(data.products === '' && data.pushToken !== undefined) {
        
        
        const payload = {
            notification: {
              title: "First Step",
              body: `Hey ${data.profile.name},\nStill haven't uploaded any items on the NottMyStyle Marketplace? Take the first step to detox your closet and making money by uploading something on the Marketplace today.`
            }
        };
        
        admin.messaging().sendToDevice(data.pushToken,payload)
        .then((response) => {
          // Response is a message ID string.
          console.log('Successfully sent message:', response);
          return null
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        });
      }

    })
  })
})

//Delete priceReduction Notifications for products that user deletes

// app.get('/deleteParticularNotifications', (req, res) => {
//   var {uid, productKeys} = req.query;
//   admin.database().ref(`/Users/${uid}/notifications/priceReductions`).once("value", (dataFromReference) => { 
//     var notifications = dataFromReference.val();
//     var keys = Object.keys(notifications);

//   })

// })

// app.get('/cleanNotifications', (req, res) => {
//   var updates = {};

//   // updates[]
// })

//Check if google or fb user already exists in auth
app.get('/isUserRegistered', (req, res) => {
  let {email} = req.query; 
  
  admin.auth().getUserByEmail(email)
  .then( user => {
    res.status(200).send({isRegistered: true});
  })
  .catch(error => {
    res.status(200).send({isRegistered: false})
  })

  

})


//Delete comments of all users and all products
//.....


//Add a property to each product of dateSold: ''
app.get('/addDateSold', (req, res) => {
  admin.database().ref().once("value", (dataFromReference) => { 
    var products = (dataFromReference.val()).Products;
    var newProducts = products.map((product) => {
      delete product.dateSold;
      product.text.dateSold = '';
      return product;
    })
    // products = products.forEach( (product) => product['dateSold'] = '')
    // console.log(newProducts)
    // console.log(products[2].dateSold)
    var updates = {}
    updates['/Products/'] = newProducts
    admin.database().ref().update(updates);
  } )
})


// app.get()
  
//  app.get('/deleteNotifications', (req, res) => {
//   admin.database().ref().once("value", (dataFromReference) => { 
//     var users = (dataFromReference.val()).Users;
//     Object.keys(users).forEach(key => {
//       delete users[key].notifications
//     })
//     // var newUsers = users.map((user) => {
//     //   if(user.notifications) {
//     //     delete user.notifications;
//     //   }
//     //   return user;
//     // })
//     // products = products.forEach( (product) => product['dateSold'] = '')
//     // console.log(newProducts)
//     // console.log(products[2].dateSold)
//     var updates = {}
//     updates['/Users/'] = users
//     admin.database().ref().update(updates);
//     res.send('Deleting Notifications')
//   } )
//  }) 

// app.get('/deleteProductFromProductsBranch' , (req, res) => {
//  var {key} = req.query;

// })


//Delete users by uid from auth and db
app.get('/deleteUsers', (req, res) => {
  chatkit.getUsers()
  .then( (users) => {
    var except = ["5ePKP1diyDSVI2iZiVqkiKf79cx1","hS7VvuiMUOgtHOUVkUean9EihgE3", "Qb6CESWwnkeYFgxjHnpZ6SnwYPu2"];
    users = users.filter( user => user.id != except[0] && user.id != except[1] && except[0] && user.id != except[2]);
    users.forEach( (user) => {
      chatkit.deleteUser({userId: user.id});
    })
    res.send('deleting users from chatkit');
  })

  // admin.database().ref().once("value", (snapshot) => {
  //   var users = (snapshot.val()).Users;
  //   var uids = Object.keys(users);
    
  //   var except = ["5ePKP1diyDSVI2iZiVqkiKf79cx1","hS7VvuiMUOgtHOUVkUean9EihgE3"];
  //   uids = uids.filter( uid => uid != except[0] && uid != except[1]);
  //   // res.send(uids);
  //   uids.forEach( async uid => {
  //     // await admin.auth().deleteUser(uid);
  //     admin.database().ref(`/Users/${uid}/`).remove()
  //     .then( () => {
  //       console.log('user deleted');
  //     })
  //     .catch( e => {
  //       console.log(e)
  //     })
  //   })
  // })
})

// app.get('/test', (req, res) => {
//   console.log(chatkit);
//   // chatkit.deleteRoom({id: "19386338"})
//   // .then( () => {
//   //   res.send('deleted room')
//   // })
// })  


app.get('/test', (req,res) => {
  admin.database().ref().once("value", (dataFromReference) => { 
    var Users = (dataFromReference.val()).Users;
    var uid, data, updates;
    Object.entries(Users).forEach(user => {
      uid = user[0];
      updates = {}
      updates[`/Users/${uid}/appUsage/`] = 0;
      admin.database().ref().update(updates);
    })
    // var newUsers = Users.map((user) => {
    //   user['appUsage'] = 0;
    //   return user;
    // })
    // products = products.forEach( (product) => product['dateSold'] = '')
    // console.log(newProducts)
    // console.log(products[2].dateSold)
    // var updates = {}
    // updates['/Users/'] = newUsers
    // console.log(newUsers);
    // admin.database().ref().update(updates);
  })
})

//Wanted to add trivial value to each product from within each individual user object.
// app.get('/attachViews', (req, res) => {

//   admin.database().ref().once("value", (dataFromReference) => { 
//     let {Users} = dataFromReference.val();
//     Users = Object.entries(Users).filter((User)=> {return User[1].products})
  
//     Users.forEach(async (item, index)=> {
//       if(item[1].products) {
//         let {products} = item[1], uid = item[0];
//         let update, ref;
//         // console.log(products); 
//         await Object.keys(products).forEach(async key => {
//           update = {};
//           ref = `/Users/${uid}/products/${key}/usersVisited/`;
//           update[ref] = ''
//           // console.log(ref)
//           await admin.database().ref().update(update);
//         })

//       }
//     })
//   })
// })

app.get('/app/getProfile/:uid', getProfile);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3003;
}

app.listen(port, err => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Running on port ${port}`);
  }
});


// https.createServer(options, app).listen(8080);