/*---.js코드를 부르기------*/
var app = require('./config/express')(); //config ->express.js를 부르기
var express = require('express');
var passport = require('./config/passport')(app);
var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();
var fs =require('fs');//#
var conn = require('./config/Database')();
var nodemailer = require("nodemailer");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var path=require('path');
var util = require('util');
var mime=require('mime-types');
 //app.set('view engine', 'jade');

 var cons = require('consolidate')
 var time = require('date-utils');

app.engine('ejs', cons.ejs)
app.engine('jade', cons.jade)
 app.set('views', __dirname + '/views');
 //app.set('view engine', 'ejs');
 app.set('view engine', 'jade');
 app.engine('html', require('ejs').renderFile);
 app.use(express.static('public'));

 app.use(bodyParser.urlencoded({extended: false}));
 app.use(bodyParser.json());
 app.use(cookieParser('23879ASDF234sdf@!#$a'));
 app.locals.pretty = true;

 /*산아*/
 var products ={};
 var sql = 'SELECT * FROM content';
 conn.query(sql,  function(err,contents, fields){
     if(err){
       console.log(err);
       res.status(500).send('Internal Server Error');
     }
     for (var i = 0; i < contents.length; i++) {
           products[i]=contents[i];
         }});

app.get('/count', function(req, res){
           if(req.session.count) {
             req.session.count++;
           } else {
             req.session.count = 1;
           }
           res.send('count : '+req.session.count);
});
app.get('/main', function(req, res){
          var person = req.user;
           if(person==undefined) {
             res.render('main_logout.html');
           }else{
             res.render ('main_login.html');
           }
});
 app.get('/cart/add/:id', function(req, res){
   var id = req.params.id;
   if(req.signedCookies.cart) {
     var cart = req.signedCookies.cart;
     var totalprice= req.signedCookies.totalprice;
   } else {
     var cart = {};
     var totalprice = 0;
   }
   if(!cart[id]){
     cart[id] = 0;
   }
   totalprice = parseInt(totalprice)+parseInt(products[id].con_price);
   cart[id] = 1;
   res.cookie('cart', cart, {signed:true});
   res.cookie('totalprice', totalprice, {signed:true});
   res.redirect('/main');
 });

 app.get('/cart/delete/:id', function(req, res){
   var id = req.params.id;
   if(req.signedCookies.cart) {
     var cart = req.signedCookies.cart;
     var totalprice= req.signedCookies.totalprice;
   } else {
     var cart = {};
     var totalprice = 0;
   }
   if(!cart[id]){
     cart[id] = 0;
   }
   if(parseInt(cart[id])>0){
     totalprice = parseInt(parseInt(totalprice)-(parseInt(products[id].con_price))*parseInt(cart[id]));
     cart[id] = 0;
   }
   res.cookie('cart', cart, {signed:true});
   res.cookie('totalprice', totalprice, {signed:true});
   res.redirect('/cart');
 });
 app.get('/cart', function(req, res){
    var cart = req.signedCookies.cart;
    var totalprice = req.signedCookies.totalprice;
    var person = req.user;
    if (cart==undefined){
      res.render('cart_noitem.ejs');
    }
    else{
      if(person==undefined) {
        res.render('cart_logout.ejs',{cart:cart,products:products,totalprice:totalprice});
        console.log(cart);
      }else{
        res.redirect('cart_login.ejs',{cart:cart,products:products,totalprice:totalprice});
      }
    }
  });
 app.get('/pay', function(req, res){
   var totalprice = req.signedCookies.totalprice;
   res.render ('pay.ejs',{totalprice:totalprice});
 });
 app.get('/pay_ing',function(req,res){
   var totalprice = req.signedCookies.totalprice;
   res.render ('pay_ing',{totalprice:totalprice});
 });
 app.get('/pay_ing2',function(req,res){
   res.render ('pay_ing2');
 });
 app.get('/pay_end', function(req, res){
   var cart = req.signedCookies.cart;
   for( var index in cart ) {
     if(parseInt(cart[index])>0) {
       var products_name = products[index].con_name;
       var products_download = parseInt(parseInt(products[index].con_download)+1);
       var sql = 'UPDATE content SET con_download=? WHERE con_name=?';
        console.log(products_name);
         conn.query(sql, [products_download,products_name], function(err, row, fields){
           if(err){
             console.log(err);
             res.status(500).send('Internal Server Error');
           };
               res.redirect('/mypage/download');
         });}}
     });
     app.get('/mypage/download',function(req,res){
       var buynum = 0;
       var cart = req.signedCookies.cart;
       var itemPurchased = cart;
       var newDate = new Date();
       var buydate = newDate.toFormat('YYYY-MM-DD');
       res.clearCookie('cart');
       res.clearCookie('totalprice');
       for( var index in cart ) {
         if(parseInt(cart[index])>0) {
           var products_name = products[index].con_name;
           var products_download = parseInt(parseInt(products[index].con_download)+1);
           var user_name = req.user.username;
           buynum = parseInt(parseInt(buynum)+1);
           var confilesize = '12kb';
           var confilepath = 'C:/Users/정산아/dev/js/server_side_javascript/통합본/project-ing/music';
           var sql = 'INSERT INTO user_buylist (username,con_name,buy_date,buy_num,con_filesize,con_filepath) VALUES(?,?,?,?,?,?)';
           var params = [user_name,products_name,buydate,buynum,confilesize,confilepath];
           console.log(products_name);
           var sql2 = 'SELECT * from user_buylist';
           conn.query(sql, params, function(err, content, fields){
             if(err){
               console.log(err);
               res.status(500).send('Internal Server Error');
             };});
           }};
           var sql = 'SELECT * from user_buylist';
           conn.query(sql,function(err,rows,fields){
              if(err){
                console.log(err);
                res.status(500).send('Internal Server Error');
              };
              res.render ('mypage_download',{rows:rows, buydate:buydate});
    });});
   /* 주의 각각 pc에 맞게 수정해서 사용하기!*/
 app.get('/download/:id', function(req, res){
   var id = req.params.id;
   var cart = req.signedCookies.cart;
   var origFileName = products[id].con_name + '.mp3';
   var savedFileName = products[id].con_name +'.mp3';
   var savedPath ='/Users/안수진/Desktop/dailycoding_2018_08_23_통합본/project-ing/music';
   var filSize = '123kb';
   var file =savedPath + '/' + savedFileName;
   mimetype = mime.lookup(origFileName);
   res.setHeader('Content-disposition','attachment; filename=' +origFileName);
   res.setHeader('Content-type',mimetype);
   var filestream = fs.createReadStream(file);
   filestream.pipe(res);
 });
 /*세희*/
  app.get('/search_bar', function(req, res){
   res.render('search_bar.ejs');
 })

 app.get('/Category1', function(req, res){//메인페이지(CON_NAME값을 통하여 글 내용을 볼 수 있음)
   var sql = 'SELECT rank, con_name from (select ( @rank := @rank + 1 ) AS rank, con_name FROM content AS a, (SELECT @rank := 0 ) AS b ORDER BY a.con_download DESC) RANK WHERE rank <=5';
   conn.query(sql, function(err, contents, fields){
     for (var i = 0; i < products.length; i++) {
       var content = {}
       if(products[i].cate_code==1) {
         if(err) {
           console.log(err);
           res.status(500).send('Internal Server Error');
         } else {
           content[i] = products[i];
           res.render('Category1.ejs', {layout:true, contents : contents, content : content});
         }
       }
     }
   });
 });

 /*app.get('/CategoryContent1', function(req, res){
   var start_page = (req.query.page-1)*3;
     var sql1 = 'set @a=?';
     conn.query(sql1, [start_page], function(err, con1){
       var sql2 = 'prepare stmt from \'select con_imge_filepath, con_name, con_price from content where cate_code=1 limit ?, 3\';';
       conn.query(sql2, function(err, con2){
         var sql3 = 'execute stmt using @a;';
         conn.query(sql3, function(err, content){
           if(err) {
             console.log(err);
             res.status(500).send('Internal Server Error');
           } else {
             res.render('CategoryContent1.ejs', {layout:true, content : content});
           }
         });
       })
     })
   }); */
 app.get('/Category2', function(req, res){//메인페이지(CON_NAME값을 통하여 글 내용을 볼 수 있음)
   var sql = 'SELECT rank, con_name from (select ( @rank := @rank + 1 ) AS rank, con_name FROM content AS a, (SELECT @rank := 0 ) AS b ORDER BY a.con_download DESC) RANK WHERE rank <=5';
   conn.query(sql, function(err, contents, fields){
       var sql2 = 'SELECT con_imge_filepath, con_name, con_price from content where cate_code=2';
       conn.query(sql2, function(err, content){
         if(err) {
           console.log(err);
           res.status(500).send('Internal Server Error');
         } else {
           res.render('Category2.ejs', {layout:true, contents : contents, content : content});
         }
       })
   });
 });

 app.get('/CategoryContent/:id', function(req, res){
   var id = req.params.id;
   var start_page = (req.query.page-1)*3;
     var sql1 = 'set @a=?';
     conn.query(sql1, [start_page], function(err, con1){
       var sql2 = 'prepare stmt from \'select con_imge_filepath, con_name, con_price from content where cate_code= id limit ?, 3\';';
       conn.query(sql2, function(err, con2){
         var sql3 = 'execute stmt using @a;';
         conn.query(sql3, function(err, content){
           if(err) {
             console.log(err);
             res.status(500).send('Internal Server Error');
           } else {
             var CategoryContentsite = 'CategoryContent' + id + '.ejs'
             res.render(CategoryContentsite, {layout:true, content : content});
           }
         });
       })
     })
   });
 app.get('/Category3', function(req, res){//메인페이지(CON_NAME값을 통하여 글 내용을 볼 수 있음)
   var sql = 'SELECT rank, con_name from (select ( @rank := @rank + 1 ) AS rank, con_name FROM content AS a, (SELECT @rank := 0 ) AS b ORDER BY a.con_download DESC) RANK WHERE rank <=5';
   conn.query(sql, function(err, contents, fields){
       var sql2 = 'SELECT con_imge_filepath, con_name, con_price from content where cate_code=3';
       conn.query(sql2, function(err, content){
         if(err) {
           console.log(err);
           res.status(500).send('Internal Server Error');
         } else {
           res.render('Category3.ejs', {layout:true, contents : contents, content : content});
         }
       })
   });
 });
 /*
 app.get('/CategoryContent3', function(req, res){
   var start_page = (req.query.page-1)*3;
     var sql1 = 'set @a=?';
     conn.query(sql1, [start_page], function(err, con1){
       var sql2 = 'prepare stmt from \'select con_imge_filepath, con_name, con_price from content where cate_code=3 limit ?, 3\';';
       conn.query(sql2, function(err, con2){
         var sql3 = 'execute stmt using @a;';
         conn.query(sql3, function(err, content){
           if(err) {
             console.log(err);
             res.status(500).send('Internal Server Error');
           } else {
             res.render('CategoryContent3.ejs', {layout:true, content : content});
           }
         });
       })
     })
   });
*/
 app.get('/Category4', function(req, res){//메인페이지(CON_NAME값을 통하여 글 내용을 볼 수 있음)
   var sql = 'SELECT rank, con_name from (select ( @rank := @rank + 1 ) AS rank, con_name FROM content AS a, (SELECT @rank := 0 ) AS b ORDER BY a.con_download DESC) RANK WHERE rank <=5';
   conn.query(sql, function(err, contents, fields){
       var sql2 = 'SELECT con_imge_filepath, con_name, con_price from content where cate_code=4';
       conn.query(sql2, function(err, content){
         if(err) {
           console.log(err);
           res.status(500).send('Internal Server Error');
         } else {
           res.render('Category4.ejs', {layout:true, contents : contents, content : content});
         }
       })
   });
 });
 /*
 app.get('/CategoryContent4', function(req, res){
   var cate_code = 4;
   var start_page = (req.query.page-1)*3;
     var sql1 = 'set @a=?';
     conn.query(sql1, [start_page], function(err, con1){
       var sql2 = 'prepare stmt from \'select con_imge_filepath, con_name, con_price from content where cate_code=? limit ?, 3\';';
       conn.query(sql2, [cate_code], function(err, con2){
         var sql3 = 'execute stmt using @a;';
         conn.query(sql3, function(err, content){
           if(err) {
             console.log(err);
             res.status(500).send('Internal Server Error');
           } else {
             res.render('CategoryContent4.ejs', {layout:true, content : content});
           }
         });
       })
     })
   });
*/
 app.get('/search_result', function(req, res){//메인페이지(CON_NAME값을 통하여 글 내용을 볼 수 있음)
  var searchWord = "%"+req.query.searchWord+"%";
  console.log(searchWord);
  var sql = 'SELECT rank, con_name from (select ( @rank := @rank + 1 ) AS rank, con_name FROM content AS a, (SELECT @rank := 0 ) AS b ORDER BY a.con_download DESC) RANK WHERE rank <=5';
  conn.query(sql, function(err, contents, fields){
    var sql = 'SELECT con_imge_filepath, con_name, con_price from content where con_name LIKE ?';
    conn.query(sql, [searchWord], function(err, content, fields){
      if(err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        res.render('search_result.ejs', {layout:true, contents : contents, content : content});
      }
    });
  });
 });
 app.get('/search_result_content', function(req, res){
   var searchWord = "%"+req.query.searchWord+"%";
   var start_page = ((req.query.page||1)-1)*2;
   conn.query(
     'SELECT * FROM `content` WHERE `con_name` LIKE ? LIMIT ?, 2',
     [searchWord, start_page],
     function(err, content, fields) {
       if(err) {
         console.log(err);
         res.status(500).send('Internal Server Error');
       } else {
         res.render('search_result_content.ejs', {layout:true, content:content});
       }
     }
   );
 });

