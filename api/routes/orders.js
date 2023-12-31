const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuth = require("../middleware/check-auth");
const jwt = require("jsonwebtoken");

const Order = require("../models/order");
const Product = require("../models/product");

router.get("/", checkAuth, (req, res, next) => {
  let email = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_KEY
  ).email;
  Order.find({email: email})
    .select("product quantity _id status")
    .populate("product")
    .exec()
    .then((docs) => {
      res.status(200).json({
        count: docs.length,
        orders: docs.map((doc) => {
          return {
            _id: doc._id,
            product: doc.product,
            quantity: doc.quantity,
            status: doc.status,
          };
        }),
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.post("/", checkAuth, (req, res, next) => {
  let email = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_KEY
  ).email;
  //check if the product exist
  console.log(req.body.productId)
  Product.findById(req.body.productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }
      const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        quantity: req.body.quantity,
        name: product.name,
        status: req.body.status,
        email: email,
        product: req.body.productId,
      });
      //return a promise
      return order.save();
    })
    //if exist save the order
    .then((result) => {
      if (res.statusCode === 404) {
        return res;
      }

      res.status(201).json({
        message: "Order stored",
        createdOrder: {
          _id: result._id,
          name: result.name,
          product: result.product,
          quantity: result.quantity,
          status: result.status,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.get("/:orderId", checkAuth, (req, res, next) => {
  Order.findById(req.params.orderId)
    .select("product quantity _id status")
    .exec()
    .then((order) => {
      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }
      res.status(200).json({
        order: order,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.post("/:orderId", checkAuth, (req, res, next) => {
  const order = {
    productId: req.body.productId,
    quantity: req.body.quantity,
  };
  res.status(200).json({
    message: "Order details",
    orderId: order,
  });
});

router.delete("/:orderId", checkAuth, (req, res, next) => {
  console.log(req)
  let email = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_KEY
  ).email;
  Order.findById(req.params.orderId)
    .exec()
    .then((order) => {
      if (order.email === email) {
        Order.deleteOne({ _id: req.params.orderId })
          .exec()
          .then((result) => {
            res.status(200).json({
              message: "Order deleted",
            });
          })
          .catch();
      } else {
        res.status(401).json({
          message: "You cannot delete this order because is not your order!!",
        });
      }
    });
});

module.exports = router;
