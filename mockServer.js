var http=require("http");
var mockData=JSON.stringify(require("./4.json"));
var server=http.createServer(function(req,res){
  setTimeout(function(){
    res.end(mockData);
  },Math.round(Math.random()*2+1)*1000)
  
});


server.listen(9999);