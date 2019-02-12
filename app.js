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

//socket.io
const io = require("socket.io")(server);
io.on("connection", function(socket) {
    console.log('=========> Socket ID : ' + socket.id);
    
    //연결되어 있는 클라이언트 소켓으로부터 들어오는 "SEND_MESSAGE" 이름의 이벤트에 대해 이벤트 처리를 한다.
    socket.on("SEND_MESSAGE", function(data) {
        console.log(data);
        //io.emit("MESSAGE", data);
        socket.broadcast.emit("MESSAGE", data);
    });
});
