var express = require('express');
var router = express.Router();
const FabricClient = require('../fabric/client.js');
const client = new FabricClient();

router.get('/create', function(req, res, next) {
  var userRequest = new Promise((resolve, reject)=>{
    var users = client.listUsers();
    resolve(users);
  })

  userRequest.then(users => {
    
    res.render('createProduct', {users: users});
  })
  
})

router.post('/create', function(req, res, next) {
  var identity = req.body.identity;
  var name = req.body.name;
  var description = req.body.description;
  var stages = req.body.stages;
  console.log(req.body);
  request = new Promise((resolve, reject) => {
    try{
      var product = client.invoke(identity, 'createProduct', [name, description, stages]);
      resolve(product);
    }catch(error){
      reject(error);
    }
  })
  request.then(product => {
    res.redirect('/');
  }, (error)=>{
    console.log("Error", error);
    res.render('error', {error:error});
  })
  
})

/* GET products listing. */
router.get('/:productId', function(req, res, next) {
  var productRequest = new Promise((resolve, reject)=>{
    try{
      var product = client.query('admin', 'queryProduct', [req.params.productId]);
      resolve(product);
    }catch(error){
      reject(error);
    }
  });

  var userRequest = new Promise((resolve, reject)=>{
    var users = client.listUsers();
    resolve(users);
  })

  Promise.all([productRequest, userRequest]).then((data) => {
    res.render('product', {product: data[0], users: data[1]});
  })

});

router.post('/:productId', function(req, res){
  var identity = req.body.identity;
  var request = new Promise((resolve, reject)=>{
    try{
      var product = client.invoke(identity, 'signProduct', [req.params.productId]);
      resolve(product);
    }catch(error){
      reject(error);
    }
  })

  request.then(product=>{
    res.redirect(`/products/${req.params.productId}`)
  }, (error)=>{
    console.log("Error", error);
    res.render('error', {error:error});
  })
})

module.exports = router;
