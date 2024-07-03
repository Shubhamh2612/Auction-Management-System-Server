const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");

// imports for the json data file
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  user: "unbypmeqvuu1e4pk",
  host: "bultwttoppdkfltxkqhf-mysql.services.clever-cloud.com",
  password: "XGDuimrzbKgDJg4vFG8S",
  database: "bultwttoppdkfltxkqhf",
});

app.post("/login", (req, res) => {
  const name = req.body.name;
  const uid = req.body.uid;
  const balance = req.body.balance;

  let flag = 0;

  db.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      for (let i = 0; i < result.length; i++) {
        if (result[i].uid === uid) {
          flag = 1;
          res.send(result[i]);
        }
      }
      if (flag === 0) {
        db.query(
          "INSERT INTO users (name, uid) VALUES (?,?)",
          [name, uid],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              var obj = new Object();
              obj.name = name;
              obj.uid = uid;
              obj.balance = 20000;
              res.send(obj);
              return;
            }
          }
        );
      }
    }
  });
});

app.post("/get_details", (req, res) => {
  const item_id = req.body.item_id;
  db.query(
    "SELECT * from bidding_table where item_id=(?)",
    [item_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        if (result.length) {
          if (result[0].current_highest_buyer != "null") {
            db.query(
              "SELECT name FROM users WHERE uid=(?) ",
              [result[0].current_highest_buyer],
              (err, result2) => {
                if (err) {
                  console.log(err);
                } else {
                  result[0].current_highest_buyer =
                    result2[0].name + "-" + result[0].current_highest_buyer;
                  res.send(result[0]);
                }
              }
            );
          } else res.send(result[0]);
        } else {
          var date = new Date();
          date.setMinutes(date.getMinutes() + 5);
          db.query(
            "INSERT INTO bidding_table (item_id , time) VALUES (?,? )",
            [item_id, date],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                db.query(
                  "SELECT * from bidding_table where item_id=(?)",
                  [item_id],
                  (err, result) => {
                    if (err) {
                      console.log(err);
                    } else {
                      if (result.length) {
                        res.send(result[0]);
                      }
                    }
                  }
                );
                return;
              }
            }
          );
        }
      }
    }
  );
});

app.post("/update_store", (req, res) => {
  const item_id = req.body.item_id;
  const item_name = req.body.item_name;
  const current_highest_buyer = req.body.current_highest_buyer;
  const current_price = req.body.current_price;

  db.query(
    "SELECT current_highest_buyer,current_price from bidding_table where item_id=(?)",
    [item_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        if (result[0].current_highest_buyer != "null") {
          db.query(
            "UPDATE users set balance=balance+(?) where uid=(?)",
            [result[0].current_price, result[0].current_highest_buyer],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                console.log("Older bidders money given back");
              }
            }
          );
        } else console.log("bleh bleh");
      }
    }
  );

  db.query(
    "UPDATE bidding_table set current_highest_buyer=(?),current_price=(?) where item_id=(?)",
    [current_highest_buyer, current_price, item_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        db.query(
          "UPDATE users set balance=balance-(?) where uid=(?)",
          [current_price, current_highest_buyer],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              console.log("Newer bidders money subtracted");
            }
          }
        );
        var obj = {};
        obj.status = 1;
        res.send(obj);
        return;
      }
    }
  );
});

app.get("/get_store", (req, res) => {
  db.query("SELECT * FROM inventory", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});
app.get("/get_balance", (req, res) => {
  db.query(
    "SELECT balance FROM users WHERE uid=(?)",
    [req.query.uid],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result[0]);
      }
    }
  );
});

app.get("/my_products", (req, res) => {
  db.query(
    "SELECT * FROM bidding_table where current_highest_buyer=(?)",
    [req.query.uid],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        var date = new Date();
        let arr = [];
        let arr2 = [];
        result.map((item) => {
          var obj = {};
          var date2 = new Date(item.time);
          if (date - date2 > 0) {
            obj.item_id = item.item_id;
            obj.current_price = item.current_price;
            obj.time = item.time;
            arr2.push(obj.item_id);
            arr.push(obj);
          }
        });
        if (arr2.length) {
          db.query(
            "SELECT product_name FROM inventory where product_id IN (?)",
            [arr2],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                let arr3 = [];
                for (let i = 0; i < arr.length; i++) {
                  let obj = {};
                  obj.item_id = arr[i].item_id;
                  obj.current_price = arr[i].current_price;
                  obj.time = arr[i].time;
                  obj.product_name = result[i].product_name;
                  arr3.push(obj);
                }
                console.log(arr3);
                res.send(arr3);
              }
            }
          );
        } else res.send(arr);
      }
    }
  );
});

app.listen(3001, () => {
  console.log("server running on 3001");
});