/*수진*/
app.post('/login', passport.authenticate('local',
        {
          successRedirect: '/main',
          failureRedirect: '/login',
          failureFlash: false
        }
      )
    );
    app.get('/facebook',passport.authenticate('facebook',
        {scope:'email'}
      )
    );
    app.get('/facebook/callback',passport.authenticate('facebook',
        {
          successRedirect: '/main',
          failureRedirect: '/login'
        }
      )
    );
    var users = [
      {
        authId:'local:egoing',
        username:'egoing',
        password:'mTi+/qIi9s5ZFRPDxJLY8yAhlLnWTgYZNXfXlQ32e1u/hZePhlq41NkRfffEV+T92TGTlfxEitFZ98QhzofzFHLneWMWiEekxHD1qMrTH1CWY01NbngaAfgfveJPRivhLxLD1iJajwGmYAXhr69VrN2CWkVD+aS1wKbZd94bcaE=',
        salt:'O0iC9xqMBUVl3BdO50+JWkpvVcA5g2VNaYTR5Hc45g+/iXy4PzcCI7GJN5h5r3aLxIhgMN8HSh0DhyqwAp8lLw==',
        name:'Egoing',
        email:'egoing@naver.com',
        phone_num:'010-8740-2820',
      }
    ];
    /*---register기능_mysql로 구현---*/
   app.post('/register_step3', function(req, res){
      hasher({password:req.body.password}, function(err, pass, salt, hash){
        var user = {
          authId:'local:'+req.body.username,
          username:req.body.username,
          password:hash,
          salt:salt,
          name:req.body.name,
          email:req.body.email,
          phone_num:req.body.phone_num,
          child_old:req.body.child_old,
          favorite1:req.body.favorite1,
          favorite2:req.body.favorite2,
          favorite3:req.body.favorite3,
          favorite4:req.body.favorite4  //..Right?
        };
        var sql ='INSERT INTO users SET ?';  //mysql에 상에 가입한 정보를 insert
        conn.query(sql, user, function(err, results){
          if(err)
          {
            console.log(err);
            res.status(500);
          }else{
           req.login(user, function(err){
             req.session.save(function(){
               res.redirect('/main');
             });
           });
          }
        });
      });
    });
