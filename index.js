
 var express = require('express');

 var ejs  = require('ejs');   // importing Node JS packages (express & ejs)

 var bodyParser = require('body-parser');  //import

 var mysql = require('mysql');  // import mysql package

 var session = require('express-session');
 

  // database connection

   mysql.createConnection({

     host: "localhost" ,
     user: "root",
     password: "",
     database: "node_project"

   });





 var app = express();       // initialize express

   app.use(express.static('public'));

    app.set('view engine' ,'ejs');

   app.listen(8080);  // to start the server
   
   //localhost:8080

   app.use(bodyParser.urlencoded({extended:true}));  // code so that the server can access the form values
   app.use(session({secret : "secret"}))

     function isProductInCart(cart , id){     // function define ( to check whether the product is in cart or not)

       for(let i=0;i<cart.length;i++){

           if(cart[i].id ==id){

            return true;   // product is in the cart
           }
       }

       return false;   // product is not in the cart

           }
   
             
     function calculateTotal(cart , req){

      total =0;             // Final Total amounts of the products in the cart 
       for(let i=0;i<cart.length;i++){

      
        //if we are offering a discounted price

        if(cart[i].sale_prcie){  

            total = total + (cart[i].sale_prcie* cart[i].quantity);
        
          }else{  // if we are not offering a discounted price

            total =total + (cart[i].price* cart[i].quantity);
          }

       }

       req.session.total  =total;
       return total;
     }       

  




    app.get('/' , function(req ,res){

    var con = mysql.createConnection({      // createConnetion method

          host: "localhost" ,
          user: "root",
          password: "",
          database: "node_project"
     
        });

        con.query(            // we used connection.query method to run a query to database from nodejs

        "SELECT * FROM products",

          (error ,results) => {

            if(error){

              console.log(error);
            }else{
              if(results && results.length>0){

                res.render('pages/index' , {result:results});

              }else{
                res.send('No product Found');
              }
            }

          
          });
     


});


  app.post('/add_to_cart', function(req , res){

    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var sale_prcie = req.body.sale_prcie;
    var quantity = req.body.quantity;
    var image = req.body.image;

    var product = {id:id , name:name , price:price, sale_prcie: sale_prcie, quantity:quantity, image:image};


      if(req.session.cart){

        var cart = req.session.cart;

        if(!isProductInCart(cart , id)){           //function call (argumnets)

          cart.push(product);     // if product is not in  the cart then -push the product in the cart
        }
      }else{

        req.session.cart = [product];      // if product is in the cart(product is already exsist in the cart)
        var cart = req.session.cart;
      }

    
    // CALCULATE TOTAL  

      calculateTotal(cart, req);   // function call

     // RETURN TO CART PAGE
     
     res.redirect('/cart');

  });


    app.get('/cart' , function(req ,res){

      var cart = req.session.cart;
      var total = req.session.total;
      
      res.render('pages/cart' , {cart:cart, total:total});


    });

     // CODE FOR REMOVE

    app.post('/remove_product', function(req ,res){

        var id = req.body.id;   // var id store the information of the id of the product
        var cart = req.session.cart;        

         for(let i=0;i<cart.length;i++){

          if(cart[i].id == id){

            cart.splice(cart.indexOf(i),1);   // function to remove the product from the cart
          }
         }

         // after removing the product from the cart then recalculate the total again

         calculateTotal(cart , req);  // function call

         // redirect to the cart.ejs page

         res.redirect('/cart');


    });


      //CODE FOR QUANTITY

    app.post('/edit_product_quantity' , function(req,res){

           // get values from the form(input)

           var id = req.body.id;
           var quantity = req.body.quantity;
    var increase_btn = req.body.increase_product_quantity;
    var decrease_btn = req.body.decrease_product_quantity;

     
      var cart = req.session.cart;

      // again we check whether the product is in cart or not

       if(increase_btn){

      for(let i=0;i<cart.length;i++){

          if(cart[i].id ==id){

            if(cart[i].quantity >0){

              cart[i].quantity = parseInt(cart[i].quantity) +1;
            }

          }
      }
    }

    
    if(decrease_btn){

      for(let i=0;i<cart.length;i++){

          if(cart[i].id ==id){

            if(cart[i].quantity >1){

              cart[i].quantity = parseInt(cart[i].quantity) -1;
            }

          }
      }
    }

     // again recalculate the total

     
     calculateTotal(cart , req);  // function call

     // redirect to the cart.ejs page

     res.redirect('/cart');



         
    });

    // CODE FOR CHECKOUT

    app.get("/checkout", function(req,res){

        var total = req.session.total;


        res.render('pages/checkout' , {total : total});
    });
 

    app.post("/place_order" , function(req ,res){

           var name = req.body.name;
           var email = req.body.email;
           var phone = req.body.phone;
           var city = req.body.city;
           var address = req.body.address;
           var cost = req.session.total;
           var status = "not paid";
           var date = new Date();    
           var product_id;
           var id = Date.now();
           req.session.order_id = id; 
           
           
           var con = mysql.createConnection({      // createConnetion method

            host: "localhost" ,
            user: "root",
            password: "",
            database: "node_project"
       
          });


          var cart = req.session.cart;
          for(let i=0;i<cart.length;i++){

             product_id = product_id + "," + cart[i].id
          }


          con.connect((err) =>{

            if(err){
              console.log(err)
            }else{
                // Storing information about customer in orders(1st) table in database

              var query = "INSERT INTO orders(id, cost , name ,email ,status , city, address , phone , date, product_id) VALUES ?";

              var values = [
                [ id, cost , name , email , status , city , address , phone , date ,product_id]

              
            ];

              con.query(query , [values], (err, results) =>{

                for(let i=0;i<cart.length;i++){

                  // Storing information about order in order_items(2nd)table in database

                  var query = "INSERT INTO order_items(order_id , product_id ,product_name , product_price, product_image , product_quantity ,order_date) VALUES ?";
                  var values = [
                    [id , cart[i].id , cart[i].name , cart[i].price, cart[i].image , cart[i].quantity , new Date()]
                  ];

                  con.query(query ,[values], (err ,results) =>{

                  })
                }

                res.redirect('/payment');
              })
            }
          })


    })


    app.get('/payment' , function(req ,res){

      var total = req.session.total;


       res.render('pages/payment', {total:total});
    })


    app.get("/verify_payment" , function(req ,res){

     var transaction_id = req.query.transaction_id;
     var order_id = req.session.order_id;

         
     var con = mysql.createConnection({      // createConnetion method

      host: "localhost" ,
      user: "root",
      password: "",
      database: "node_project"
 
    });
  


    con.connect((err) =>{

      if(err){
        console.log(err)
      }else{
          // Storing information about payments transaction in payments(3rd) table in database

        var query = "INSERT INTO payments(order_id , transaction_id , date) VALUES ?";

        var values = [
          [order_id , transaction_id, new Date()]

        
      ];

        con.query(query , [values] , (err, results) =>{

          // Updating the value of status(column name) in orders(1st table) in the database

          con.query("UPDATE orders SET status ='paid' WHERE id ='"+order_id+"'", (err,results)=>{})

          res.redirect('/thank_you');

        })

      }
    })

  })


  app.get('/thank_you' , function(req ,res){

      var order_id = req.session.order_id;

          res.render('pages/thank_you' , {order_id:order_id});

  });
    


  app.get('/single_product', function(req,res){

      var id = req.query.id;

      var con = mysql.createConnection({      // createConnetion method

        host: "localhost" ,
        user: "root",
        password: "",
        database: "node_project"
   
      });

      con.query(            // we used connection.query method to run a query to database from nodejs

      "SELECT * FROM products WHERE id = '"+id+"'",

        (error ,results) => {
  
             res.render('pages/index' , {result:results});
        });
   

  });


  

  app.get('/products', function(req,res){

    var con = mysql.createConnection({      // createConnetion method

      host: "localhost" ,
      user: "root",
      password: "",
      database: "node_project"
 
    });

    con.query(            // we used connection.query method to run a query to database from nodejs

    "SELECT * FROM products",

      (error ,results) => {

         res.render('pages/index' , {result:results});
      });
 

  });


  

  app.get('/about', function(req,res){

    res.render('pages/about');

  });


    