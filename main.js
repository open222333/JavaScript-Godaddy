let express = require('express');
let request = require('request');
let bodyParser = require('body-parser')
let app = express();

// create application/x-www-form-urlencoded parser
let urlencodedParser = bodyParser.urlencoded()

app.post('/get_domain', urlencodedParser, function (req, res) {

  let expires_days = 0;
  let show_date = false;

  // 是否有expires_days參數 指定過期時間 預設為30天
  if (req.body.hasOwnProperty('expires_days')) {
    expires_days = parseInt(req.body.expires_days);
  } else {
    expires_days = 30;
  }

  // 顯示日期
  if (req.body.hasOwnProperty('show_date')) {
    if (req.body.show_date === 'true') {
      show_date = req.body.show_date;
    }
  }

  // console.log(req.body);
  let headers = {
    'X-Shopper-Id': `${req.body.shopper_id}`,
    'Authorization': `sso-key ${req.body.api_key}:${req.body.api_secret}`,
    'accept': 'application/json'
  };

  let options = {
    url: 'https://api.godaddy.com/v1/domains',
    method: 'GET',
    headers: headers,
    // body: dataString
  };

  function callback (error, response, body) {
    if (!error && response.statusCode == 200) {
      // console.log(body);
      let response_data = {};
      let ex_domains = [];
      let soon_domains = [];

      for (let i = 0; i < body.length; i++) {

        // 計算相差天數
        let today_date = new Date();
        let timestamp = Date.parse(body[i]['expires']);
        let ex_date = new Date(timestamp);
        let seconds = ex_date.getTime() - today_date.getTime();
        let days = parseInt(seconds / (1000 * 60 * 60 * 24));

        // 快過期的
        if (days > expires_days) {
          let meg_soon;
          if (show_date) {
            meg_soon = `${body[i]['domain']} - ${body[i]['expires']}`
          } else {
            meg_soon = `${body[i]['domain']}`
          }
          soon_domains.push(meg_soon);
        }

        response_data[`${expires_days}天後過期`] = soon_domains;

        // 已過期的
        if (seconds < 0) {
          let meg_ex;
          if (show_date) {
            meg_ex = `${body[i]['domain']} - ${body[i]['expires']}`
          } else {
            meg_ex = `${body[i]['domain']}`
          }
          ex_domains.push(meg_ex);
        }

        response_data[`已過期`] = ex_domains;
      }

      res.json(response_data);
    }
  }

  request(options, callback).json();
})

let server = app.listen(80, function () {

  let host = server.address().address
  let port = server.address().port

  console.log(`http://${host}:${port}`)
});