app.get('/register_step1',function(req, res){
   res.render('register_step1.html');
});
app.post('/register_step1',function(req, res){//submit할때, post need!!
       res.redirect('/register_step2');
});
app.get('/register_step2',function(req, res){
 res.render('register_step2.html');
});
app.get('/register_step2_result',function(req, res){
  res.render('register_step2_result.html');
});
app.get('/register_step3',function(req, res){
 res.render('register_step3.html');
});
app.post('/register_step2',function(req, res){
  var user=user;
  var email=req.body.email;
  if(email){
   res.redirect('/register_step2_result');
  var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "tnwls2820@gmail.com",
        pass: "rkfcl60434"
    }
  });
  var mailOptions = {
    from: '안수진 <tnwls2820@gmail.com>',
    to: email,
    subject: '회원가입 이메일인증 _Smart Player',
    html:
    '<h1>회원가입 이메일인증_Smart Player</h1><br>인증을 하기 위해서는 하단의 링크를 클릭해주세요.</br><br><a href="http://localhost:3003/register_step3"style="margin-left:80px;">회원가입 인증완료</a></br><p><img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Player_%28logo1%29.jpg"/></p>'
  };
  smtpTransport.sendMail(mailOptions, function(error, response){
    if (error){
        console.log(error);
    } else { //uer에 대한 일치 여부 확인 @ _실패시 send하지 않고, search_PW_fail 호출하기
        console.log("Message sent : " + response.message);
    }
    smtpTransport.close();
    });
  }
});

