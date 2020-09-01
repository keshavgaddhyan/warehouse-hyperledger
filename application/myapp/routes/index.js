var express = require('express');
var router = express.Router();
const FabricClient = require('../fabric/client.js');
const client = new FabricClient();

/* GET home page. */
router.get('/', function(req, res, next) {
  var productRequest = new Promise((resolve, reject) => {
    if (req.query.search){
      console.log(req.query.search)
      var products = client.query('admin', 'SearchProducts', [req.query.search]);
    }else if (req.query.filter){
      var products = client.query('admin', 'GetIncompleteProducts');
    }else{
      var products = client.query('admin', 'QueryAllProducts');
    }
    resolve(products);
  });
  var userRequest = new Promise((resolve, reject)=>{
    var users = client.listUsers();
    resolve(users);
  })
  Promise.all([productRequest, userRequest]).then((data) => {
    console.log("resolved");
    // console.log(data);
    console.log(data[0])
    res.render('index', { title: 'Warehouse', products: data[0], users: data[1], filter: req.query.filter, search: req.query.search });
  })
});

module.exports = router;
