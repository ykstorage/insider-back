var http = require("http"),
    path = require("path"),
    methods = require("methods"),
    express = require("express"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    cors = require("cors"),
    passport = require("passport"),
    errorhandler = require("errorhandler"),
    mongoose = require("mongoose");

var isProduction = process.env.NODE_ENV === "production";

// Create global app object
var app = express();

app.use(cors());

// Normal express config defaults
app.use(require("morgan")("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require("method-override")());
app.use(express.static(__dirname + "/public"));

app.use(
    session({
        secret: "conduit",
        cookie: { maxAge: 60000 },
        resave: false,
        saveUninitialized: false
    })
);

if (!isProduction) {
    app.use(errorhandler());
}

if (isProduction) {
    mongoose.connect(process.env.MONGODB_URI);
} else {
    mongoose.connect("mongodb://localhost/conduit");
    mongoose.set("debug", true);
}

require("./models/User");
require("./models/Article");
require("./models/Comment");
require("./models/Chatting");
require("./config/passport");

app.use(require("./routes"));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (!isProduction) {
    app.use(function(err, req, res, next) {
        console.log(err.stack);

        res.status(err.status || 500);

        res.json({
            errors: {
                message: err.message,
                error: err
            }
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        errors: {
            message: err.message,
            error: {}
        }
    });
});

// finally, let's start our server...
var server = app.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port " + server.address().port);
});

var Chatting = mongoose.model("Chatting");

//socket.io
const io = require("socket.io")(server);
io.on("connection", function(socket) {
    console.log('=========> Socket ID : ' + socket.id);
    
    //DB에서 데이터 불러와야함
    //불러오려면 구분자 있어야할듯 room?
    Chatting.find(function (err, result) {
        for(let i = 0 ; i < result.length ; i++) {
            let dbData = {author : result[i].author, type : result[i].type, data: result[i].data };
            io.sockets.sockets[socket.id].emit('preload', dbData);
        }
    });

    //연결되어 있는 클라이언트 소켓으로부터 들어오는 "SEND_MESSAGE" 이름의 이벤트에 대해 이벤트 처리를 한다.
    socket.on("SEND_MESSAGE", function(data) {
        console.log(data);
        
        let chat = new Chatting({ author: data.author, type: data.type, data: data.data });
        chat.save(function (err, data) {
            if (err) {// TODO handle the error
                console.log("error");
                console.log(err);
            }else{
                //console.log('insert success!!');
            }
        });
        
        //나를 제외한 모두에게 메세지 전송
        socket.broadcast.emit("MESSAGE", data);
    });
});