app.get('/login',function(req, res){
      res.render('login.html');
});
app.get('/logout', function(req, res){
      req.logout();
      req.session.save(function(){
        res.redirect('/main');
      });
});
app.get('/mypage',function(req, res){
        res.render('mypage.html');
});
app.get('/mypage_info',function(req, res){  //only get 방식!!
                var sql='SELECT username, name, email, phone_num, child_old FROM users';
                conn.query(sql ,function(err, user, fields){
               if(err){
               console.log(err);
               res.status(500).send('Internal Server Error');
              }else{
               res.render('mypage_info.ejs',
               { layout:true,
                 user:user,
                 username:req.user.username,
                 name:req.user.name,
                 email:req.user.email,
                 phone_num:req.user.phone_num,
                 child_old:req.user.child_old
               });
           }
         });
});

app.get('/mypage_modify',function(req, res){
          var sql='SELECT username, name, email, phone_num, child_old FROM users';
          conn.query(sql ,function(err, user, fields){
         if(err){
         console.log(err);
         res.status(500).send('Internal Server Error');
        }else{
           res.render('mypage_modify.ejs',
           { layout:true,
            user:user,
            username:req.user.username,
            name:req.user.name,
            email:req.user.email,
            phone_num:req.user.phone_num,
            child_old:req.user.child_old
          });

     }
   });
 });

app.post('/mypage_modify', function(req, res){
    var sql ='UPDATE users SET email=?, phone_num=?, child_old=? WHERE username=?';
    var username=req.user.username;
    var email=req.body.email;
    var phone_num=req.body.phone_num;
    var child_old=req.body.child_old;
    conn.query(sql, [email, phone_num, child_old, username], function(err, result, fields){
             if(err)
             {
               console.log(err);
               res.status(500);
             }else{
                  res.redirect('/mypage_info');
                }
              });

});
app.get('/mypage_button',function(req, res){
    res.render('mypage_button.html');
});
app.get('/search',function(req, res){
    res.render('search.html');
});
app.get('/search_ID',function(req, res){
    res.render('search_ID.html');
});
//@2018.09.06
var check1 =" ";
var check2 =" ";
var check3 =" ";
app.post('/search_ID',function(req, res){//submit할때, post need!!
    var user=user;
    var name=req.body.name;
    var email=req.body.email;
    var phone_num=req.body.phone_num;
    if(name && email && phone_num){
         check1= name;
         check2= email;
         check3= phone_num;
         res.redirect('/search_ID_result');
       }
});
  /* 세가지 요소와 맞는지 대조 need or name과 휴대폰 인증을 사용하기
  app.post('/search_ID', passport.authenticate('local',
          {
            successRedirect: '/search_ID_result',
            failureRedirect: '/search',
            failureFlash: false
          }
        )
      );*/
app.get('/search_ID_result', function(req, res){  //only get 방식!!
          var sql='SELECT username, name FROM users WHERE name=? AND email=? AND phone_num=?';
          conn.query(sql ,[check1, check2, check3], function(err, user, fields){
          if(err){
          console.log(err);
          res.status(500).send('error.');
        }else{
          if(user[0]) //uer에 대한 일치 여부 확인 @ _현대는 다 들어간다...
        {
        res.render('search_ID_result.ejs',
        { layout:true,
          user:user,
          username:user[0].username  // user는 잘 찍힘..(일치하지 않을 경우, user가 찍히지 x)ㅠㅠ why??
        });
        //console.log(user[0].username); test 용도
        }else{ //일치하지 않을 경우
           res.redirect('/search_ID_fail');

      }
    }
   });
});
//@2018.09.06------------------
  /*if(req.params.search_ID) {
    res.send(`
      <head>
          <link rel="stylesheet" type="text/css" href="css/button.css"></link>
     </head>
      <h1>Hello, ${req.params.username}</h1>
       <div style="text-align:right">
           <a href="/mypage"> <button type ="button" class="btn_mypage" style="margin:10px;">MyPage</button></a>
           <a href="/logout"> <button type ="button" class="btn_logout" style="margin:10px;">로그아웃</button></a>
      </div>

    `);
  }
  else{
    res.send(`
     <head>
      <link rel="stylesheet" type="text/css" href="css/button.css"></link>
    </head>
      <h1>Welcome</h1>
      <div style="text-align:right">
           <a href="/login"> <button type ="button" class="btn_login" style="margin:10px;">로그인</button></a>
           <a href="/register_step1"> <button type ="button" class="btn_register" style="margin:10px;">회원가입</button></a>
       </div>
    `);
  }
*/


app.get('/mypage_info',function(req, res){  //only get 방식!!
            var sql='SELECT username, name, email, phone_num, child_old FROM users';
            conn.query(sql ,function(err, user, fields){
           if(err){
           console.log(err);
           res.status(500).send('Internal Server Error');
          }else{
           res.render('mypage_info.ejs',
           { layout:true,
             user:user,
             username:req.user.username,
             name:req.user.name,
             email:req.user.email,
             phone_num:req.user.phone_num,
             child_old:req.user.child_old
           });
       }
     });
    });
/*naver 검수용
    app.get('/register_step4',function(req, res){
     res.render('register_step4.html');
    });
    app.get('/register_step5',function(req, res){
     res.render('register_step5.html');
    });
*/
app.get('/search_PW',function(req, res){
  res.render('search_PW.html');
});
app.get('/search_PW_result',function(req, res){
  res.render('search_PW_result.html');
});

//@2018.09.06
var check4=" ";
var check5=" ";
var check6=" ";
var check7={};
app.post('/search_PW',function(req, res){
  var user=user;
  var username=req.body.username;
  var name=req.body.name;
  var email=req.body.email;
  if(username && name && email){
    check4 = username;
    check5= name;
    check6 = email;
  }
  var sql='SELECT email, username FROM users WHERE username=? AND name=? AND email=?';
  conn.query(sql ,[check4, check5, check6], function(err, user, fields){
  if(err){
  console.log(err);
  res.status(500).send('error.');
  }else{
    if(user[0]) //uer에 대한 일치 여부 확인 @ _현대는 다 들어간다...
    {
      check7[0] = user[0].username;
  res.redirect('/search_PW_result');
  var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "tnwls2820@gmail.com",
        pass: "rkfcl60434"
    }
  });
  var mailOptions = {
    from: '안수진 <tnwls2820@gmail.com>',
    to: user[0].email,
    subject: '비밀번호 재설정_Smart Player',

    html:
    '<h1>비밀번호 재설정_Smart Player</h1><br>'+check4+'님 안녕하세요! <br></br>인증을 하기 위해서는 하단의 링크를 클릭해주세요.</br><br><a href="http://localhost:3003/setting_PW"style="margin-left:80px;">비밀번호 재설정</a></br><p><img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/Player_%28logo1%29.jpg"/></p>'
  };   //해당링크를 한번만 사용가능!!->just 변수 use함
  smtpTransport.sendMail(mailOptions, function(error, response){
    if (error){
        console.log(error);
    } else { //uer에 대한 일치 여부 확인 @ _실패시 send하지 않고, search_PW_fail 호출하기
        console.log("Message sent : " + response.message);
    }
    smtpTransport.close();
    });
  }else{ //일치하지 않을 경우
     res.redirect('/search_PW_fail');

   }
}
});
});
//@2018.09.06-------------
app.get('/setting_PW', function(req, res){
        res.render('setting_PW.html');
});
app.get('/setting_PW_result', function(req, res){ //get only_me
        res.render('setting_PW_result.html');
});
//@2018.09.06
app.post('/setting_PW', function(req, res){
  console.log(check7[0]);
  console.log('here');

  if(check7[0]){
    hasher({password:req.body.password}, function(err, pass, salt, hash){
      var password=hash;
      var salt=salt;
    var sql ='UPDATE users SET password =?, salt =? WHERE username=?';  //Where username=? 추가 필요!_현재 username만을 보고서 수정한다_기타 요소 검사 need
    conn.query(sql, [password, salt, check7[0]], function(err, result, fields){
             if(err)
             {
               console.log(err);
               res.status(500);
             }else{
                res.redirect('/setting_PW_result');
             }
              });
              check7={};
            });
   }else{
       res.redirect('/main'); //direct로 접근x search_PW 한 사용자만이 비번을 change가능
   }
 });
 //@2018.09.06-----------------
app.get('/search_ID_fail', function(req, res){ //get only_me
        res.render('search_ID_fail.html');
});
app.get('/search_PW_fail', function(req, res){ //get only_me
        res.render('search_PW_fail.html');
});


var server= app.listen(3003, function(){
  console.log('Server Start');
});
